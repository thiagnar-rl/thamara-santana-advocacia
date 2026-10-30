import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoProcesso, EdicaoService } from '../../core/edicao.service';
import { encontrarClientePorNome } from '../../core/logica/clientes.logica';
import { formatarNumeroCNJ, validarProcesso } from '../../core/logica/formularios.logica';
import { Cliente, ProcessoForm } from '../../core/models';
import { AREAS, STATUS_PROCESSO } from '../../core/rotulos';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-processo-modal',
  imports: [FormsModule, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './processo-modal.html',
  host: { '(document:keydown.escape)': 'aoApertarEsc()' },
})
export class ProcessoModal implements OnInit {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  private edicao = inject(EdicaoService);
  private detector = inject(ChangeDetectorRef);

  readonly dados = input.required<EdicaoProcesso>();
  readonly fechar = output<void>();

  protected readonly areas = AREAS;
  protected readonly status = STATUS_PROCESSO;
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');
  protected readonly campoInvalido = signal<'numero' | 'cliente' | null>(null);
  /** [F6] Clientes cadastrados (sugestões do campo "Cliente"). */
  protected readonly clientes = signal<Cliente[]>([]);

  protected form: ProcessoForm = {
    numero: '',
    cliente: '',
    cliente_id: null,
    parte_contraria: '',
    tribunal: '',
    area: '',
    status: 'ativo',
    observacoes: '',
  };

  get editando(): boolean {
    return this.dados().processo !== null;
  }

  ngOnInit(): void {
    const p = this.dados().processo;
    if (p) {
      this.form = {
        numero: p.numero,
        cliente: p.cliente,
        cliente_id: p.cliente_id ?? null,
        parte_contraria: p.parte_contraria ?? '',
        tribunal: p.tribunal ?? '',
        area: p.area ?? '',
        status: p.status,
        observacoes: p.observacoes ?? '',
      };
    }
    // [F6] "Novo processo" aberto a partir da ficha do cliente
    const cliente = this.dados().cliente;
    if (!p && cliente) {
      this.form.cliente = cliente.nome;
      this.form.cliente_id = cliente.id;
    }
    this.api.listarClientes().subscribe((lista) => {
      this.clientes.set(lista);
      // Processo antigo, digitado à mão: liga sozinho se já existir cliente com o mesmo nome.
      if (!this.form.cliente_id) this.aoDigitarCliente(this.form.cliente);
    });
  }

  /**
   * [F6] Liga o processo ao cliente cadastrado quando o nome digitado (ou escolhido
   * na lista de sugestões) for igual ao de um cliente. Solicitado por Thamara Santana (30/10/2026).
   */
  protected aoDigitarCliente(nome: string): void {
    const cliente = encontrarClientePorNome(this.clientes(), nome);
    this.form.cliente_id = cliente?.id ?? null;
    if (cliente) this.form.cliente = cliente.nome;
    if (this.campoInvalido() === 'cliente') {
      this.campoInvalido.set(null);
      this.erro.set('');
    }
  }

  /** Esc fecha o formulário — mas não quando o cadastro de cliente está aberto por cima dele. [F6] */
  protected aoApertarEsc(): void {
    if (!this.edicao.cliente()) this.fechar.emit();
  }

  /** [F6] Abre o cadastro de cliente com o nome já digitado; ao salvar, já fica selecionado aqui. */
  protected cadastrarCliente(): void {
    this.edicao.novoCliente({
      nomeSugerido: this.form.cliente,
      aoSalvar: (c) => {
        this.clientes.update((lista) => [...lista, c]);
        this.form.cliente = c.nome;
        this.form.cliente_id = c.id;
        this.detector.markForCheck();
      },
    });
  }

  /**
   * [C1] Aplica a máscara CNJ enquanto a usuária digita ou cola o número.
   * Solicitado por: Mariana Couto (teste de usuário de 29/10/2026).
   */
  protected digitarNumero(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const formatado = formatarNumeroCNJ(campo.value);
    campo.value = formatado;
    this.form.numero = formatado;
    if (this.campoInvalido() === 'numero') {
      this.campoInvalido.set(null);
      this.erro.set('');
    }
  }

  protected salvar(): void {
    const { erro, campo } = validarProcesso(this.form);
    this.erro.set(erro ?? '');
    this.campoInvalido.set(campo);
    if (erro) return;

    this.salvando.set(true);
    const atual = this.dados().processo;
    const requisicao = atual
      ? this.api.atualizarProcesso(atual.id, this.form)
      : this.api.criarProcesso(this.form);

    requisicao.subscribe({
      next: (salvo) => {
        this.avisos.sucesso(atual ? 'Processo atualizado' : 'Processo cadastrado');
        this.api.avisarMudanca();
        this.fechar.emit();
        if (!atual) this.router.navigate(['/processos', salvo.id]);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }
}
