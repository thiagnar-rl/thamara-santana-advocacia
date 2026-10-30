import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { novoBanco, requisicao, resposta } from './helpers';
import { AuthController } from '../src/controllers/auth.controller';
import { verificarToken } from '../src/utils/token';

const cadastro = { nome: 'Thamara Santana', email: 'thamara@teste.com', senha: 'senha123' };

describe('AuthController', () => {
  beforeEach(() => novoBanco());

  it('registrar() cria a conta e devolve 201 com token válido', async () => {
    const res = resposta();
    await AuthController.registrar(requisicao({ body: cadastro }), res as never);
    assert.equal(res.statusCode, 201);
    assert.equal(res.corpo.usuario.email, 'thamara@teste.com');
    assert.equal(verificarToken(res.corpo.token), res.corpo.usuario.id);
  });

  it('registrar() devolve 400 para dados inválidos', async () => {
    const res = resposta();
    await AuthController.registrar(requisicao({ body: { ...cadastro, senha: '1' } }), res as never);
    assert.equal(res.statusCode, 400);
    assert.match(res.corpo.erro, /pelo menos 8/); // [C3]
  });

  it('registrar() devolve 409 para e-mail repetido', async () => {
    await AuthController.registrar(requisicao({ body: cadastro }), resposta() as never);
    const res = resposta();
    await AuthController.registrar(requisicao({ body: { ...cadastro, email: 'THAMARA@teste.com' } }), res as never);
    assert.equal(res.statusCode, 409);
  });

  it('[C3] registrar() recusa senha fraca como "123456" (sugestão: Pedro Nogueira, teste 5)', async () => {
    for (const senha of ['123456', '12345678', 'abcdefgh']) {
      const res = resposta();
      await AuthController.registrar(requisicao({ body: { ...cadastro, senha } }), res as never);
      assert.equal(res.statusCode, 400, senha);
    }
    const ok = resposta();
    await AuthController.registrar(requisicao({ body: { ...cadastro, senha: 'Pedro2026' } }), ok as never);
    assert.equal(ok.statusCode, 201);
  });

  it('login() devolve 200 com a senha certa e 401 com a errada', async () => {
    await AuthController.registrar(requisicao({ body: cadastro }), resposta() as never);

    const ok = resposta();
    await AuthController.login(requisicao({ body: { email: cadastro.email, senha: 'senha123' } }), ok as never);
    assert.equal(ok.statusCode, 200);
    assert.ok(ok.corpo.token);
    assert.equal(ok.corpo.usuario.senha_hash, undefined);

    const errado = resposta();
    await AuthController.login(requisicao({ body: { email: cadastro.email, senha: 'xxx' } }), errado as never);
    assert.equal(errado.statusCode, 401);
    assert.equal(errado.corpo.erro, 'E-mail ou senha incorretos.');
  });

  it('eu() devolve a usuária logada ou 404', async () => {
    const criado = resposta();
    await AuthController.registrar(requisicao({ body: cadastro }), criado as never);

    const res = resposta();
    await AuthController.eu(requisicao({ usuarioId: criado.corpo.usuario.id }), res as never);
    assert.equal(res.corpo.nome, 'Thamara Santana');

    const inexistente = resposta();
    await AuthController.eu(requisicao({ usuarioId: 999 }), inexistente as never);
    assert.equal(inexistente.statusCode, 404);
  });
});

describe('AuthController com cadastro fechado (PERMITIR_CADASTRO=false)', () => {
  beforeEach(() => novoBanco());

  it('registrar() devolve 403', async () => {
    process.env.PERMITIR_CADASTRO = 'false';
    try {
      const res = resposta();
      await AuthController.registrar(requisicao({ body: cadastro }), res as never);
      assert.equal(res.statusCode, 403);
      assert.equal(res.corpo.erro, 'O cadastro de novas contas está desativado.');
    } finally {
      delete process.env.PERMITIR_CADASTRO;
    }
  });
});
