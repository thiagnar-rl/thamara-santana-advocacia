import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cnpjValido,
  cpfValido,
  formatarCNPJ,
  formatarCPF,
  normalizarCEP,
  normalizarTelefone,
  proximoAniversario,
} from '../src/utils/documentos';

/** [F6] Cadastro de clientes — solicitado por Thamara Santana (teste de 30/10/2026). */
describe('[F6] utils/documentos (sugestão: Thamara Santana)', () => {
  it('cpfValido() confere os dígitos verificadores', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
    assert.equal(cpfValido('52998224725'), true);
    assert.equal(cpfValido('529.982.247-24'), false); // dígito errado
    assert.equal(cpfValido('111.111.111-11'), false); // sequência repetida
    assert.equal(cpfValido('123'), false);
    assert.equal(cpfValido(null), false);
  });

  it('cnpjValido() confere os dígitos verificadores', () => {
    assert.equal(cnpjValido('11.222.333/0001-81'), true);
    assert.equal(cnpjValido('11444777000161'), true);
    assert.equal(cnpjValido('11.222.333/0001-80'), false);
    assert.equal(cnpjValido('00.000.000/0000-00'), false);
    assert.equal(cnpjValido('1122233300018'), false); // 13 dígitos
  });

  it('formata CPF e CNPJ no padrão brasileiro', () => {
    assert.equal(formatarCPF('52998224725'), '529.982.247-25');
    assert.equal(formatarCNPJ('11222333000181'), '11.222.333/0001-81');
  });

  it('normalizarCEP() e normalizarTelefone() aceitam só tamanhos válidos', () => {
    assert.equal(normalizarCEP('01310100'), '01310-100');
    assert.equal(normalizarCEP('01310-10'), null);
    assert.equal(normalizarTelefone('1133334444'), '(11) 3333-4444');
    assert.equal(normalizarTelefone('(11) 98888-7777'), '(11) 98888-7777');
    assert.equal(normalizarTelefone('98888-7777'), null); // sem DDD
  });

  it('proximoAniversario() calcula dias e idade, inclusive na virada do ano e em 29/02', () => {
    assert.deepEqual(proximoAniversario('1985-10-30', '2026-10-30'), { data: '2026-10-30', dias: 0, idade: 41 });
    assert.deepEqual(proximoAniversario('1990-11-02', '2026-10-30'), { data: '2026-11-02', dias: 3, idade: 36 });
    assert.deepEqual(proximoAniversario('1990-01-03', '2026-12-30'), { data: '2027-01-03', dias: 4, idade: 37 });
    assert.deepEqual(proximoAniversario('1992-02-29', '2026-02-20'), { data: '2026-02-28', dias: 8, idade: 34 });
    assert.equal(proximoAniversario('1990-10-29', '2026-10-30')?.data, '2027-10-29'); // já passou este ano
    assert.equal(proximoAniversario(null, '2026-10-30'), null);
  });
});
