import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requisicao, resposta } from './helpers';
import { exigirLogin } from '../src/middlewares/auth.middleware';
import { gerarToken } from '../src/utils/token';

describe('middleware exigirLogin', () => {
  it('bloqueia requisição sem token (401)', async () => {
    const res = resposta();
    let passou = false;
    exigirLogin(requisicao(), res as never, () => (passou = true));
    assert.equal(passou, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.corpo.erro, 'Você precisa entrar para continuar.');
  });

  it('bloqueia token inválido (401)', async () => {
    const res = resposta();
    let passou = false;
    exigirLogin(requisicao({ headers: { authorization: 'Bearer token-falso' } }), res as never, () => (passou = true));
    assert.equal(passou, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.corpo.erro, 'Sua sessão expirou. Entre novamente.');
  });

  it('libera token válido e preenche req.usuarioId', async () => {
    const req = requisicao({ headers: { authorization: `Bearer ${gerarToken(42)}` } });
    let passou = false;
    exigirLogin(req, resposta() as never, () => (passou = true));
    assert.equal(passou, true);
    assert.equal(req.usuarioId, 42);
  });
});
