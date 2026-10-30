import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { AuthController } from '../src/controllers/auth.controller';
import { RecuperacaoModel, hashDoToken } from '../src/models/recuperacao.model';
import { UsuarioModel } from '../src/models/usuario.model';
import { todos } from '../src/config/database';
import { Email, definirEnviador } from '../src/utils/email';
import { MENSAGEM_LINK_INVALIDO, MENSAGEM_PEDIDO_RECEBIDO } from '../src/views/recuperacao.view';

/** [F3] "Esqueci minha senha" — solicitado por Thamara Santana (teste de 30/10/2026). */
describe('[F3] Recuperação de senha (sugestão: Thamara Santana)', () => {
  let ana: number;
  let enviados: Email[];

  /** Extrai o código do link enviado por e-mail. */
  const tokenDoEmail = (e: Email) => decodeURIComponent(e.texto.match(/token=([^\s]+)/)![1]);

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com', 'Ana Paula');
    enviados = [];
    definirEnviador(async (e) => {
      enviados.push(e);
    });
  });

  afterEach(() => {
    definirEnviador(null);
    delete process.env.VERCEL;
    delete process.env.APP_URL;
  });

  describe('RecuperacaoModel', () => {
    it('guarda só o hash do código, nunca o código em si', async () => {
      const token = (await RecuperacaoModel.criar({ id: ana }))!;
      const linhas = await todos<{ token_hash: string }>('SELECT token_hash FROM recuperacoes_senha');
      assert.equal(linhas.length, 1);
      assert.equal(linhas[0].token_hash, hashDoToken(token));
      assert.notEqual(linhas[0].token_hash, token);
    });

    it('o código vale 60 minutos', async () => {
      const agora = new Date('2026-10-30T12:00:00Z');
      const token = (await RecuperacaoModel.criar({ id: ana }, agora))!;
      assert.equal(await RecuperacaoModel.validar(token, new Date('2026-10-30T12:59:00Z')), ana);
      assert.equal(await RecuperacaoModel.validar(token, new Date('2026-10-30T13:00:00Z')), null);
      assert.equal(await RecuperacaoModel.validar('codigo-inventado-qualquer-123', agora), null);
    });

    it('limita a 3 pedidos a cada 15 minutos', async () => {
      const agora = new Date('2026-10-30T12:00:00Z');
      for (let i = 0; i < 3; i++) assert.ok(await RecuperacaoModel.criar({ id: ana }, agora));
      assert.equal(await RecuperacaoModel.criar({ id: ana }, agora), null);
      assert.ok(await RecuperacaoModel.criar({ id: ana }, new Date('2026-10-30T12:16:00Z')));
    });

    it('redefinir() troca a senha, e o código (e os outros pendentes) não valem mais', async () => {
      const t1 = (await RecuperacaoModel.criar({ id: ana }))!;
      const t2 = (await RecuperacaoModel.criar({ id: ana }))!;
      assert.equal(await RecuperacaoModel.redefinir(t1, 'nova-senha-123'), ana);
      assert.ok(await UsuarioModel.autenticar('ana@teste.com', 'nova-senha-123'));
      assert.equal(await UsuarioModel.autenticar('ana@teste.com', 'senha123'), null);
      assert.equal(await RecuperacaoModel.redefinir(t1, 'outra-senha'), null); // já usado
      assert.equal(await RecuperacaoModel.redefinir(t2, 'outra-senha'), null); // invalidado
    });
  });

  describe('AuthController', () => {
    it('esqueciSenha() envia o e-mail com o link e responde de forma neutra', async () => {
      process.env.APP_URL = 'https://meusite.exemplo/';
      const res = resposta();
      await AuthController.esqueciSenha(requisicao({ body: { email: ' ANA@teste.com ' } }), res as never);
      assert.equal(res.statusCode, 200);
      assert.equal(res.corpo.mensagem, MENSAGEM_PEDIDO_RECEBIDO);
      assert.equal(enviados.length, 1);
      assert.equal(enviados[0].para, 'ana@teste.com');
      assert.match(enviados[0].texto, /^Olá, Ana!/);
      assert.match(enviados[0].texto, /https:\/\/meusite\.exemplo\/redefinir-senha\?token=/);
    });

    it('esqueciSenha() não revela se o e-mail existe e recusa e-mail inválido', async () => {
      const res = resposta();
      await AuthController.esqueciSenha(requisicao({ body: { email: 'ninguem@teste.com' } }), res as never);
      assert.equal(res.statusCode, 200);
      assert.equal(res.corpo.mensagem, MENSAGEM_PEDIDO_RECEBIDO);
      assert.equal(enviados.length, 0);

      const invalido = resposta();
      await AuthController.esqueciSenha(requisicao({ body: { email: 'sem-arroba' } }), invalido as never);
      assert.equal(invalido.statusCode, 400);
    });

    it('esqueciSenha() avisa (503) quando o e-mail não foi configurado na Vercel', async () => {
      definirEnviador(null);
      process.env.VERCEL = '1';
      const salvoUsuario = process.env.SMTP_USUARIO;
      delete process.env.SMTP_USUARIO;
      const res = resposta();
      await AuthController.esqueciSenha(requisicao({ body: { email: 'ana@teste.com' } }), res as never);
      assert.equal(res.statusCode, 503);
      if (salvoUsuario) process.env.SMTP_USUARIO = salvoUsuario;
    });

    it('redefinirSenha() troca a senha e já devolve a sessão; link usado ou senha curta são recusados', async () => {
      await AuthController.esqueciSenha(requisicao({ body: { email: 'ana@teste.com' } }), resposta() as never);
      const token = tokenDoEmail(enviados[0]);

      const curta = resposta();
      await AuthController.redefinirSenha(requisicao({ body: { token, senha: '123' } }), curta as never);
      assert.equal(curta.statusCode, 400);

      const ok = resposta();
      await AuthController.redefinirSenha(requisicao({ body: { token, senha: 'senha-nova-1' } }), ok as never);
      assert.equal(ok.statusCode, 200);
      assert.ok(ok.corpo.token);
      assert.equal(ok.corpo.usuario.email, 'ana@teste.com');
      assert.equal('senha_hash' in ok.corpo.usuario, false);

      const denovo = resposta();
      await AuthController.redefinirSenha(requisicao({ body: { token, senha: 'senha-nova-2' } }), denovo as never);
      assert.equal(denovo.statusCode, 400);
      assert.equal(denovo.corpo.erro, MENSAGEM_LINK_INVALIDO);
    });
  });
});
