import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoProcesso } from '../../core/edicao.service';
import { validarProcesso } from '../../core/logica/formularios.logica';
import { ProcessoForm } from '../../core/models';
import { AREAS, STATUS_PROCESSO } from '../../core/rotulos';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-processo-modal',
  imports: [FormsModule, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './processo-modal.html',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
})
export class ProcessoModal implements OnInit {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private router = inject(Router);

  readonly dados = input.required<EdicaoProcesso>();
  readonly fechar = output<void>();

  protected readonly areas = AREAS;
  protected readonly status = STATUS_PROCESSO;
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');
  protected readonly campoInvalido = signal<'numero' | 'cliente' | null>(null);

  protected form: ProcessoForm = {
    numero: '',
    cliente: '',
    parte_contraria: '',
    tribunal: '',
    area: '',
    status: 'ativo',
    observacoes: '',
  };

  get editando(): boolean {
    return this.dados().processo !== null;
  }

  ngOnInit(): void {
    const p = this.dados().processo;
    if (p) {
      this.form = {
        numero: p.numero,
        cliente: p.cliente,
        parte_contraria: p.parte_contraria ?? '',
        tribunal: p.tribunal ?? '',
        area: p.area ?? '',
        status: p.status,
        observacoes: p.observacoes ?? '',
      };
    }
  }

  protected salvar(): void {
    const { erro, campo } = validarProcesso(this.form);
    this.erro.set(erro ?? '');
    this.campoInvalido.set(campo);
    if (erro) return;

    this.salvando.set(true);
    const atual = this.dados().processo;
    const requisicao = atual
      ? this.api.atualizarProcesso(atual.id, this.form)
      : this.api.criarProcesso(this.form);

    requisicao.subscribe({
      next: (salvo) => {
        this.avisos.sucesso(atual ? 'Processo atualizado' : 'Processo cadastrado');
        this.api.avisarMudanca();
        this.fechar.emit();
        if (!atual) this.router.navigate(['/processos', salvo.id]);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }
}
