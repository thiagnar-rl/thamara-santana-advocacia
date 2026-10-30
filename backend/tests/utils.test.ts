import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatarISO, inicioDoMes, somarDias } from '../src/utils/datas';
import { dataValida, emailValido, horaValida, normalizarNumeroCNJ, problemaNaSenha, texto, TIPOS, umDe } from '../src/utils/validacao';

describe('utils/validacao', () => {
  it('texto() apara espaços e transforma vazio em null', async () => {
    assert.equal(texto('  Ana  '), 'Ana');
    assert.equal(texto('   '), null);
    assert.equal(texto(undefined), null);
    assert.equal(texto(null), null);
    assert.equal(texto(42), '42');
  });

  it('dataValida() aceita AAAA-MM-DD existente e recusa datas impossíveis', async () => {
    assert.equal(dataValida('2026-10-28'), true);
    assert.equal(dataValida('2024-02-29'), true); // ano bissexto
    assert.equal(dataValida('2026-02-30'), false);
    assert.equal(dataValida('28/10/2026'), false);
    assert.equal(dataValida(''), false);
    assert.equal(dataValida(null), false);
  });

  it('horaValida() aceita de 00:00 a 23:59', async () => {
    assert.equal(horaValida('00:00'), true);
    assert.equal(horaValida('23:59'), true);
    assert.equal(horaValida('24:00'), false);
    assert.equal(horaValida('9:30'), false);
    assert.equal(horaValida('12:60'), false);
  });

  it('emailValido() confere o formato do e-mail', async () => {
    assert.equal(emailValido('thamara@advocacia.com.br'), true);
    assert.equal(emailValido('sem-arroba.com'), false);
    assert.equal(emailValido('a@b'), false);
    assert.equal(emailValido(''), false);
  });

  it('[C1] normalizarNumeroCNJ() aceita só números no padrão CNJ (sugestão: Mariana Couto)', () => {
    assert.equal(normalizarNumeroCNJ('1002345-67.2026.8.26.0100'), '1002345-67.2026.8.26.0100');
    assert.equal(normalizarNumeroCNJ('10023456720268260100'), '1002345-67.2026.8.26.0100');
    assert.equal(normalizarNumeroCNJ(' 1002345.67-2026 8 26 0100 '), '1002345-67.2026.8.26.0100');
    assert.equal(normalizarNumeroCNJ('123abc'), null);
    assert.equal(normalizarNumeroCNJ('1002345-67.2026.8.26.010'), null); // 19 dígitos
    assert.equal(normalizarNumeroCNJ(''), null);
    assert.equal(normalizarNumeroCNJ(null), null);
  });

  it('[C3] problemaNaSenha() exige 8 caracteres, letras e números (sugestão: Pedro Nogueira)', () => {
    assert.equal(problemaNaSenha('123456'), 'A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    assert.equal(problemaNaSenha('12345678'), 'A senha precisa ter pelo menos uma letra.');
    assert.equal(problemaNaSenha('abcdefgh'), 'A senha precisa ter pelo menos um número.');
    assert.equal(problemaNaSenha('senha123'), null);
    assert.equal(problemaNaSenha('Ação2026'), null); // letras acentuadas contam como letra
    assert.equal(problemaNaSenha(undefined), 'A senha precisa ter pelo menos 8 caracteres, com letras e números.');
  });

  it('umDe() verifica se o valor pertence à lista', async () => {
    assert.equal(umDe(TIPOS, 'audiencia'), true);
    assert.equal(umDe(TIPOS, 'prazo'), false);
    assert.equal(umDe(TIPOS, undefined), false);
  });
});

describe('utils/datas', () => {
  it('somarDias() atravessa fim de mês e de ano', async () => {
    assert.equal(somarDias('2026-10-28', 7), '2026-11-04');
    assert.equal(somarDias('2026-12-30', 3), '2027-01-02');
    assert.equal(somarDias('2026-03-01', -1), '2026-02-28');
  });

  it('inicioDoMes() devolve o dia 1', async () => {
    assert.equal(inicioDoMes('2026-10-28'), '2026-10-01');
  });

  it('formatarISO() usa dois dígitos para mês e dia', async () => {
    assert.equal(formatarISO(new Date(2026, 0, 5)), '2026-01-05');
  });
});
