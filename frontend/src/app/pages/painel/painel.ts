import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import { agruparPorDia } from '../../core/logica/agenda.logica';
import { linkWhatsApp, textoAniversario } from '../../core/logica/clientes.logica';
import { distribuicaoPorTipo, primeiroNome, totalPendencias } from '../../core/logica/painel.logica';
import { Cliente, Dashboard } from '../../core/models';
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
  /** [F6] Aviso de aniversários dos próximos 7 dias. Solicitado por Thamara Santana (30/10/2026). */
  protected readonly aniversariantes = signal<Cliente[]>([]);
  protected readonly textoAniversario = textoAniversario;
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
    this.api.aniversariantes(7).subscribe({
      next: (lista) => this.aniversariantes.set(lista),
      error: () => this.aniversariantes.set([]),
    });
  }

  /** [F6] WhatsApp já com a mensagem de parabéns. */
  protected parabens(c: Cliente): string | null {
    const nome = c.tipo === 'juridica' ? c.representante_nome || c.nome : c.nome;
    return linkWhatsApp(
      c.whatsapp || c.celular,
      `Olá, ${primeiroNome(nome)}! A equipe Thamara Santana Advocacia deseja um feliz aniversário! 🎉`,
    );
  }
}
