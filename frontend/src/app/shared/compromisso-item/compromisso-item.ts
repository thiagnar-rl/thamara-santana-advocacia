import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Compromisso } from '../../core/models';
import { dataRelativa, diasAte, infoTipo } from '../../core/rotulos';
import { Icone } from '../icone/icone';

/** Uma linha de compromisso (usada no painel, na agenda e no processo). */
@Component({
  selector: 'app-compromisso-item',
  imports: [Icone, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compromisso-item.html',
  styleUrl: './compromisso-item.scss',
})
export class CompromissoItem {
  readonly compromisso = input.required<Compromisso>();
  readonly mostrarProcesso = input(true);
  readonly mostrarData = input(false);

  readonly alternarStatus = output<Compromisso>();
  readonly editar = output<Compromisso>();
  readonly excluir = output<Compromisso>();

  protected readonly tipo = computed(() => infoTipo(this.compromisso().tipo));
  protected readonly concluido = computed(() => this.compromisso().status === 'concluido');
  protected readonly diasAtraso = computed(() => {
    const c = this.compromisso();
    const dias = diasAte(c.data);
    return c.status === 'pendente' && dias < 0 ? Math.abs(dias) : 0;
  });
  protected readonly dataTexto = computed(() => dataRelativa(this.compromisso().data));
}
