import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  agruparPorDia,
  gerarCelulas,
  intervaloDoCalendario,
  montarFiltro,
  mudarMes,
  primeiroDiaDoMes,
} from '../src/app/core/logica/agenda.logica';
import type { Compromisso } from '../src/app/core/models';

function c(id: number, data: string, tipo: Compromisso['tipo'] = 'audiencia'): Compromisso {
  return { id, processo_id: null, tipo, titulo: `C${id}`, data, hora: null, local: null, descricao: null, prioridade: 'media', status: 'pendente' };
}

describe('agenda.logica', () => {
  it('primeiroDiaDoMes() e mudarMes() atravessam o ano', () => {
    assert.equal(primeiroDiaDoMes(new Date(2026, 9, 28)), '2026-10-01');
    assert.equal(mudarMes('2026-12-01', 1), '2027-01-01');
    assert.equal(mudarMes('2026-01-01', -1), '2025-12-01');
  });

  it('gerarCelulas() monta 42 dias começando no domingo', () => {
    const celulas = gerarCelulas('2026-10-01', [], '2026-10-28');
    assert.equal(celulas.length, 42);
    assert.equal(celulas[0].data, '2026-09-27'); // 1º/10/2026 é quinta-feira
    assert.equal(celulas[0].doMes, false);
    assert.equal(celulas.find((x) => x.data === '2026-10-28')!.hoje, true);
  });

  it('gerarCelulas() marca os tipos de cada dia sem repetir', () => {
    const lista = [c(1, '2026-10-28', 'audiencia'), c(2, '2026-10-28', 'audiencia'), c(3, '2026-10-28', 'recurso')];
    const dia = gerarCelulas('2026-10-01', lista, '2026-10-28').find((x) => x.data === '2026-10-28')!;
    assert.deepEqual(dia.tipos, ['audiencia', 'recurso']);
    assert.equal(dia.total, 3);
  });

  it('intervaloDoCalendario() cobre os dias vizinhos exibidos', () => {
    assert.deepEqual(intervaloDoCalendario('2026-10-01'), { de: '2026-09-24', ate: '2026-11-14' });
  });

  it('agruparPorDia() mantém a ordem e junta itens da mesma data', () => {
    const grupos = agruparPorDia([c(1, '2026-10-30'), c(2, '2026-10-30'), c(3, '2026-11-03')]);
    assert.equal(grupos.length, 2);
    assert.deepEqual(grupos[0].itens.map((i) => i.id), [1, 2]);
    assert.match(grupos[1].subtitulo, /3 de novembro de 2026/);
  });

  it('montarFiltro() traduz os filtros da tela para a API', () => {
    const hoje = '2026-10-28';
    assert.deepEqual(montarFiltro('proximos', null, null, hoje), { de: hoje, status: 'pendente', tipo: null });
    assert.deepEqual(montarFiltro('atrasados', null, 'recurso', hoje), { periodo: 'atrasados', tipo: 'recurso' });
    assert.deepEqual(montarFiltro('concluidos', null, null, hoje), { status: 'concluido', tipo: null });
    assert.deepEqual(montarFiltro('todos', null, null, hoje), { tipo: null });
    // dia selecionado tem prioridade sobre o período
    assert.deepEqual(montarFiltro('atrasados', '2026-11-03', null, hoje), { de: '2026-11-03', ate: '2026-11-03', tipo: null });
  });
});
