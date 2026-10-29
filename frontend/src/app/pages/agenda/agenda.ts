import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import {
  Celula,
  Periodo,
  agruparPorDia,
  gerarCelulas,
  intervaloDoCalendario,
  montarFiltro,
  mudarMes,
  primeiroDiaDoMes,
} from '../../core/logica/agenda.logica';
import { Compromisso, TipoCompromisso } from '../../core/models';
import { TIPOS, dataLonga, deISO, hojeISO } from '../../core/rotulos';
import { CompromissoItem } from '../../shared/compromisso-item/compromisso-item';
import { Icone } from '../../shared/icone/icone';

/**
 * CONTROLLER da tela Agenda.
 * Guarda o estado da tela (filtros e dados), chama a API e delega
 * os cálculos para o Model (core/logica/agenda.logica.ts).
 * A VIEW é o agenda.html + agenda.scss.
 */
@Component({
  selector: 'app-agenda',
  imports: [Icone, CompromissoItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class AgendaPage {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  protected edicao = inject(EdicaoService);

  protected readonly tipos = TIPOS;
  protected readonly periodos: { valor: Periodo; rotulo: string }[] = [
    { valor: 'proximos', rotulo: 'Próximos' },
    { valor: 'atrasados', rotulo: 'Atrasados' },
    { valor: 'concluidos', rotulo: 'Concluídos' },
    { valor: 'todos', rotulo: 'Todos' },
  ];
  protected readonly diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Estado (filtros)
  protected readonly mes = signal(primeiroDiaDoMes(new Date()));
  protected readonly diaSelecionado = signal<string | null>(null);
  protected readonly tipo = signal<TipoCompromisso | null>(null);
  protected readonly periodo = signal<Periodo>('proximos');

  // Dados vindos da API
  protected readonly lista = signal<Compromisso[]>([]);
  protected readonly doMes = signal<Compromisso[]>([]);
  protected readonly carregando = signal(true);

  // Valores derivados (calculados pelo Model)
  protected readonly tituloMes = computed(() =>
    deISO(this.mes()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  );
  protected readonly celulas = computed(() => gerarCelulas(this.mes(), this.doMes(), hojeISO()));
  protected readonly grupos = computed(() => agruparPorDia(this.lista()));
  protected readonly tituloLista = computed(() => {
    const dia = this.diaSelecionado();
    if (dia) return dataLonga(dia);
    return this.periodos.find((p) => p.valor === this.periodo())?.rotulo ?? '';
  });

  constructor() {
    // Lista principal: recarrega quando um filtro muda ou algo é salvo.
    effect(() => {
      this.api.versao();
      const filtro = montarFiltro(this.periodo(), this.diaSelecionado(), this.tipo(), hojeISO());
      untracked(() => {
        this.carregando.set(true);
        this.api.listarCompromissos(filtro).subscribe({
          next: (l) => {
            this.lista.set(l);
            this.carregando.set(false);
          },
          error: (e) => {
            this.avisos.erro(mensagemDeErro(e));
            this.carregando.set(false);
          },
        });
      });
    });

    // Pontinhos do calendário.
    effect(() => {
      this.api.versao();
      const filtro = { ...intervaloDoCalendario(this.mes()), tipo: this.tipo() };
      untracked(() => this.api.listarCompromissos(filtro).subscribe((l) => this.doMes.set(l)));
    });
  }

  protected mudarMes(delta: number): void {
    this.mes.set(mudarMes(this.mes(), delta));
  }

  protected irParaHoje(): void {
    this.mes.set(primeiroDiaDoMes(new Date()));
    this.diaSelecionado.set(hojeISO());
  }

  protected selecionarDia(celula: Celula): void {
    if (this.diaSelecionado() === celula.data) {
      this.diaSelecionado.set(null);
      return;
    }
    this.diaSelecionado.set(celula.data);
    if (!celula.doMes) this.mes.set(primeiroDiaDoMes(deISO(celula.data)));
  }

  protected escolherPeriodo(p: Periodo): void {
    this.diaSelecionado.set(null);
    this.periodo.set(p);
  }

  protected escolherTipo(t: TipoCompromisso | null): void {
    this.tipo.set(this.tipo() === t ? null : t);
  }
}
