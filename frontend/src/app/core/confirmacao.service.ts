import { Injectable, signal } from '@angular/core';

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  detalhe?: string;
  botao: string;
  responder: (sim: boolean) => void;
}

/**
 * Substitui o confirm() do navegador por um diálogo no padrão visual do sistema.
 * Uso: if (await confirmacao.perguntar({...})) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  readonly pedido = signal<PedidoConfirmacao | null>(null);

  perguntar(opcoes: { titulo: string; mensagem: string; detalhe?: string; botao?: string }): Promise<boolean> {
    return new Promise((resolve) => {
      this.pedido.set({
        ...opcoes,
        botao: opcoes.botao ?? 'Excluir',
        responder: (sim) => {
          this.pedido.set(null);
          resolve(sim);
        },
      });
    });
  }
}
