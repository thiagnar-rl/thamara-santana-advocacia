import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import {
  TIPOS_PESSOA,
  aniversarioProximo,
  documentoPrincipal,
  linkWhatsApp,
  textoAniversario,
} from '../../core/logica/clientes.logica';
import { iniciais, primeiroNome } from '../../core/logica/painel.logica';
import { Cliente, TipoPessoa } from '../../core/models';
import { Icone } from '../../shared/icone/icone';

/**
 * CONTROLLER da tela Clientes (VIEW: clientes.html + clientes.scss).
 * [F6] Cadastro individual de clientes com aviso de aniversário.
 * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */
@Component({
  selector: 'app-clientes',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
})
export class ClientesPage {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  protected edicao = inject(EdicaoService);

  protected readonly tipos = TIPOS_PESSOA;
  protected readonly documento = documentoPrincipal;
  protected readonly textoAniversario = textoAniversario;
  protected readonly aniversarioProximo = aniversarioProximo;
  protected readonly iniciais = iniciais;

  protected readonly busca = signal('');
  protected readonly tipo = signal<TipoPessoa | null>(null);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly aniversariantes = signal<Cliente[]>([]);
  protected readonly carregando = signal(true);

  /** Aniversariantes de hoje (destaque). */
  protected readonly hoje = computed(() => this.aniversariantes().filter((c) => c.aniversario?.dias === 0));

  private espera?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      this.api.versao();
      const busca = this.busca();
      const tipo = this.tipo();
      untracked(() => this.carregar(busca, tipo));
    });
    effect(() => {
      this.api.versao();
      untracked(() => this.api.aniversariantes(7).subscribe((lista) => this.aniversariantes.set(lista)));
    });
  }

  /** Espera a usuária parar de digitar antes de buscar. */
  protected digitar(valor: string): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.busca.set(valor.trim()), 250);
  }

  /** Link do WhatsApp já com a mensagem de parabéns. */
  protected parabens(c: Cliente): string | null {
    const nome = c.tipo === 'juridica' ? c.representante_nome || c.nome : c.nome;
    return linkWhatsApp(
      c.whatsapp || c.celular,
      `Olá, ${primeiroNome(nome)}! A equipe Thamara Santana Advocacia deseja um feliz aniversário! 🎉`,
    );
  }

  private carregar(busca: string, tipo: TipoPessoa | null): void {
    this.carregando.set(true);
    this.api.listarClientes(busca, tipo).subscribe({
      next: (lista) => {
        this.clientes.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.avisos.erro(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }
}
