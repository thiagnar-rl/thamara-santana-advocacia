import { Injectable, signal } from '@angular/core';
import { DocumentoImpressao } from './logica/impressao.logica';

/**
 * [F4] Imprimir — solicitado por Thamara Santana (cliente) (04/11/2026).
 * A tela chama imprimir(documento); o componente <app-impressao> desenha o documento
 * (só aparece no papel) e a janela de impressão do navegador abre em seguida.
 */
@Injectable({ providedIn: 'root' })
export class ImpressaoService {
  readonly documento = signal<DocumentoImpressao | null>(null);

  imprimir(documento: DocumentoImpressao): void {
    this.documento.set(documento);
    document.documentElement.classList.add('imprimindo');
    const terminar = () => {
      document.documentElement.classList.remove('imprimindo');
      this.documento.set(null);
      window.removeEventListener('afterprint', terminar);
    };
    window.addEventListener('afterprint', terminar);
    // Espera o documento aparecer na página antes de abrir a janela de impressão
    setTimeout(() => window.print(), 120);
  }
}
