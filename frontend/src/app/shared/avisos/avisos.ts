import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AvisoService } from '../../core/aviso.service';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-avisos',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avisos" aria-live="polite">
      @for (aviso of servico.avisos(); track aviso.id) {
        <div class="aviso" [class.erro]="aviso.tipo === 'erro'" (click)="servico.fechar(aviso.id)">
          <span class="marca">
            <app-icone [nome]="aviso.tipo === 'erro' ? 'alerta' : 'check'" [tamanho]="15" [traco]="2.2" />
          </span>
          {{ aviso.texto }}
        </div>
      }
    </div>
  `,
  styles: `
    .avisos {
      position: fixed;
      right: 24px;
      bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    }
    .aviso {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px 12px 12px;
      max-width: 360px;
      background: var(--tinta);
      color: #fff;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: var(--sombra-lg);
      cursor: pointer;
      animation: entrar 0.25s ease-out;
    }
    .marca {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: var(--sucesso);
    }
    .erro .marca {
      background: var(--perigo);
    }
    @keyframes entrar {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    @media (max-width: 720px) {
      .avisos {
        left: 16px;
        right: 16px;
        bottom: 84px;
      }
      .aviso {
        max-width: none;
      }
    }
  `,
})
export class Avisos {
  protected servico = inject(AvisoService);
}
