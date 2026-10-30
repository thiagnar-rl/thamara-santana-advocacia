import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatarNumeroCNJ,
  MENSAGEM_NUMERO_INVALIDO,
  numeroCNJValido,
  validarAcesso,
  validarCompromisso,
  validarEmail,
  validarNovaSenha,
  validarProcesso,
} from '../src/app/core/logica/formularios.logica';

const NUMERO = '1002345-67.2026.8.26.0100';

describe('formularios.logica', () => {
  it('validarCompromisso() indica a mensagem e o campo com erro', () => {
    assert.deepEqual(validarCompromisso({ titulo: ' ', data: '2026-10-28', hora: '' }), {
      erro: 'Dê um título ao compromisso.',
      campo: 'titulo',
    });
    assert.equal(validarCompromisso({ titulo: 'A', data: '', hora: null }).campo, 'data');
    assert.equal(validarCompromisso({ titulo: 'A', data: '2026-10-28', hora: '9h' }).campo, 'hora');
    assert.deepEqual(validarCompromisso({ titulo: 'A', data: '2026-10-28', hora: '09:00' }), { erro: null, campo: null });
  });

  it('validarProcesso() exige número e cliente', () => {
    assert.equal(validarProcesso({ numero: '', cliente: 'A' }).campo, 'numero');
    assert.equal(validarProcesso({ numero: NUMERO, cliente: '' }).campo, 'cliente');
    assert.equal(validarProcesso({ numero: NUMERO, cliente: 'A' }).erro, null);
  });

  it('[C1] validarProcesso() recusa número fora do padrão CNJ (sugestão: Mariana Couto)', () => {
    assert.deepEqual(validarProcesso({ numero: '123abc', cliente: 'A' }), { erro: MENSAGEM_NUMERO_INVALIDO, campo: 'numero' });
    assert.equal(validarProcesso({ numero: '1002345-67.2026', cliente: 'A' }).campo, 'numero'); // incompleto
  });

  it('[C1] formatarNumeroCNJ() aplica a máscara enquanto digita', () => {
    assert.equal(formatarNumeroCNJ('1002345'), '1002345');
    assert.equal(formatarNumeroCNJ('10023456'), '1002345-6');
    assert.equal(formatarNumeroCNJ('100234567202'), '1002345-67.202');
    assert.equal(formatarNumeroCNJ('10023456720268260100'), NUMERO);
    assert.equal(formatarNumeroCNJ('123abc'), '123'); // letras são descartadas
    assert.equal(formatarNumeroCNJ(NUMERO + '999'), NUMERO); // no máximo 20 dígitos
    assert.equal(formatarNumeroCNJ(''), '');
    assert.equal(formatarNumeroCNJ(null), '');
  });

  it('[C1] numeroCNJValido() só aceita o número completo', () => {
    assert.equal(numeroCNJValido(NUMERO), true);
    assert.equal(numeroCNJValido('1002345-67.2026.8.26.010'), false);
    assert.equal(numeroCNJValido('10023456720268260100'), false); // sem pontuação: o campo sempre formata antes
  });

  it('validarAcesso() valida login e cadastro', () => {
    assert.equal(validarAcesso('entrar', { nome: '', email: '', senha: '' }), 'Preencha e-mail e senha.');
    assert.equal(validarAcesso('entrar', { nome: '', email: 'a@b.com', senha: 'x' }), null);
    assert.equal(validarAcesso('cadastro', { nome: '', email: 'a@b.com', senha: '123456' }), 'Informe seu nome.');
    assert.equal(
      validarAcesso('cadastro', { nome: 'Ana', email: 'a@b.com', senha: '123' }),
      'A senha precisa ter pelo menos 6 caracteres.',
    );
  });

  it('[F3] validarEmail() confere o e-mail do "Esqueci minha senha" (sugestão: Thamara Santana)', () => {
    assert.equal(validarEmail(''), 'Informe o e-mail da sua conta.');
    assert.equal(validarEmail('thamara@'), 'Informe um e-mail válido.');
    assert.equal(validarEmail(' thamara@advocacia.com.br '), null);
  });

  it('[F3] validarNovaSenha() exige 6 caracteres e as duas senhas iguais', () => {
    assert.equal(validarNovaSenha('123', '123'), 'A senha precisa ter pelo menos 6 caracteres.');
    assert.equal(validarNovaSenha('senha123', 'senha124'), 'As duas senhas não são iguais.');
    assert.equal(validarNovaSenha('senha123', 'senha123'), null);
  });
});
