import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import { agruparPorDia } from '../../core/logica/agenda.logica';
import { distribuicaoPorTipo, totalPendencias } from '../../core/logica/painel.logica';
import { Dashboard } from '../../core/models';
import { dataLonga, diaDaSemana, hojeISO, saudacao } from '../../core/rotulos';
import { CompromissoItem } from '../../shared/compromisso-item/compromisso-item';
import { Icone } from '../../shared/icone/icone';

/**
 * CONTROLLER da tela Início (Painel do dia).
 * Busca os dados na API e usa o Model (core/logica) para prepará-los.
 * A VIEW é o painel.html + painel.scss.
 */
@Component({
  selector: 'app-painel',
  imports: [RouterLink, Icone, CompromissoItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
})
export class PainelPage {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  protected auth = inject(AuthService);
  protected edicao = inject(EdicaoService);

  protected readonly dados = signal<Dashboard | null>(null);
  protected readonly saudacao = saudacao();
  protected readonly hoje = hojeISO();
  protected readonly diaSemana = diaDaSemana(this.hoje);
  protected readonly dataHoje = dataLonga(this.hoje);

  /** Próximos compromissos agrupados por dia. */
  protected readonly proximosPorDia = computed(() => agruparPorDia(this.dados()?.proximos ?? []));

  /** Distribuição de pendentes por tipo (para as barrinhas). */
  protected readonly distribuicao = computed(() => distribuicaoPorTipo(this.dados()?.porTipo));
  protected readonly totalPendentes = computed(() => totalPendencias(this.distribuicao()));

  constructor() {
    // Recarrega sempre que algo for salvo em qualquer tela.
    effect(() => {
      this.api.versao();
      untracked(() => this.carregar());
    });
  }

  private carregar(): void {
    this.api.dashboard().subscribe({
      next: (d) => this.dados.set(d),
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }
}
