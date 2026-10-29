import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCompromisso, criarProcesso, criarUsuario, novoBanco } from './helpers';
import { CompromissoModel } from '../src/models/compromisso.model';

const HOJE = '2026-10-28';

describe('CompromissoModel', () => {
  let ana: number;
  let bia: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com');
    bia = await criarUsuario('bia@teste.com');
  });

  describe('validar()', () => {
    const base = { tipo: 'recurso', titulo: 'Apelação', data: '2026-10-30' };

    it('aceita dados mínimos e aplica os padrões', async () => {
      const { dados, erro } = await CompromissoModel.validar(base, ana);
      assert.equal(erro, null);
      assert.equal(dados.prioridade, 'media');
      assert.equal(dados.status, 'pendente');
      assert.equal(dados.processo_id, null);
      assert.equal(dados.hora, null);
    });

    it('recusa tipo, título, data, hora e prioridade inválidos', async () => {
      assert.equal((await CompromissoModel.validar({ ...base, tipo: 'prazo' }, ana)).erro, 'Escolha o tipo do compromisso.');
      assert.equal((await CompromissoModel.validar({ ...base, titulo: '  ' }, ana)).erro, 'Informe um título.');
      assert.equal((await CompromissoModel.validar({ ...base, data: '2026-13-01' }, ana)).erro, 'Informe uma data válida.');
      assert.equal((await CompromissoModel.validar({ ...base, hora: '25:00' }, ana)).erro, 'Hora inválida.');
      assert.equal((await CompromissoModel.validar({ ...base, prioridade: 'urgente' }, ana)).erro, 'Prioridade inválida.');
    });

    it('não permite vincular processo de outra usuária (RN04)', async () => {
      const processoDaBia = await criarProcesso(bia);
      const { erro } = await CompromissoModel.validar({ ...base, processo_id: processoDaBia }, ana);
      assert.equal(erro, 'Processo não encontrado.');
    });
  });

  describe('listar()', () => {
    beforeEach(async () => {
      await criarCompromisso(ana, { tipo: 'audiencia', data: '2026-10-28', hora: '14:00', titulo: 'B' });
      await criarCompromisso(ana, { tipo: 'audiencia', data: '2026-10-28', hora: '09:00', titulo: 'A' });
      await criarCompromisso(ana, { tipo: 'recurso', data: '2026-10-30', titulo: 'C' });
      await criarCompromisso(ana, { tipo: 'despacho', data: '2026-10-20', titulo: 'Atrasado antigo' });
      await criarCompromisso(ana, { tipo: 'despacho', data: '2026-10-26', titulo: 'Atrasado recente' });
      await criarCompromisso(ana, { tipo: 'manifestacao', data: '2026-10-21', titulo: 'Feito', status: 'concluido' });
      await criarCompromisso(bia, { titulo: 'Da Bia' });
    });

    it('ordena por data e hora e não mostra dados de outra usuária', async () => {
      const titulos = (await CompromissoModel.listar(ana, { de: HOJE }, HOJE)).map((c) => c.titulo);
      assert.deepEqual(titulos, ['A', 'B', 'C']);
    });

    it('filtra por tipo e por status', async () => {
      assert.equal((await CompromissoModel.listar(ana, { tipo: 'recurso' }, HOJE)).length, 1);
      assert.equal((await CompromissoModel.listar(ana, { status: 'concluido' }, HOJE))[0].titulo, 'Feito');
    });

    it('período "atrasados" traz só pendentes vencidos, do mais recente ao mais antigo (RN05)', async () => {
      const titulos = (await CompromissoModel.listar(ana, { periodo: 'atrasados' }, HOJE)).map((c) => c.titulo);
      assert.deepEqual(titulos, ['Atrasado recente', 'Atrasado antigo']);
    });
  });

  it('alterarStatus() registra e limpa a data de conclusão (RN07)', async () => {
    const id = await criarCompromisso(ana);
    assert.equal((await CompromissoModel.alterarStatus(ana, id, 'concluido')), true);
    assert.ok((await CompromissoModel.buscar(ana, id))!.concluido_em);
    assert.equal((await CompromissoModel.alterarStatus(ana, id, 'pendente')), true);
    assert.equal((await CompromissoModel.buscar(ana, id))!.concluido_em, null);
  });

  it('atualizar() mantém a data de conclusão original de um compromisso já concluído', async () => {
    const id = await criarCompromisso(ana);
    await CompromissoModel.alterarStatus(ana, id, 'concluido');
    const antes = (await CompromissoModel.buscar(ana, id))!.concluido_em;
    const { dados } = await CompromissoModel.validar({ tipo: 'audiencia', titulo: 'Novo', data: HOJE, status: 'concluido' }, ana);
    await CompromissoModel.atualizar(ana, id, dados);
    assert.equal((await CompromissoModel.buscar(ana, id))!.concluido_em, antes);
  });

  it('não altera nem exclui compromisso de outra usuária', async () => {
    const id = await criarCompromisso(ana);
    assert.equal((await CompromissoModel.alterarStatus(bia, id, 'concluido')), false);
    assert.equal((await CompromissoModel.excluir(bia, id)), false);
    assert.equal((await CompromissoModel.buscar(bia, id)), undefined);
    assert.equal((await CompromissoModel.excluir(ana, id)), true);
  });

  it('traz número e cliente do processo vinculado', async () => {
    const p = await criarProcesso(ana, { numero: 'P-9', cliente: 'Carlos' });
    const id = await criarCompromisso(ana, { processo_id: p });
    const c = (await CompromissoModel.buscar(ana, id))!;
    assert.equal(c.processo_numero, 'P-9');
    assert.equal(c.processo_cliente, 'Carlos');
  });

  it('estaAtrasado() só considera pendentes com data passada', async () => {
    assert.equal(CompromissoModel.estaAtrasado({ status: 'pendente', data: '2026-10-27' }, HOJE), true);
    assert.equal(CompromissoModel.estaAtrasado({ status: 'pendente', data: HOJE }, HOJE), false);
    assert.equal(CompromissoModel.estaAtrasado({ status: 'concluido', data: '2026-10-01' }, HOJE), false);
  });
});
