import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ImpressaoService } from '../../core/impressao.service';

/**
 * [F4] Folha de impressão com o timbre do escritório.
 * Fica escondida na tela; só aparece no papel (ou no PDF) — ver o bloco "@media print" em styles.scss.
 * Solicitado por: Thiago Rinaldi Luna (04/11/2026).
 */
@Component({
  selector: 'app-impressao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (servico.documento(); as doc) {
      <article class="folha">
        <header class="timbre">
          <img src="marca/monograma.png" alt="" />
          <div>
            <strong>Thamara Santana</strong>
            <span>Advocacia e Consultoria Jurídica · OAB/SP 500.770</span>
          </div>
        </header>

        <h1>{{ doc.titulo }}</h1>
        @if (doc.subtitulo) {
          <p class="subtitulo">{{ doc.subtitulo }}</p>
        }

        @for (secao of doc.secoes; track $index) {
          <section>
            @if (secao.titulo) {
              <h2>{{ secao.titulo }}</h2>
            }
            @switch (secao.tipo) {
              @case ('campos') {
                <dl>
                  @for (c of secao.campos; track c.rotulo) {
                    <div>
                      <dt>{{ c.rotulo }}</dt>
                      <dd>{{ c.valor }}</dd>
                    </div>
                  }
                </dl>
              }
              @case ('tabela') {
                @if (secao.linhas.length) {
                  <table>
                    <thead>
                      <tr>
                        @for (col of secao.colunas; track col) {
                          <th>{{ col }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (linha of secao.linhas; track $index) {
                        <tr>
                          @for (celula of linha; track $index) {
                            <td>{{ celula }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <p class="vazio">{{ secao.vazio }}</p>
                }
              }
              @case ('texto') {
                <p class="texto">{{ secao.texto }}</p>
              }
            }
          </section>
        }

        <footer>Impresso em {{ agora() }} · Documento de uso interno, com dados sigilosos de clientes.</footer>
      </article>
    }
  `,
  styles: `
    :host {
      display: none;
    }
    .folha {
      font-family: var(--fonte);
      font-size: 10.5pt;
      line-height: 1.45;
      color: #111;
    }
    .timbre {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 10px;
      margin-bottom: 18px;
      border-bottom: 1.5px solid #a9843f;
    }
    .timbre img {
      width: 34px;
      height: auto;
    }
    .timbre div {
      display: flex;
      flex-direction: column;
    }
    .timbre strong {
      font-family: var(--fonte-marca);
      font-size: 13pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8a6a2e;
    }
    .timbre span {
      font-size: 8.5pt;
      letter-spacing: 0.04em;
      color: #555;
    }
    h1 {
      margin: 0;
      font-family: var(--fonte-titulo);
      font-size: 18pt;
      font-weight: 500;
      color: #111;
    }
    .subtitulo {
      margin: 2px 0 14px;
      color: #555;
    }
    section {
      margin-top: 14px;
    }
    h2 {
      margin: 0 0 6px;
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #8a6a2e;
    }
    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 24px;
      margin: 0;
    }
    dl div {
      break-inside: avoid;
    }
    dt {
      font-size: 8.5pt;
      color: #666;
    }
    dd {
      margin: 0;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    th {
      text-align: left;
      padding: 5px 6px;
      border-bottom: 1.5px solid #333;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 5px 6px;
      border-bottom: 1px solid #ddd;
      vertical-align: top;
    }
    tr {
      break-inside: avoid;
    }
    .texto {
      margin: 0;
      white-space: pre-wrap;
    }
    .vazio {
      margin: 0;
      color: #666;
      font-style: italic;
    }
    footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #777;
    }
  `,
})
export class Impressao {
  protected servico = inject(ImpressaoService);
  protected readonly agora = computed(() => {
    this.servico.documento();
    return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  });
}
