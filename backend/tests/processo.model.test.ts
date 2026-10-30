import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCompromisso, criarProcesso, criarUsuario, novoBanco } from './helpers';
import { MENSAGEM_NUMERO_INVALIDO, ProcessoModel } from '../src/models/processo.model';
import { CompromissoModel } from '../src/models/compromisso.model';

const HOJE = '2026-10-28';

describe('ProcessoModel', () => {
  let ana: number;
  let bia: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com');
    bia = await criarUsuario('bia@teste.com');
  });

  it('validar() exige número e cliente e confere a situação', async () => {
    assert.equal(ProcessoModel.validar({}).erro, 'Informe o número do processo.');
    assert.equal(ProcessoModel.validar({ numero: '0001234-56.2026.8.26.0100' }).erro, 'Informe o nome do cliente.');
    assert.equal(ProcessoModel.validar({ numero: '0001234-56.2026.8.26.0100', cliente: 'A', status: 'perdido' }).erro, 'Status inválido.');
    const ok = ProcessoModel.validar({ numero: ' 0001234-56.2026.8.26.0100 ', cliente: 'A', tribunal: '' });
    assert.equal(ok.erro, null);
    assert.equal(ok.dados.status, 'ativo'); // padrão
    assert.equal(ok.dados.tribunal, null); // vazio vira null
  });

  describe('[C1] número no padrão CNJ (sugestão: Mariana Couto, 29/10/2026)', () => {
    it('recusa texto livre, letras e quantidade errada de dígitos', () => {
      for (const numero of ['123abc', '123', 'A-1', '0001234-56.2026.8.26.010', '0001234-56.2026.8.26.01000']) {
        assert.equal(ProcessoModel.validar({ numero, cliente: 'A' }).erro, MENSAGEM_NUMERO_INVALIDO, numero);
      }
    });

    it('aceita o número formatado e formata quando vierem só os 20 dígitos', () => {
      assert.equal(ProcessoModel.validar({ numero: '0001234-56.2026.8.26.0100', cliente: 'A' }).dados.numero, '0001234-56.2026.8.26.0100');
      assert.equal(ProcessoModel.validar({ numero: '00012345620268260100', cliente: 'A' }).dados.numero, '0001234-56.2026.8.26.0100');
      assert.equal(ProcessoModel.validar({ numero: '0001234 56 2026 8 26 0100', cliente: 'A' }).dados.numero, '0001234-56.2026.8.26.0100');
    });
  });

  it('listar() mostra só os processos da própria usuária (RNF02)', async () => {
    await criarProcesso(ana, { numero: 'A-1' });
    await criarProcesso(bia, { numero: 'B-1' });
    const lista = await ProcessoModel.listar(ana, {}, HOJE);
    assert.deepEqual(lista.map((p) => p.numero), ['A-1']);
  });

  it('listar() filtra por texto e por situação', async () => {
    await criarProcesso(ana, { numero: 'A-1', cliente: 'Carlos Ramos', area: 'Trabalhista' });
    await criarProcesso(ana, { numero: 'A-2', cliente: 'Renata Moura', status: 'arquivado' });
    assert.equal((await ProcessoModel.listar(ana, { busca: 'trabalh' }, HOJE)).length, 1);
    assert.equal((await ProcessoModel.listar(ana, { status: 'arquivado' }, HOJE))[0].cliente, 'Renata Moura');
    assert.equal((await ProcessoModel.listar(ana, { status: 'invalido' }, HOJE)).length, 2); // filtro ignorado
  });

  it('calcula total de pendências e próximo compromisso', async () => {
    const p = await criarProcesso(ana);
    (await criarCompromisso(ana, { processo_id: p, data: '2026-10-20' })); // atrasado
    await criarCompromisso(ana, { processo_id: p, data: '2026-11-03' });
    await criarCompromisso(ana, { processo_id: p, data: '2026-10-30' });
    await criarCompromisso(ana, { processo_id: p, data: '2026-10-29', status: 'concluido' });
    const processo = (await ProcessoModel.buscar(ana, p, HOJE))!;
    assert.equal(processo.total_pendentes, 3);
    assert.equal(processo.proximo_compromisso, '2026-10-30');
  });

  it('numeroRepetido() impede número duplicado para a mesma usuária (RN02)', async () => {
    const id = await criarProcesso(ana, { numero: 'X-1' });
    assert.equal((await ProcessoModel.numeroRepetido(ana, 'X-1')), true);
    assert.equal((await ProcessoModel.numeroRepetido(ana, 'X-1', id)), false); // editando o próprio
    assert.equal((await ProcessoModel.numeroRepetido(bia, 'X-1')), false); // outra usuária pode
  });

  it('o banco também recusa número duplicado (índice único)', async () => {
    await criarProcesso(ana, { numero: 'X-1' });
    await assert.rejects(() => criarProcesso(ana, { numero: 'X-1' }), /UNIQUE/);
  });

  it('atualizar() e excluir() não alteram processos de outra usuária', async () => {
    const id = await criarProcesso(ana);
    const { dados } = ProcessoModel.validar({ numero: '0000001-11.2024.8.26.0001', cliente: 'Novo' });
    assert.equal((await ProcessoModel.atualizar(bia, id, dados)), false);
    assert.equal((await ProcessoModel.excluir(bia, id)), false);
    assert.equal((await ProcessoModel.atualizar(ana, id, dados)), true);
    assert.equal((await ProcessoModel.buscar(ana, id, HOJE))!.numero, '0000001-11.2024.8.26.0001');
  });

  it('excluir() apaga os compromissos do processo em cascata (RN06)', async () => {
    const p = await criarProcesso(ana);
    await criarCompromisso(ana, { processo_id: p });
    await criarCompromisso(ana, { processo_id: null, titulo: 'Sem processo' });
    assert.equal((await ProcessoModel.excluir(ana, p)), true);
    const restantes = await CompromissoModel.listar(ana, {}, HOJE);
    assert.deepEqual(restantes.map((c) => c.titulo), ['Sem processo']);
  });
});
