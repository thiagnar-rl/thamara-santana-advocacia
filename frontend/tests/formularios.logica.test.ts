import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validarAcesso, validarCompromisso, validarProcesso } from '../src/app/core/logica/formularios.logica';

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
    assert.equal(validarProcesso({ numero: '1', cliente: '' }).campo, 'cliente');
    assert.equal(validarProcesso({ numero: '1', cliente: 'A' }).erro, null);
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
});
