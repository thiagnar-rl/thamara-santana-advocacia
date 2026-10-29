import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { distribuicaoPorTipo, iniciais, primeiroNome, totalPendencias } from '../src/app/core/logica/painel.logica';

describe('painel.logica', () => {
  it('distribuicaoPorTipo() usa o maior tipo como 100%', () => {
    const barras = distribuicaoPorTipo({ audiencia: 4, recurso: 2, manifestacao: 0, despacho: 1 });
    assert.deepEqual(barras.map((b) => [b.valor, b.total, b.largura]), [
      ['audiencia', 4, 100],
      ['recurso', 2, 50],
      ['manifestacao', 0, 0],
      ['despacho', 1, 25],
    ]);
    assert.equal(totalPendencias(barras), 7);
  });

  it('distribuicaoPorTipo() trata ausência de dados e tudo zerado', () => {
    assert.deepEqual(distribuicaoPorTipo(undefined), []);
    const zerado = distribuicaoPorTipo({ audiencia: 0, recurso: 0, manifestacao: 0, despacho: 0 });
    assert.ok(zerado.every((b) => b.largura === 0));
  });

  it('iniciais() e primeiroNome()', () => {
    assert.equal(iniciais('Thamara Santana'), 'TS');
    assert.equal(iniciais('  thamara  de souza santana '), 'TS');
    assert.equal(iniciais('Ana'), 'A');
    assert.equal(iniciais(''), '');
    assert.equal(iniciais(undefined), '');
    assert.equal(primeiroNome('Thamara Santana'), 'Thamara');
    assert.equal(primeiroNome(null), '');
  });
});
