import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { mensagemDeErro } from './auth.interceptor';
import { AvisoService } from './aviso.service';
import { ConfirmacaoService } from './confirmacao.service';
import { resumoSincronizacao } from './logica/google.logica';
import { SituacaoGoogle } from './models';

/** De quanto em quanto tempo o sistema confere se algo mudou no Google, com a tela aberta. */
const INTERVALO_MS = 5 * 60_000;

/**
 * [F8] Conexão com o Google Agenda — pedido de Thiago Rinaldi Luna (04/11/2026).
 * Guarda a situação da conexão e traz as mudanças do Google ao abrir o sistema,
 * a cada 5 minutos e quando a usuária volta para a aba do navegador.
 */
@Injectable({ providedIn: 'root' })
export class GoogleService {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private confirmacao = inject(ConfirmacaoService);

  readonly situacao = signal<SituacaoGoogle | null>(null);
  readonly sincronizando = signal(false);
  private iniciado = false;

  /** Chamado pelo menu do sistema (Shell). */
  iniciar(destruir: DestroyRef): void {
    if (this.iniciado) return;
    this.iniciado = true;
    this.atualizar(true);
    const relogio = setInterval(() => this.sincronizar(), INTERVALO_MS);
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') this.sincronizar();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    destruir.onDestroy(() => {
      clearInterval(relogio);
      document.removeEventListener('visibilitychange', aoVoltar);
      this.iniciado = false;
    });
  }

  /** Busca a situação; se estiver conectada, já sincroniza. */
  atualizar(sincronizarDepois = false): void {
    this.api.situacaoGoogle().subscribe({
      next: (s) => {
        this.situacao.set(s);
        if (sincronizarDepois && s.conectado) this.sincronizar();
      },
      error: () => this.situacao.set(null),
    });
  }

  /** Traz as mudanças do Google. Se algo mudou, as telas recarregam. */
  sincronizar(forcar = false): void {
    if (!this.situacao()?.conectado || this.sincronizando()) return;
    this.sincronizando.set(true);
    this.api.sincronizarGoogle(forcar).subscribe({
      next: (r) => {
        this.sincronizando.set(false);
        const resumo = resumoSincronizacao(r);
        if (resumo) {
          this.avisos.sucesso(resumo);
          this.api.avisarMudanca();
        } else if (forcar && r.feita) {
          this.avisos.sucesso('Google Agenda em dia.');
        }
        if (r.erro || forcar) this.atualizar();
      },
      error: (e) => {
        this.sincronizando.set(false);
        if (forcar) this.avisos.erro(mensagemDeErro(e));
        this.atualizar();
      },
    });
  }

  /** Abre a página do Google para a usuária escolher a conta e autorizar. */
  conectar(): void {
    this.api.conectarGoogle().subscribe({
      next: ({ url }) => (window.location.href = url),
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }

  async desconectar(): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Desconectar o Google Agenda?',
      mensagem: 'O sistema para de sincronizar com o Google.',
      detalhe: 'Os eventos que já estão no Google continuam lá, e os compromissos continuam no sistema.',
      botao: 'Desconectar',
      icone: 'sair',
      tom: 'neutro',
    });
    if (!sim) return;
    this.api.desconectarGoogle().subscribe({
      next: () => {
        this.avisos.sucesso('Google Agenda desconectada.');
        this.atualizar();
      },
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }
}
