import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  dataBR,
  impressaoAgenda,
  impressaoCliente,
  impressaoProcesso,
  impressaoProcessos,
  mesDe,
  semanaDe,
  textoPeriodo,
} from '../src/app/core/logica/impressao.logica';
import type { Cliente, Compromisso, Processo } from '../src/app/core/models';
import { clienteVazio } from '../src/app/core/logica/clientes.logica';

const compromisso = (extra: Partial<Compromisso>): Compromisso => ({
  id: 1,
  processo_id: 1,
  tipo: 'audiencia',
  titulo: 'Audiência de conciliação',
  data: '2026-11-05',
  hora: '14:00',
  local: 'Fórum de Guarujá',
  descricao: null,
  prioridade: 'media',
  status: 'pendente',
  processo_numero: '0001234-56.2026.8.26.0100',
  processo_cliente: 'Maria Souza',
  ...extra,
});

const processo: Processo = {
  id: 1,
  numero: '0001234-56.2026.8.26.0100',
  cliente: 'Maria Souza; João Lima',
  cliente_id: 3,
  clientes: [
    { nome: 'Maria Souza', cliente_id: 3 },
    { nome: 'João Lima', cliente_id: null },
  ],
  parte_contraria: 'Banco X',
  tribunal: null,
  area: 'Família',
  status: 'ativo',
  observacoes: 'Linha 1\nLinha 2',
  criado_em: '',
  atualizado_em: '',
  total_pendentes: 1,
  proximo_compromisso: '2026-11-05',
};

/** [F4] Impressão — pedido de Thamara Santana (cliente) (04/11/2026). */
describe('[F4] impressao.logica', () => {
  it('dataBR(), semanaDe() (domingo a sábado), mesDe() e textoPeriodo()', () => {
    assert.equal(dataBR('2026-11-04'), '04/11/2026');
    assert.equal(dataBR(null), '');
    assert.deepEqual(semanaDe('2026-11-04'), { de: '2026-11-01', ate: '2026-11-07' }); // 04/11/2026 é quarta
    assert.deepEqual(mesDe('2026-02-01'), { de: '2026-02-01', ate: '2026-02-28' });
    assert.equal(textoPeriodo({ de: '2026-11-01', ate: '2026-11-07' }), '01/11/2026 a 07/11/2026');
  });

  it('impressaoAgenda() ordena por data/hora e marca atrasados e concluídos', () => {
    const doc = impressaoAgenda('Agenda da semana', '01/11/2026 a 07/11/2026', [
      compromisso({ id: 2, data: '2026-11-06', hora: null, titulo: 'Prazo do recurso', tipo: 'recurso', prioridade: 'alta' }),
      compromisso({ id: 1 }),
      compromisso({ id: 3, data: '2026-11-02', status: 'concluido', titulo: 'Despacho' }),
      compromisso({ id: 4, data: '2026-11-03', titulo: 'Manifestação', local: null, processo_numero: null, processo_cliente: null }),
    ], '2026-11-04');
    assert.match(doc.subtitulo!, /4 compromissos \(3 pendentes\)/);
    const tabela = doc.secoes[0];
    assert.equal(tabela.tipo, 'tabela');
    if (tabela.tipo !== 'tabela') return;
    assert.deepEqual(tabela.linhas.map((l) => l[0]), ['02/11/2026', '03/11/2026', '05/11/2026', '06/11/2026']);
    assert.equal(tabela.linhas[0][6], 'Concluído');
    assert.equal(tabela.linhas[1][6], 'Atrasado');
    assert.equal(tabela.linhas[1][4], '—'); // sem processo
    assert.equal(tabela.linhas[3][6], 'Pendente · prioridade alta');
    assert.equal(tabela.linhas[3][1], '—'); // sem hora
  });

  it('impressaoProcesso() traz todos os clientes, observações e compromissos', () => {
    const doc = impressaoProcesso({ processo, compromissos: [compromisso({})] }, '2026-11-04');
    assert.equal(doc.titulo, 'Processo 0001234-56.2026.8.26.0100');
    const campos = doc.secoes[0];
    assert.ok(campos.tipo === 'campos' && campos.campos.some((c) => c.rotulo === 'Clientes' && c.valor === 'Maria Souza; João Lima'));
    assert.ok(campos.tipo === 'campos' && !campos.campos.some((c) => c.rotulo === 'Vara / Tribunal')); // vazio não aparece
    assert.ok(doc.secoes.some((s) => s.tipo === 'texto' && s.texto === 'Linha 1\nLinha 2'));
  });

  it('impressaoCliente() separa pessoa física e jurídica', () => {
    const pf: Cliente = { ...clienteVazio('fisica'), nome: 'Maria Souza', cpf: '529.982.247-25', data_nascimento: '1985-11-02', id: 3, criado_em: '', atualizado_em: '', total_processos: 1, aniversario: null };
    const doc = impressaoCliente({ cliente: pf, processos: [processo] });
    assert.equal(doc.subtitulo, 'Ficha do cliente · Pessoa física');
    const id = doc.secoes[0];
    assert.ok(id.tipo === 'campos' && id.campos.some((c) => c.rotulo === 'Data de nascimento' && c.valor === '02/11/1985'));
    const pj: Cliente = { ...pf, ...clienteVazio('juridica'), nome: 'Empresa X Ltda', cnpj: '11.222.333/0001-81', representante_nome: 'Carlos' };
    const docPj = impressaoCliente({ cliente: pj, processos: [] });
    assert.ok(docPj.secoes.some((s) => s.titulo === 'Representante legal'));
    const ultima = docPj.secoes[docPj.secoes.length - 1];
    assert.ok(ultima.tipo === 'tabela' && ultima.linhas.length === 0 && ultima.vazio === 'Nenhum processo vinculado.');
  });

  it('impressaoProcessos() mostra o filtro e a contagem', () => {
    const doc = impressaoProcessos([processo], 'Situação: Ativo');
    assert.equal(doc.subtitulo, 'Situação: Ativo · 1 processo');
    const t = doc.secoes[0];
    assert.ok(t.tipo === 'tabela' && t.linhas[0][6] === '05/11/2026');
  });
});
