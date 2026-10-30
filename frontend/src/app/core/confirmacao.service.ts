import { Injectable, signal } from '@angular/core';

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  detalhe?: string;
  botao: string;
  /** Ícone do botão e do topo. Padrão: lixeira (exclusões). [C2] "sair" para sair do sistema. */
  icone: string;
  /** "perigo" (vermelho, para exclusões) ou "neutro" (escuro). [C2] */
  tom: 'perigo' | 'neutro';
  responder: (sim: boolean) => void;
}

/**
 * Substitui o confirm() do navegador por um diálogo no padrão visual do sistema.
 * Uso: if (await confirmacao.perguntar({...})) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  readonly pedido = signal<PedidoConfirmacao | null>(null);

  perguntar(opcoes: {
    titulo: string;
    mensagem: string;
    detalhe?: string;
    botao?: string;
    icone?: string;
    tom?: 'perigo' | 'neutro';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.pedido.set({
        ...opcoes,
        botao: opcoes.botao ?? 'Excluir',
        icone: opcoes.icone ?? 'lixeira',
        tom: opcoes.tom ?? 'perigo',
        responder: (sim) => {
          this.pedido.set(null);
          resolve(sim);
        },
      });
    });
  }
}
