import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import { Processo, StatusProcesso } from '../../core/models';
import { STATUS_PROCESSO, dataRelativa, rotuloStatusProcesso } from '../../core/rotulos';
import { Icone } from '../../shared/icone/icone';

@Component({
  selector: 'app-processos',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './processos.html',
  styleUrl: './processos.scss',
})
export class ProcessosPage {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  protected edicao = inject(EdicaoService);

  protected readonly opcoesStatus = STATUS_PROCESSO;
  protected readonly rotuloStatus = rotuloStatusProcesso;
  protected readonly dataRelativa = dataRelativa;

  protected readonly busca = signal('');
  protected readonly status = signal<StatusProcesso | null>('ativo');
  protected readonly processos = signal<Processo[]>([]);
  protected readonly carregando = signal(true);

  private espera?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      this.api.versao();
      const busca = this.busca();
      const status = this.status();
      untracked(() => this.carregar(busca, status));
    });
  }

  /** Espera o usuário parar de digitar antes de buscar. */
  protected digitar(valor: string): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.busca.set(valor.trim()), 250);
  }

  private carregar(busca: string, status: StatusProcesso | null): void {
    this.carregando.set(true);
    this.api.listarProcessos(busca, status).subscribe({
      next: (lista) => {
        this.processos.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.avisos.erro(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }
}
