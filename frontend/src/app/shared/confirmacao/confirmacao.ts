import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PedidoConfirmacao } from '../../core/confirmacao.service';
import { Icone } from '../icone/icone';

@Component({
  selector: 'app-confirmacao',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'pedido().responder(false)' },
  template: `
    <div class="modal-fundo" (click)="pedido().responder(false)">
      <div class="modal confirmacao" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="corpo">
          <span class="icone-perigo" [class.neutro]="pedido().tom === 'neutro'">
            <app-icone [nome]="pedido().tom === 'neutro' ? pedido().icone : 'alerta'" [tamanho]="22" />
          </span>
          <div>
            <h2>{{ pedido().titulo }}</h2>
            <p>{{ pedido().mensagem }}</p>
            @if (pedido().detalhe) {
              <p class="detalhe">{{ pedido().detalhe }}</p>
            }
          </div>
        </div>
        <footer class="modal-rodape">
          <button type="button" class="botao fantasma" (click)="pedido().responder(false)">Cancelar</button>
          <button
            type="button"
            class="botao"
            [class.perigo-cheio]="pedido().tom === 'perigo'"
            (click)="pedido().responder(true)"
          >
            <app-icone [nome]="pedido().icone" [tamanho]="16" /> {{ pedido().botao }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: `
    .confirmacao {
      max-width: 440px;
    }
    .corpo {
      display: flex;
      gap: 16px;
      padding: 24px;
    }
    .icone-perigo {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--perigo-suave);
      color: var(--perigo);
    }
    /* [C2] Confirmação que não é exclusão (ex.: sair do sistema) */
    .icone-perigo.neutro {
      background: var(--dourado-suave);
      color: var(--dourado);
    }
    h2 {
      font-family: var(--fonte-titulo);
      font-weight: 500;
      font-size: 1.25rem;
      margin-bottom: 6px;
    }
    p {
      color: var(--texto-2);
      font-size: 0.92rem;
    }
    .detalhe {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: var(--raio-sm);
      background: var(--alerta-suave);
      color: #8a5a12;
      font-size: 0.85rem;
    }
    .perigo-cheio {
      background: var(--perigo);
    }
    .perigo-cheio:hover {
      background: #a83a33;
    }
  `,
})
export class Confirmacao {
  readonly pedido = input.required<PedidoConfirmacao>();
}
