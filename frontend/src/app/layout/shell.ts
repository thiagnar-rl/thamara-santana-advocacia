import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ConfirmacaoService } from '../core/confirmacao.service';
import { EdicaoService } from '../core/edicao.service';
import { iniciais } from '../core/logica/painel.logica';
import { perguntaSaida } from '../core/logica/sessao.logica';
import { ClienteModal } from '../shared/cliente-modal/cliente-modal';
import { Confirmacao } from '../shared/confirmacao/confirmacao';
import { CompromissoModal } from '../shared/compromisso-modal/compromisso-modal';
import { Icone } from '../shared/icone/icone';
import { ProcessoModal } from '../shared/processo-modal/processo-modal';

/** Estrutura das telas internas: menu lateral + conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icone, CompromissoModal, ProcessoModal, ClienteModal, Confirmacao],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected auth = inject(AuthService);
  protected edicao = inject(EdicaoService);
  protected confirmacao = inject(ConfirmacaoService);
  private api = inject(ApiService);

  protected readonly menu = [
    { rota: '/inicio', rotulo: 'Início', icone: 'painel' },
    { rota: '/agenda', rotulo: 'Agenda', icone: 'calendario' },
    { rota: '/processos', rotulo: 'Processos', icone: 'pasta' },
    { rota: '/clientes', rotulo: 'Clientes', icone: 'clientes' }, // [F6]
  ];

  /** [F6] Quantos clientes fazem aniversário hoje (bolinha dourada no menu "Clientes"). */
  protected readonly aniversariosHoje = signal(0);

  protected readonly iniciais = computed(() => iniciais(this.auth.usuario()?.nome));

  constructor() {
    effect(() => {
      this.api.versao();
      untracked(() =>
        this.api.aniversariantes(0).subscribe({
          next: (lista) => this.aniversariosHoje.set(lista.length),
          error: () => this.aniversariosHoje.set(0),
        }),
      );
    });
  }

  /**
   * [C2] Pede confirmação antes de sair do sistema.
   * Solicitado por: Thamara Santana (teste de 30/10/2026) — antes, "Sair" desconectava na hora.
   */
  protected async sair(): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      ...perguntaSaida(this.edicao.formularioAberto()),
      icone: 'sair',
      tom: 'neutro',
    });
    if (sim) this.auth.sair();
  }

}
