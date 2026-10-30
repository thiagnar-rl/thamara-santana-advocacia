import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aniversarioProximo,
  clienteVazio,
  cnpjValido,
  cpfValido,
  documentoPrincipal,
  encontrarClientePorNome,
  enderecoCompleto,
  formDoCliente,
  linkWhatsApp,
  mascaraCEP,
  mascaraCNPJ,
  mascaraCPF,
  mascaraTelefone,
  textoAniversario,
  validarCliente,
} from '../src/app/core/logica/clientes.logica';
import type { Cliente } from '../src/app/core/models';

const HOJE = '2026-10-30';

/** [F6] Cadastro de clientes com aviso de aniversário — solicitado por Thamara Santana (30/10/2026). */
describe('[F6] clientes.logica (sugestão: Thamara Santana)', () => {
  it('máscaras de CPF, CNPJ, CEP e telefone enquanto digita', () => {
    assert.equal(mascaraCPF('529'), '529');
    assert.equal(mascaraCPF('5299822'), '529.982.2');
    assert.equal(mascaraCPF('52998224725999'), '529.982.247-25'); // no máximo 11 números
    assert.equal(mascaraCNPJ('11222333000181'), '11.222.333/0001-81');
    assert.equal(mascaraCEP('01310100'), '01310-100');
    assert.equal(mascaraTelefone('1133334444'), '(11) 3333-4444');
    assert.equal(mascaraTelefone('11988887777'), '(11) 98888-7777');
    assert.equal(mascaraTelefone('abc'), ''); // letras são descartadas
  });

  it('cpfValido() e cnpjValido() conferem os dígitos verificadores', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
    assert.equal(cpfValido('529.982.247-24'), false);
    assert.equal(cpfValido('000.000.000-00'), false);
    assert.equal(cnpjValido('11.222.333/0001-81'), true);
    assert.equal(cnpjValido('11.222.333/0001-82'), false);
  });

  it('validarCliente() aponta o campo com erro', () => {
    const pf = { ...clienteVazio('fisica'), nome: 'Maria' };
    assert.deepEqual(validarCliente({ ...pf, nome: ' ' }, HOJE), { erro: 'Informe o nome completo.', campo: 'nome' });
    assert.equal(validarCliente({ ...clienteVazio('juridica') }, HOJE).erro, 'Informe a razão social.');
    assert.equal(validarCliente({ ...pf, cpf: '529.982.247-24' }, HOJE).campo, 'cpf');
    assert.equal(validarCliente({ ...pf, data_nascimento: '2030-01-01' }, HOJE).campo, 'data_nascimento');
    assert.equal(validarCliente({ ...pf, cep: '01310-1' }, HOJE).campo, 'cep');
    assert.equal(validarCliente({ ...pf, celular: '(11) 9888' }, HOJE).campo, 'celular');
    assert.equal(validarCliente({ ...pf, email: 'maria@' }, HOJE).campo, 'email');
    const pj = { ...clienteVazio('juridica'), nome: 'Alfa Ltda' };
    assert.equal(validarCliente({ ...pj, cnpj: '11.222.333/0001-82' }, HOJE).campo, 'cnpj');
    assert.equal(validarCliente({ ...pj, representante_cpf: '111.111.111-11' }, HOJE).campo, 'representante_cpf');
    assert.deepEqual(validarCliente({ ...pf, cpf: '529.982.247-25', celular: '(11) 98888-7777' }, HOJE), { erro: null, campo: null });
  });

  it('textoAniversario() e aniversarioProximo() para o aviso', () => {
    assert.equal(textoAniversario({ data: HOJE, dias: 0, idade: 40 }), 'Hoje');
    assert.equal(textoAniversario({ data: '2026-10-31', dias: 1, idade: 40 }), 'Amanhã');
    assert.equal(textoAniversario({ data: '2026-11-04', dias: 5, idade: 40 }), 'em 5 dias');
    assert.equal(textoAniversario(null), '');
    assert.equal(aniversarioProximo({ data: '2026-11-06', dias: 7, idade: 40 }), true);
    assert.equal(aniversarioProximo({ data: '2026-11-07', dias: 8, idade: 40 }), false);
    assert.equal(aniversarioProximo(null), false);
  });

  it('linkWhatsApp() monta o link com o 55 e a mensagem', () => {
    assert.equal(linkWhatsApp('(11) 98888-7777'), 'https://wa.me/5511988887777');
    assert.equal(linkWhatsApp('(11) 98888-7777', 'Oi!'), 'https://wa.me/5511988887777?text=Oi!');
    assert.equal(linkWhatsApp(null), null);
  });

  it('enderecoCompleto(), documentoPrincipal() e formDoCliente()', () => {
    assert.equal(
      enderecoCompleto({ logradouro: 'Av. Paulista', endereco_numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', cep: '01310-100' }),
      'Av. Paulista, 1000 · Bela Vista · São Paulo/SP · CEP 01310-100',
    );
    assert.equal(documentoPrincipal({ tipo: 'fisica', cpf: '529.982.247-25', cnpj: null }), '529.982.247-25');
    assert.equal(documentoPrincipal({ tipo: 'juridica', cpf: null, cnpj: '11.222.333/0001-81' }), '11.222.333/0001-81');

    const salvo = { ...clienteVazio(), id: 3, nome: 'Ana', total_processos: 2, aniversario: null, criado_em: '', atualizado_em: '' } as Cliente;
    const form = formDoCliente(salvo);
    assert.equal(form.nome, 'Ana');
    assert.equal('id' in form, false);
  });

  it('encontrarClientePorNome() ignora maiúsculas, espaços e acentos', () => {
    const lista = [{ id: 1, nome: 'José Antônio' }, { id: 2, nome: 'Maria' }];
    assert.equal(encontrarClientePorNome(lista, '  jose antonio ')?.id, 1);
    assert.equal(encontrarClientePorNome(lista, 'Mari'), null);
    assert.equal(encontrarClientePorNome(lista, ''), null);
  });
});
