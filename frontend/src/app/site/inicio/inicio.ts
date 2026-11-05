import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { linkInstagram, linkMapa, linkMapaIncorporado, linkWhatsApp, listarComE, tempoRelativo } from '../../core/logica/site.logica';
import { NoticiasSite } from '../../core/models';
import { Icone } from '../../shared/icone/icone';
import { AREAS_THAMARA, AREAS_EQUIPE, CONTATO, ESCRITORIO, ETAPAS, SOBRE } from '../conteudo';

/** Item da vitrine de notícias da página inicial (publicação do escritório ou notícia externa). */
interface Destaque {
  chave: string;
  titulo: string;
  resumo: string | null;
  area: string | null;
  quando: string;
  origem: string;
  /** Rota interna (publicação do escritório) ou link externo (notícia de outra fonte). */
  rota: (string | number)[] | null;
  link: string | null;
}

/**
 * Página inicial do site: apresentação, sobre, áreas de atuação, atendimento, notícias e contato.
 * [F7] Solicitado por: Thamara Santana (cliente) (04/11/2026).
 */
@Component({
  selector: 'app-inicio-site',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class InicioSite {
  private api = inject(ApiService);

  protected readonly escritorio = ESCRITORIO;
  protected readonly contato = CONTATO;
  protected readonly sobre = SOBRE;
  protected readonly areasThamara = AREAS_THAMARA; // [C5]
  protected readonly equipe = AREAS_EQUIPE;
  protected readonly etapas = ETAPAS;
  /** "Santos, São Vicente e Praia Grande" */
  protected readonly cidadesVizinhas = listarComE(CONTATO.cidadesAtendidas.slice(1));

  protected readonly whatsapp = linkWhatsApp(CONTATO.whatsapp, CONTATO.mensagemWhatsapp);
  protected readonly instagram = linkInstagram(CONTATO.instagram);
  protected readonly comoChegar = linkMapa(CONTATO.endereco.busca);
  /** Endereço fixo do mapa (definido por nós, não por quem visita) — por isso é seguro liberar no iframe. */
  protected readonly mapa = inject(DomSanitizer).bypassSecurityTrustResourceUrl(linkMapaIncorporado(CONTATO.endereco.busca));

  protected readonly noticias = signal<NoticiasSite | null>(null);
  protected readonly carregando = signal(true);

  /** Até 3 destaques: primeiro as publicações do escritório, depois as notícias do dia. */
  protected readonly destaques = computed<Destaque[]>(() => {
    const dados = this.noticias();
    if (!dados) return [];
    const agora = new Date();
    const doEscritorio: Destaque[] = dados.publicacoes.map((p) => ({
      chave: `p${p.id}`,
      titulo: p.titulo,
      resumo: p.resumo,
      area: p.area_nome,
      quando: tempoRelativo(p.publicado_em, agora),
      origem: 'Do escritório',
      rota: ['/noticias', p.id],
      link: null,
    }));
    const externas: Destaque[] = dados.noticias.map((n) => ({
      chave: `n${n.id}`,
      titulo: n.titulo,
      resumo: n.resumo,
      area: n.area_nome,
      quando: tempoRelativo(n.publicado_em, agora),
      origem: n.fonte,
      rota: null,
      link: n.link,
    }));
    return [...doEscritorio.slice(0, 2), ...externas].slice(0, 3);
  });

  constructor() {
    this.api.noticiasDoSite(null, 6).subscribe({
      next: (dados) => {
        this.noticias.set(dados);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }
}
