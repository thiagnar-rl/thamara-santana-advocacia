import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/auth.service';
import { linkInstagram, linkMapa, linkWhatsApp, listarComE } from '../core/logica/site.logica';
import { Icone } from '../shared/icone/icone';
import { AVISO_LEGAL, CONTATO, ESCRITORIO } from './conteudo';

/**
 * Estrutura do site institucional: topo com menu, rodapé e botão do WhatsApp.
 * [F7] Solicitado por: Thamara Santana (cliente) (04/11/2026).
 */
@Component({
  selector: 'app-site-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-layout.html',
  styleUrl: './site-layout.scss',
  host: {
    class: 'site',
    '(window:scroll)': 'aoRolar()',
  },
})
export class SiteLayout {
  protected auth = inject(AuthService);

  protected readonly escritorio = ESCRITORIO;
  protected readonly contato = CONTATO;
  protected readonly aviso = AVISO_LEGAL;
  protected readonly ano = new Date().getFullYear();
  protected readonly cidades = listarComE(CONTATO.cidadesAtendidas);

  protected readonly whatsapp = linkWhatsApp(CONTATO.whatsapp, CONTATO.mensagemWhatsapp);
  protected readonly instagram = linkInstagram(CONTATO.instagram);
  protected readonly mapa = linkMapa(CONTATO.endereco.busca);

  protected readonly menu = [
    { rotulo: 'Início', rota: '/', fragmento: undefined },
    { rotulo: 'Sobre', rota: '/', fragmento: 'sobre' },
    { rotulo: 'Atuação', rota: '/', fragmento: 'atuacao' },
    { rotulo: 'Dúvidas', rota: '/', fragmento: 'duvidas' }, // [F10]
    { rotulo: 'Notícias', rota: '/noticias', fragmento: undefined },
    { rotulo: 'Contato', rota: '/', fragmento: 'contato' },
  ];

  /** Menu do celular aberto? */
  protected readonly menuAberto = signal(false);
  /** A página já rolou um pouco? (o topo ganha sombra) */
  protected readonly rolou = signal(false);

  constructor() {
    // Fecha o menu do celular ao trocar de página
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (e instanceof NavigationEnd) this.menuAberto.set(false);
      });
  }

  protected aoRolar(): void {
    this.rolou.set(window.scrollY > 24);
  }

  protected alternarMenu(): void {
    this.menuAberto.update((v) => !v);
  }
}
