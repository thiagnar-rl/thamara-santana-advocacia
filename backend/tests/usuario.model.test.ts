import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { novoBanco } from './helpers';
import { UsuarioModel } from '../src/models/usuario.model';

describe('UsuarioModel', () => {
  beforeEach(() => novoBanco());

  it('validarCadastro() aponta o primeiro erro encontrado', async () => {
    assert.equal(UsuarioModel.validarCadastro({}).erro, 'Informe seu nome.');
    assert.equal(UsuarioModel.validarCadastro({ nome: 'Ana', email: 'x' }).erro, 'Informe um e-mail válido.');
    assert.equal(
      UsuarioModel.validarCadastro({ nome: 'Ana', email: 'ana@x.com', senha: '123' }).erro,
      'A senha precisa ter pelo menos 8 caracteres, com letras e números.',
    );
    const ok = UsuarioModel.validarCadastro({ nome: ' Ana ', email: 'ANA@X.COM', senha: 'senha123' });
    assert.equal(ok.erro, null);
    assert.equal(ok.dados.nome, 'Ana');
    assert.equal(ok.dados.email, 'ana@x.com'); // e-mail normalizado
  });

  it('criar() guarda apenas o hash da senha (RNF01)', async () => {
    const id = await UsuarioModel.criar({ nome: 'Ana', email: 'ana@x.com', senha: 'segredo1' });
    const usuario = (await UsuarioModel.buscarPorId(id))!;
    assert.equal(usuario.nome, 'Ana');
    assert.notEqual(usuario.senha_hash, 'segredo1');
  });

  it('emailEmUso() ignora maiúsculas/minúsculas (RN01)', async () => {
    await UsuarioModel.criar({ nome: 'Ana', email: 'ana@x.com', senha: 'segredo1' });
    assert.equal((await UsuarioModel.emailEmUso('ANA@X.COM')), true);
    assert.equal((await UsuarioModel.emailEmUso('outra@x.com')), false);
  });

  it('autenticar() aceita a senha certa e recusa a errada', async () => {
    await UsuarioModel.criar({ nome: 'Ana', email: 'ana@x.com', senha: 'segredo1' });
    assert.equal((await UsuarioModel.autenticar('ana@x.com', 'segredo1'))?.email, 'ana@x.com');
    assert.equal((await UsuarioModel.autenticar('ana@x.com', 'errada')), null);
    assert.equal((await UsuarioModel.autenticar('naoexiste@x.com', 'segredo1')), null);
  });
});
