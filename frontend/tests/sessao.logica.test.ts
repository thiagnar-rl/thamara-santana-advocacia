import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { perguntaSaida } from '../src/app/core/logica/sessao.logica';

/** [C2] Confirmar antes de sair — solicitado por Thamara Santana (teste de 30/10/2026). */
describe('[C2] sessao.logica (sugestão: Thamara Santana)', () => {
  it('perguntaSaida() pede confirmação antes de sair do sistema', () => {
    const p = perguntaSaida(false);
    assert.equal(p.titulo, 'Sair do sistema?');
    assert.equal(p.botao, 'Sair');
    assert.equal(p.detalhe, undefined);
  });

  it('perguntaSaida() avisa que há um formulário aberto que será perdido', () => {
    assert.match(perguntaSaida(true).detalhe ?? '', /não foi salvo será perdido/);
  });
});
