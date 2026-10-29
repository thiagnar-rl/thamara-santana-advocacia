import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  texto: string;
  tipo: 'sucesso' | 'erro';
}

/** Mensagens rápidas ("toasts") no canto da tela. */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  readonly avisos = signal<Aviso[]>([]);
  private proximoId = 1;

  sucesso(texto: string): void {
    this.mostrar(texto, 'sucesso');
  }

  erro(texto: string): void {
    this.mostrar(texto, 'erro');
  }

  fechar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private mostrar(texto: string, tipo: Aviso['tipo']): void {
    const id = this.proximoId++;
    this.avisos.update((lista) => [...lista, { id, texto, tipo }]);
    setTimeout(() => this.fechar(id), 3500);
  }
}
