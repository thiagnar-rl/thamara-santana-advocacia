import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  dataCurta,
  dataRelativa,
  deISO,
  diasAte,
  hojeISO,
  infoTipo,
  paraISO,
  prazoTexto,
  rotuloStatusProcesso,
  somarDias,
} from '../src/app/core/rotulos';

describe('rotulos (textos e datas da interface)', () => {
  const hoje = hojeISO();

  it('paraISO() e deISO() são inversos', () => {
    assert.equal(paraISO(deISO('2026-02-09')), '2026-02-09');
  });

  it('somarDias() e diasAte() funcionam a partir de hoje', () => {
    assert.equal(diasAte(hoje), 0);
    assert.equal(diasAte(somarDias(hoje, 3)), 3);
    assert.equal(diasAte(somarDias(hoje, -2)), -2);
  });

  it('dataRelativa() usa Hoje, Amanhã e Ontem', () => {
    assert.equal(dataRelativa(hoje), 'Hoje');
    assert.equal(dataRelativa(somarDias(hoje, 1)), 'Amanhã');
    assert.equal(dataRelativa(somarDias(hoje, -1)), 'Ontem');
  });

  it('prazoTexto() descreve o prazo em dias', () => {
    assert.equal(prazoTexto(somarDias(hoje, 5)), 'em 5 dias');
    assert.equal(prazoTexto(somarDias(hoje, -4)), 'há 4 dias');
  });

  it('dataCurta() usa o formato brasileiro', () => {
    assert.equal(dataCurta('2026-10-28'), '28/10/2026');
  });

  it('infoTipo() e rotuloStatusProcesso() devolvem os nomes exibidos', () => {
    assert.equal(infoTipo('manifestacao').rotulo, 'Manifestação');
    assert.equal(infoTipo('despacho').plural, 'Despachos');
    assert.equal(rotuloStatusProcesso('arquivado'), 'Arquivado');
  });
});
