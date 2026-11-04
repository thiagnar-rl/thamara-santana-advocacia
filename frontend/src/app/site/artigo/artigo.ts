import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { dataPorExtenso, linkWhatsApp, paragrafos, tempoDeLeitura } from '../../core/logica/site.logica';
import { PublicacaoSite } from '../../core/models';
import { Icone } from '../../shared/icone/icone';
import { AVISO_LEGAL, CONTATO, ESCRITORIO } from '../conteudo';

/**
 * Página de uma publicação do escritório (texto completo).
 * [F7] Solicitado por: Thiago Rinaldi Luna (04/11/2026).
 */
@Component({
  selector: 'app-artigo-site',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artigo.html',
  styleUrl: './artigo.scss',
})
export class ArtigoSite {
  private api = inject(ApiService);
  private titulo = inject(Title);

  /** Vem da rota /noticias/:id */
  readonly id = input.required<string>();

  protected readonly escritorio = ESCRITORIO;
  protected readonly aviso = AVISO_LEGAL;
  protected readonly whatsapp = linkWhatsApp(CONTATO.whatsapp, CONTATO.mensagemWhatsapp);

  protected readonly publicacao = signal<PublicacaoSite | null>(null);
  protected readonly estado = signal<'carregando' | 'ok' | 'nao-encontrada'>('carregando');

  protected readonly paragrafos = computed(() => paragrafos(this.publicacao()?.conteudo));
  protected readonly data = computed(() => dataPorExtenso(this.publicacao()?.publicado_em));
  protected readonly leitura = computed(() => tempoDeLeitura(this.publicacao()?.conteudo));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => {
        this.estado.set('carregando');
        this.api.publicacaoDoSite(id).subscribe({
          next: (p) => {
            this.publicacao.set(p);
            this.estado.set('ok');
            this.titulo.setTitle(`${p.titulo} · Thamara Santana Advocacia`);
          },
          error: () => this.estado.set('nao-encontrada'),
        });
      });
    });
  }
}
