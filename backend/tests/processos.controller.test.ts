import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCompromisso, criarProcesso, criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { ProcessosController } from '../src/controllers/processos.controller';

describe('ProcessosController', () => {
  let ana: number;
  let bia: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com');
    bia = await criarUsuario('bia@teste.com');
  });

  it('criar() devolve 201 e o processo criado', async () => {
    const res = resposta();
    await ProcessosController.criar(requisicao({ usuarioId: ana, body: { numero: '0001234-56.2026.8.26.0100', cliente: 'Carlos' } }), res as never);
    assert.equal(res.statusCode, 201);
    assert.equal(res.corpo.numero, '0001234-56.2026.8.26.0100');
    assert.equal(res.corpo.total_pendentes, 0);
  });

  it('criar() devolve 400 sem cliente e 409 com número repetido', async () => {
    const semCliente = resposta();
    await ProcessosController.criar(requisicao({ usuarioId: ana, body: { numero: '0001234-56.2026.8.26.0100' } }), semCliente as never);
    assert.equal(semCliente.statusCode, 400);

    await criarProcesso(ana, { numero: '0001234-56.2026.8.26.0100' });
    const repetido = resposta();
    await ProcessosController.criar(requisicao({ usuarioId: ana, body: { numero: '0001234-56.2026.8.26.0100', cliente: 'X' } }), repetido as never);
    assert.equal(repetido.statusCode, 409);
  });

  it('[C1] criar() devolve 400 para número fora do padrão CNJ (sugestão: Mariana Couto)', async () => {
    const res = resposta();
    await ProcessosController.criar(requisicao({ usuarioId: ana, body: { numero: '123abc', cliente: 'Carlos' } }), res as never);
    assert.equal(res.statusCode, 400);
    assert.match(res.corpo.erro, /padrão CNJ/);
  });

  it('listar() aplica a busca enviada na URL', async () => {
    await criarProcesso(ana, { numero: '0001234-56.2026.8.26.0100', cliente: 'Carlos' });
    await criarProcesso(ana, { numero: '0007654-32.2025.5.15.0001', cliente: 'Renata' });
    const res = resposta();
    await ProcessosController.listar(requisicao({ usuarioId: ana, query: { busca: 'ren' } }), res as never);
    assert.deepEqual(res.corpo.map((p: { cliente: string }) => p.cliente), ['Renata']);
  });

  it('obter() devolve processo + compromissos e 404 para outra usuária', async () => {
    const p = await criarProcesso(ana);
    await criarCompromisso(ana, { processo_id: p });

    const res = resposta();
    await ProcessosController.obter(requisicao({ usuarioId: ana, params: { id: String(p) } }), res as never);
    assert.equal(res.corpo.processo.id, p);
    assert.equal(res.corpo.compromissos.length, 1);

    const outra = resposta();
    await ProcessosController.obter(requisicao({ usuarioId: bia, params: { id: String(p) } }), outra as never);
    assert.equal(outra.statusCode, 404);
  });

  it('atualizar() devolve 200, ou 404 se não for da usuária', async () => {
    const p = await criarProcesso(ana);
    const body = { numero: '0007654-32.2025.5.15.0001', cliente: 'Novo cliente', status: 'suspenso' };

    const res = resposta();
    await ProcessosController.atualizar(requisicao({ usuarioId: ana, params: { id: String(p) }, body }), res as never);
    assert.equal(res.corpo.status, 'suspenso');

    const outra = resposta();
    await ProcessosController.atualizar(requisicao({ usuarioId: bia, params: { id: String(p) }, body }), outra as never);
    assert.equal(outra.statusCode, 404);
  });

  it('excluir() devolve 204 e depois 404', async () => {
    const p = await criarProcesso(ana);
    const res = resposta();
    await ProcessosController.excluir(requisicao({ usuarioId: ana, params: { id: String(p) } }), res as never);
    assert.equal(res.statusCode, 204);
    assert.equal(res.encerrada, true);

    const denovo = resposta();
    await ProcessosController.excluir(requisicao({ usuarioId: ana, params: { id: String(p) } }), denovo as never);
    assert.equal(denovo.statusCode, 404);
  });
});
