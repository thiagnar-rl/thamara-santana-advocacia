import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCompromisso, criarProcesso, criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { CompromissosController } from '../src/controllers/compromissos.controller';

describe('CompromissosController', () => {
  let ana: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario();
  });

  it('criar() devolve 201 já com os dados do processo', async () => {
    const p = await criarProcesso(ana, { numero: 'P-1' });
    const res = resposta();
    (await CompromissosController.criar(
      requisicao({
        usuarioId: ana,
        body: { tipo: 'audiencia', titulo: 'Instrução', data: '2026-11-05', hora: '10:00', processo_id: p },
      }),
      res as never,
    ));
    assert.equal(res.statusCode, 201);
    assert.equal(res.corpo.processo_numero, 'P-1');
    assert.equal(res.corpo.status, 'pendente');
  });

  it('criar() devolve 400 com a mensagem de validação', async () => {
    const res = resposta();
    await CompromissosController.criar(requisicao({ usuarioId: ana, body: { tipo: 'audiencia', data: '2026-11-05' } }), res as never);
    assert.equal(res.statusCode, 400);
    assert.equal(res.corpo.erro, 'Informe um título.');
  });

  it('alterarStatus() conclui o compromisso e recusa status inválido', async () => {
    const id = await criarCompromisso(ana);

    const invalido = resposta();
    await CompromissosController.alterarStatus(requisicao({ usuarioId: ana, params: { id: String(id) }, body: { status: 'feito' } }), invalido as never);
    assert.equal(invalido.statusCode, 400);

    const ok = resposta();
    await CompromissosController.alterarStatus(requisicao({ usuarioId: ana, params: { id: String(id) }, body: { status: 'concluido' } }), ok as never);
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.corpo.status, 'concluido');
    assert.ok(ok.corpo.concluido_em);
  });

  it('atualizar() devolve 404 para compromisso inexistente', async () => {
    const res = resposta();
    (await CompromissosController.atualizar(
      requisicao({ usuarioId: ana, params: { id: '999' }, body: { tipo: 'recurso', titulo: 'X', data: '2026-11-05' } }),
      res as never,
    ));
    assert.equal(res.statusCode, 404);
  });

  it('listar() repassa os filtros da URL', async () => {
    await criarCompromisso(ana, { tipo: 'recurso', titulo: 'R' });
    await criarCompromisso(ana, { tipo: 'audiencia', titulo: 'A' });
    const res = resposta();
    await CompromissosController.listar(requisicao({ usuarioId: ana, query: { tipo: 'recurso' } }), res as never);
    assert.deepEqual(res.corpo.map((c: { titulo: string }) => c.titulo), ['R']);
  });

  it('excluir() devolve 204', async () => {
    const id = await criarCompromisso(ana);
    const res = resposta();
    await CompromissosController.excluir(requisicao({ usuarioId: ana, params: { id: String(id) } }), res as never);
    assert.equal(res.statusCode, 204);
  });
});
