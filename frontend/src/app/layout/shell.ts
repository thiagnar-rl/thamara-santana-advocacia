import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ConfirmacaoService } from '../core/confirmacao.service';
import { EdicaoService } from '../core/edicao.service';
import { iniciais } from '../core/logica/painel.logica';
import { perguntaSaida } from '../core/logica/sessao.logica';
import { Confirmacao } from '../shared/confirmacao/confirmacao';
import { CompromissoModal } from '../shared/compromisso-modal/compromisso-modal';
import { Icone } from '../shared/icone/icone';
import { ProcessoModal } from '../shared/processo-modal/processo-modal';

/** Estrutura das telas internas: menu lateral + conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icone, CompromissoModal, ProcessoModal, Confirmacao],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected auth = inject(AuthService);
  protected edicao = inject(EdicaoService);
  protected confirmacao = inject(ConfirmacaoService);

  protected readonly menu = [
    { rota: '/inicio', rotulo: 'Início', icone: 'painel' },
    { rota: '/agenda', rotulo: 'Agenda', icone: 'calendario' },
    { rota: '/processos', rotulo: 'Processos', icone: 'pasta' },
  ];

  protected readonly iniciais = computed(() => iniciais(this.auth.usuario()?.nome));

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
