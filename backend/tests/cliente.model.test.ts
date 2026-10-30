import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, criarProcesso, criarUsuario, dadosCliente, novoBanco } from './helpers';
import { ClienteModel } from '../src/models/cliente.model';
import { ProcessoModel } from '../src/models/processo.model';

const HOJE = '2026-10-30';

/** [F6] Cadastro de clientes com aviso de aniversário — solicitado por Thamara Santana (30/10/2026). */
describe('[F6] ClienteModel (sugestão: Thamara Santana)', () => {
  let ana: number;
  let bia: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com');
    bia = await criarUsuario('bia@teste.com');
  });

  describe('validar()', () => {
    it('aceita pessoa física completa e padroniza documentos e telefones', () => {
      const { dados, erro } = ClienteModel.validar(
        { ...dadosCliente(), cpf: '52998224725', cep: '01310100', celular: '11988887777', uf: 'sp', email: 'Maria@Exemplo.com' },
        HOJE,
      );
      assert.equal(erro, null);
      assert.equal(dados.cpf, '529.982.247-25');
      assert.equal(dados.cep, '01310-100');
      assert.equal(dados.celular, '(11) 98888-7777');
      assert.equal(dados.uf, 'SP');
      assert.equal(dados.email, 'maria@exemplo.com');
    });

    it('exige o nome e mostra a mensagem certa para cada tipo', () => {
      assert.equal(ClienteModel.validar({ tipo: 'fisica' }, HOJE).erro, 'Informe o nome completo.');
      assert.equal(ClienteModel.validar({ tipo: 'juridica' }, HOJE).erro, 'Informe a razão social.');
      assert.equal(ClienteModel.validar({ tipo: 'outro', nome: 'X' }, HOJE).erro, 'Escolha se o cliente é pessoa física ou jurídica.');
    });

    it('recusa CPF, CNPJ, CEP, telefone, e-mail, UF e datas inválidos', () => {
      const erro = (extra: object) => ClienteModel.validar({ nome: 'Ana', ...extra }, HOJE).erro;
      assert.equal(erro({ cpf: '123.456.789-00' }), 'CPF inválido. Confira os 11 números.');
      assert.equal(erro({ tipo: 'juridica', cnpj: '11.222.333/0001-80' }), 'CNPJ inválido. Confira os 14 números.');
      assert.equal(erro({ tipo: 'juridica', representante_cpf: '111' }), 'CPF do representante legal inválido.');
      assert.equal(erro({ cep: '123' }), 'CEP inválido. Use 8 números (00000-000).');
      assert.equal(erro({ celular: '98888-7777' }), 'Celular inválido. Informe DDD + número.');
      assert.equal(erro({ email: 'sem-arroba' }), 'E-mail inválido.');
      assert.equal(erro({ uf: 'XX' }), 'UF inválida.');
      assert.equal(erro({ data_nascimento: '2030-01-01' }), 'Data de nascimento inválida.');
      assert.equal(erro({ estado_civil: 'Enrolado(a)' }), 'Estado civil inválido.');
    });

    it('guarda só os campos do tipo escolhido', () => {
      const pj = ClienteModel.validar(
        { tipo: 'juridica', nome: 'Padaria Pão Bom Ltda', cnpj: '11222333000181', cpf: '52998224725', profissao: 'X' },
        HOJE,
      ).dados;
      assert.equal(pj.cnpj, '11.222.333/0001-81');
      assert.equal(pj.cpf, null);
      assert.equal(pj.profissao, null);

      const pf = ClienteModel.validar({ tipo: 'fisica', nome: 'Ana', cnpj: '11222333000181' }, HOJE).dados;
      assert.equal(pf.cnpj, null);
    });
  });

  it('lista só os clientes da própria usuária, em ordem alfabética, com filtro e busca', async () => {
    await criarCliente(ana, { nome: 'Zuleica', cpf: '111.444.777-35' });
    await criarCliente(ana, { nome: 'Bruno' });
    await criarCliente(ana, { tipo: 'juridica', nome: 'Alfa Ltda', cpf: null, cnpj: '11.222.333/0001-81', data_nascimento: null });
    await criarCliente(bia, { nome: 'Cliente da Bia' });

    assert.deepEqual((await ClienteModel.listar(ana)).map((c) => c.nome), ['Alfa Ltda', 'Bruno', 'Zuleica']);
    assert.deepEqual((await ClienteModel.listar(ana, { tipo: 'juridica' })).map((c) => c.nome), ['Alfa Ltda']);
    assert.deepEqual((await ClienteModel.listar(ana, { busca: 'zul' })).map((c) => c.nome), ['Zuleica']);
    assert.deepEqual((await ClienteModel.listar(ana, { busca: '11222333' })).map((c) => c.nome), ['Alfa Ltda']); // CNPJ só com números
  });

  it('documentoRepetido() impede CPF/CNPJ duplicado para a mesma usuária', async () => {
    const id = await criarCliente(ana);
    assert.equal(await ClienteModel.documentoRepetido(ana, dadosCliente()), 'Já existe um cliente cadastrado com este CPF.');
    assert.equal(await ClienteModel.documentoRepetido(ana, dadosCliente(), id), null); // o próprio cliente
    assert.equal(await ClienteModel.documentoRepetido(bia, dadosCliente()), null); // outra usuária
  });

  it('atualizar() também atualiza o nome nos processos vinculados', async () => {
    const cliente = await criarCliente(ana);
    const processo = await criarProcesso(ana, { cliente: 'Maria Aparecida Souza', cliente_id: cliente });
    assert.equal(await ClienteModel.atualizar(ana, cliente, dadosCliente({ nome: 'Maria A. Souza Lima' })), true);
    assert.equal((await ProcessoModel.buscar(ana, processo, HOJE))!.cliente, 'Maria A. Souza Lima');
    assert.equal(await ClienteModel.atualizar(bia, cliente, dadosCliente()), false); // outra usuária
  });

  it('excluir() mantém os processos, apenas desfazendo o vínculo', async () => {
    const cliente = await criarCliente(ana);
    const processo = await criarProcesso(ana, { cliente_id: cliente });
    assert.equal((await ClienteModel.buscar(ana, cliente))!.total_processos, 1);
    assert.equal(await ClienteModel.excluir(bia, cliente), false);
    assert.equal(await ClienteModel.excluir(ana, cliente), true);
    const p = (await ProcessoModel.buscar(ana, processo, HOJE))!;
    assert.equal(p.cliente_id, null);
    assert.ok(p.cliente);
  });

  it('aniversariantes() traz os próximos 7 dias (PF e representante de PJ), do mais próximo ao mais distante', async () => {
    await criarCliente(ana, { nome: 'Hoje', cpf: null, data_nascimento: '1980-10-30' });
    await criarCliente(ana, { nome: 'Daqui 7 dias', cpf: null, data_nascimento: '1970-11-06' });
    await criarCliente(ana, { nome: 'Daqui 8 dias', cpf: null, data_nascimento: '1970-11-07' });
    await criarCliente(ana, { nome: 'Ontem', cpf: null, data_nascimento: '1970-10-29' });
    await criarCliente(ana, { nome: 'Sem data', cpf: null, data_nascimento: null });
    await criarCliente(ana, {
      tipo: 'juridica', nome: 'Empresa X', cpf: null, data_nascimento: null,
      cnpj: '11.444.777/0001-61', representante_nome: 'Carlos', representante_nascimento: '1975-11-01',
    });
    await criarCliente(bia, { nome: 'Da Bia', cpf: null, data_nascimento: '1980-10-30' });

    const lista = await ClienteModel.aniversariantes(ana, HOJE);
    assert.deepEqual(lista.map((a) => [a.cliente.nome, a.aniversario.dias]), [['Hoje', 0], ['Empresa X', 2], ['Daqui 7 dias', 7]]);
    assert.equal(lista[0].aniversario.idade, 46);
  });
});
