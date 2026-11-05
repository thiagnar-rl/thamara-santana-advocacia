import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { dataCurta, tempoRelativo } from '../../core/logica/site.logica';
import { AreaSite, NoticiasSite as Dados } from '../../core/models';
import { Icone } from '../../shared/icone/icone';
import { AVISO_LEGAL } from '../conteudo';

/** Áreas mostradas nos filtros antes de a resposta chegar (a API devolve a lista oficial). */
const AREAS_PADRAO: AreaSite[] = [
  { chave: 'familia', nome: 'Família e Sucessões' },
  { chave: 'previdenciario', nome: 'Previdenciário' },
  { chave: 'trabalhista', nome: 'Trabalhista' },
  { chave: 'consumidor', nome: 'Consumidor' },
  { chave: 'criminal', nome: 'Criminal' },
];

/**
 * Aba "Notícias": publicações do escritório + notícias jurídicas atualizadas automaticamente.
 * [F7] Solicitado por: Thamara Santana (cliente) (04/11/2026).
 */
@Component({
  selector: 'app-noticias-site',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './noticias.html',
  styleUrl: './noticias.scss',
})
export class NoticiasSite {
  private api = inject(ApiService);

  protected readonly aviso = AVISO_LEGAL;
  protected readonly tempoRelativo = tempoRelativo;
  protected readonly dataCurta = dataCurta;

  /** Área escolhida no filtro (null = todas). */
  protected readonly area = signal<string | null>(null);
  protected readonly areas = signal<AreaSite[]>(AREAS_PADRAO);
  protected readonly dados = signal<Dados | null>(null);
  protected readonly carregando = signal(true);
  protected readonly falhou = signal(false);

  constructor() {
    effect(() => {
      const area = this.area();
      untracked(() => this.carregar(area));
    });
  }

  protected escolher(area: string | null): void {
    this.area.set(area);
  }

  protected carregar(area: string | null = this.area()): void {
    this.carregando.set(true);
    this.falhou.set(false);
    this.api.noticiasDoSite(area, 40).subscribe({
      next: (dados) => {
        this.dados.set(dados);
        if (dados.areas?.length) this.areas.set(dados.areas);
        this.carregando.set(false);
      },
      error: () => {
        this.falhou.set(true);
        this.carregando.set(false);
      },
    });
  }
}
