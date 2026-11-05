import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ConfirmacaoService } from '../core/confirmacao.service';
import { EdicaoService } from '../core/edicao.service';
import { AvisoService } from '../core/aviso.service';
import { GoogleService } from '../core/google.service';
import { avisoDaConexao, textoSituacaoGoogle } from '../core/logica/google.logica';
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
  /** [F8] Google Agenda — pedido de Thamara Santana (cliente) (04/11/2026). */
  protected google = inject(GoogleService);
  protected readonly textoGoogle = computed(() => textoSituacaoGoogle(this.google.situacao()));

  /** "curto" = nome usado na barra inferior do celular, quando o normal não cabe. */
  protected readonly menu: { rota: string; rotulo: string; curto?: string; icone: string }[] = [
    { rota: '/sistema/inicio', rotulo: 'Início', icone: 'painel' },
    { rota: '/sistema/agenda', rotulo: 'Agenda', icone: 'calendario' },
    { rota: '/sistema/processos', rotulo: 'Processos', icone: 'pasta' },
    { rota: '/sistema/clientes', rotulo: 'Clientes', icone: 'clientes' }, // [F6]
    { rota: '/sistema/publicacoes', rotulo: 'Publicações', curto: 'Notícias', icone: 'jornal' }, // [F7]
  ];

  /** [F6] Quantos clientes fazem aniversário hoje (bolinha dourada no menu "Clientes"). */
  protected readonly aniversariosHoje = signal(0);

  protected readonly iniciais = computed(() => iniciais(this.auth.usuario()?.nome));

  constructor() {
    // [F8] Sincroniza com o Google Agenda enquanto o sistema estiver aberto
    this.google.iniciar(inject(DestroyRef));
    // [F8] Volta do login do Google: mostra o aviso e limpa o endereço
    const parametros = new URLSearchParams(window.location.search);
    const aviso = avisoDaConexao(parametros.get('google'));
    if (aviso) {
      const avisos = inject(AvisoService);
      if (aviso.tipo === 'sucesso') avisos.sucesso(aviso.texto);
      else avisos.erro(aviso.texto);
      inject(Router).navigate([], { queryParams: { google: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }

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
