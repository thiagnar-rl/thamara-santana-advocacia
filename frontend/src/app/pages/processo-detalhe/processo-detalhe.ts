import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import { ProcessoDetalhe } from '../../core/models';
import { dataCurta, rotuloStatusProcesso } from '../../core/rotulos';
import { CompromissoItem } from '../../shared/compromisso-item/compromisso-item';
import { Icone } from '../../shared/icone/icone';

@Component({
  selector: 'app-processo-detalhe',
  imports: [RouterLink, Icone, CompromissoItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './processo-detalhe.html',
  styleUrl: './processo-detalhe.scss',
})
export class ProcessoDetalhePage {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  protected edicao = inject(EdicaoService);

  /** Vem da URL: /processos/:id */
  readonly id = input.required<string>();

  protected readonly detalhe = signal<ProcessoDetalhe | null>(null);
  protected readonly rotuloStatus = rotuloStatusProcesso;
  protected readonly dataCurta = dataCurta;

  protected readonly pendentes = computed(
    () => this.detalhe()?.compromissos.filter((c) => c.status === 'pendente') ?? [],
  );
  protected readonly concluidos = computed(
    () => this.detalhe()?.compromissos.filter((c) => c.status === 'concluido') ?? [],
  );

  constructor() {
    effect(() => {
      this.api.versao();
      const id = Number(this.id());
      untracked(() => this.carregar(id));
    });
  }

  private carregar(id: number): void {
    this.api.obterProcesso(id).subscribe({
      next: (d) => this.detalhe.set(d),
      error: (e) => {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.router.navigate(['/processos']);
          return;
        }
        this.avisos.erro(mensagemDeErro(e));
      },
    });
  }
}
