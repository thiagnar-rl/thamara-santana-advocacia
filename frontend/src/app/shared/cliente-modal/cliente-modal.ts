import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoCliente } from '../../core/edicao.service';
import {
  CampoCliente,
  ESTADOS_CIVIS,
  TIPOS_PESSOA,
  UFS,
  clienteVazio,
  formDoCliente,
  mascaraCEP,
  mascaraCNPJ,
  mascaraCPF,
  mascaraTelefone,
  somenteDigitos,
  validarCliente,
} from '../../core/logica/clientes.logica';
import { ClienteForm, TipoPessoa } from '../../core/models';
import { hojeISO } from '../../core/rotulos';
import { Icone } from '../icone/icone';

type Mascara = 'cpf' | 'cnpj' | 'cep' | 'telefone';

const MASCARAS: Record<Mascara, (valor: string) => string> = {
  cpf: mascaraCPF,
  cnpj: mascaraCNPJ,
  cep: mascaraCEP,
  telefone: mascaraTelefone,
};

/**
 * CONTROLLER do formulário de cliente (VIEW: cliente-modal.html).
 * [F6] Cadastro individual de clientes — solicitado por Thamara Santana (teste de 30/10/2026).
 */
@Component({
  selector: 'app-cliente-modal',
  imports: [FormsModule, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cliente-modal.html',
  styleUrl: './cliente-modal.scss',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
})
export class ClienteModal implements OnInit {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  private detector = inject(ChangeDetectorRef);

  readonly dados = input.required<EdicaoCliente>();
  readonly fechar = output<void>();

  protected readonly tipos = TIPOS_PESSOA;
  protected readonly estadosCivis = ESTADOS_CIVIS;
  protected readonly ufs = UFS;
  protected readonly hoje = hojeISO();

  protected readonly salvando = signal(false);
  protected readonly buscandoCep = signal(false);
  protected readonly erro = signal('');
  protected readonly campoInvalido = signal<CampoCliente | null>(null);

  protected form: ClienteForm = clienteVazio();

  get editando(): boolean {
    return this.dados().cliente !== null;
  }

  get pj(): boolean {
    return this.form.tipo === 'juridica';
  }

  ngOnInit(): void {
    const { cliente, nomeSugerido } = this.dados();
    if (cliente) this.form = formDoCliente(cliente);
    else if (nomeSugerido) this.form.nome = nomeSugerido;
  }

  protected escolherTipo(tipo: TipoPessoa): void {
    if (this.form.tipo === tipo) return;
    const { nome, ...contato } = this.form;
    this.form = { ...clienteVazio(tipo), nome, ...pegarContato(contato) };
    this.limparErro();
  }

  /** Aplica a máscara (CPF, CNPJ, CEP ou telefone) enquanto a usuária digita ou cola. */
  protected mascarar(evento: Event, campo: CampoCliente, tipo: Mascara): void {
    const caixa = evento.target as HTMLInputElement;
    const formatado = MASCARAS[tipo](caixa.value);
    caixa.value = formatado;
    (this.form as unknown as Record<string, string | null>)[campo] = formatado || null;
    if (this.campoInvalido() === campo) this.limparErro();
    if (tipo === 'cep' && somenteDigitos(formatado).length === 8) this.buscarCep(formatado);
  }

  /** Copia o número do celular para o WhatsApp. */
  protected usarCelularNoWhatsapp(): void {
    this.form.whatsapp = this.form.celular;
  }

  /**
   * Preenche rua, bairro, cidade e UF a partir do CEP (serviço público ViaCEP).
   * Só completa campos vazios e, se o serviço não responder, nada acontece.
   * Usa fetch direto (e não o HttpClient) para não enviar o login do sistema a outro site.
   */
  private async buscarCep(cep: string): Promise<void> {
    this.buscandoCep.set(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${somenteDigitos(cep)}/json/`);
      const r = (await resposta.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!r.erro) {
        this.form.logradouro ||= r.logradouro || null;
        this.form.bairro ||= r.bairro || null;
        this.form.cidade ||= r.localidade || null;
        this.form.uf ||= r.uf || null;
      }
    } catch {
      // Sem internet ou serviço fora do ar: a usuária preenche à mão.
    } finally {
      this.buscandoCep.set(false);
      this.detector.markForCheck();
    }
  }

  protected limparErro(): void {
    this.erro.set('');
    this.campoInvalido.set(null);
  }

  protected salvar(): void {
    const { erro, campo } = validarCliente(this.form, this.hoje);
    this.erro.set(erro ?? '');
    this.campoInvalido.set(campo);
    if (erro) return;

    this.salvando.set(true);
    const { cliente: atual, aoSalvar } = this.dados();
    const requisicao = atual ? this.api.atualizarCliente(atual.id, this.form) : this.api.criarCliente(this.form);

    requisicao.subscribe({
      next: (salvo) => {
        this.avisos.sucesso(atual ? 'Cliente atualizado' : 'Cliente cadastrado');
        this.api.avisarMudanca();
        this.fechar.emit();
        if (aoSalvar) aoSalvar(salvo);
        else if (!atual) this.router.navigate(['/clientes', salvo.id]);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }
}

/** Ao trocar PF ↔ PJ, mantém o que já foi digitado em contato e endereço. */
function pegarContato(f: Partial<ClienteForm>): Partial<ClienteForm> {
  const { cep, logradouro, endereco_numero, complemento, bairro, cidade, uf, telefone, celular, whatsapp, email, observacoes } = f;
  return { cep, logradouro, endereco_numero, complemento, bairro, cidade, uf, telefone, celular, whatsapp, email, observacoes };
}
