import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { areaPorSlug, linkWhatsApp, mensagemWhatsAppArea, mensagemWhatsAppPergunta } from '../../core/logica/site.logica';
import { Icone } from '../../shared/icone/icone';
import { AREAS_THAMARA, AVISO_LEGAL, CONTATO, PERGUNTAS, TODAS_AS_AREAS } from '../conteudo';

/**
 * Página de uma área de atuação (/atuacao/familia-e-sucessoes, /atuacao/civel...).
 * [F11] Solicitado por: Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna.
 * Ajuda o Google a mostrar o escritório em buscas como "advogado trabalhista Guarujá".
 */
@Component({
  selector: 'app-area-site',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './area.html',
  styleUrl: './area.scss',
})
export class AreaSite {
  private titulo = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);

  /** Vem da rota (withComponentInputBinding). */
  readonly slug = input<string>('');

  protected readonly area = computed(() => areaPorSlug(TODAS_AS_AREAS, this.slug()));
  protected readonly daThamara = computed(() => AREAS_THAMARA.some((a) => a.slug === this.area()?.slug));
  protected readonly perguntas = computed(() => {
    const areas = this.area()?.areasPerguntas ?? [];
    return PERGUNTAS.filter((q) => areas.includes(q.area));
  });
  protected readonly outras = computed(() => TODAS_AS_AREAS.filter((a) => a.slug !== this.area()?.slug));
  protected readonly whatsapp = computed(() => linkWhatsApp(CONTATO.whatsapp, mensagemWhatsAppArea(this.area()?.nome ?? '')));
  protected readonly aviso = AVISO_LEGAL;

  protected linkPergunta(pergunta: string): string {
    return linkWhatsApp(CONTATO.whatsapp, mensagemWhatsAppPergunta(pergunta));
  }

  constructor() {
    // Ao sair da página, volta a descrição e o título de compartilhamento originais do site
    const descricao = this.meta.getTag('name="description"')?.content ?? '';
    const ogTitulo = this.meta.getTag('property="og:title"')?.content ?? '';
    inject(DestroyRef).onDestroy(() => {
      this.meta.updateTag({ name: 'description', content: descricao });
      this.meta.updateTag({ property: 'og:title', content: ogTitulo });
    });

    effect(() => {
      const a = this.area();
      if (!a) {
        this.router.navigate(['/'], { replaceUrl: true });
        return;
      }
      this.titulo.setTitle(`${a.nome} · Advocacia em Guarujá/SP · Thamara Santana`);
      this.meta.updateTag({ name: 'description', content: `${a.nome} em Guarujá, Santos, São Vicente e Praia Grande: ${a.descricao}` });
      this.meta.updateTag({ property: 'og:title', content: `${a.nome} · Thamara Santana Advocacia` });
    });
  }
}
