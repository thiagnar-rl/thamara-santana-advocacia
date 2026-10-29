import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoCompromisso } from '../../core/edicao.service';
import { validarCompromisso } from '../../core/logica/formularios.logica';
import { CompromissoForm, Processo } from '../../core/models';
import { PRIORIDADES, TIPOS, hojeISO } from '../../core/rotulos';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-compromisso-modal',
  imports: [FormsModule, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compromisso-modal.html',
  styleUrl: './compromisso-modal.scss',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
})
export class CompromissoModal implements OnInit {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);

  readonly dados = input.required<EdicaoCompromisso>();
  readonly fechar = output<void>();

  protected readonly tipos = TIPOS;
  protected readonly prioridades = PRIORIDADES;
  protected readonly processos = signal<Processo[]>([]);
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');
  protected readonly campoInvalido = signal<'titulo' | 'data' | 'hora' | null>(null);

  protected form: CompromissoForm = {
    processo_id: null,
    tipo: 'audiencia',
    titulo: '',
    data: hojeISO(),
    hora: '',
    local: '',
    descricao: '',
    prioridade: 'media',
    status: 'pendente',
  };

  get editando(): boolean {
    return this.dados().compromisso !== null;
  }

  ngOnInit(): void {
    const { compromisso, processoId, data } = this.dados();

    if (compromisso) {
      const { id, concluido_em, processo_numero, processo_cliente, ...resto } = compromisso;
      this.form = { ...resto, hora: resto.hora ?? '', local: resto.local ?? '', descricao: resto.descricao ?? '' };
    } else {
      this.form.processo_id = processoId;
      if (data) this.form.data = data;
    }

    this.api.listarProcessos().subscribe((lista) => this.processos.set(lista));
  }

  protected salvar(): void {
    const { erro, campo } = validarCompromisso(this.form);
    this.erro.set(erro ?? '');
    this.campoInvalido.set(campo);
    if (erro) return;

    this.salvando.set(true);
    const atual = this.dados().compromisso;
    const requisicao = atual
      ? this.api.atualizarCompromisso(atual.id, this.form)
      : this.api.criarCompromisso(this.form);

    requisicao.subscribe({
      next: () => {
        this.avisos.sucesso(atual ? 'Compromisso atualizado' : 'Compromisso criado');
        this.api.avisarMudanca();
        this.fechar.emit();
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }
}
