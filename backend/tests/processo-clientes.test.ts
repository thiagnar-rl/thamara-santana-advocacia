import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { ProcessosController } from '../src/controllers/processos.controller';
import { ClientesController } from '../src/controllers/clientes.controller';
import { ClienteModel } from '../src/models/cliente.model';
import { ProcessoModel, resumoDosClientes } from '../src/models/processo.model';
import { criarBancoLocal, definirBanco, migrarClientesDosProcessos } from '../src/config/database';
import { hoje } from '../src/utils/datas';

const NUMERO_1 = '0001234-56.2026.8.26.0100';
const NUMERO_2 = '0007654-32.2025.5.15.0001';

/** [C4] Vários clientes por processo e vários processos por cliente — pedido de Thiago Rinaldi Luna (04/11/2026). */
describe('[C4] Processo com vários clientes (sugestão: Thiago Rinaldi Luna)', () => {
  let ana: number;
  let maria: number;
  let joao: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com');
    maria = await criarCliente(ana, { nome: 'Maria Souza', cpf: '529.982.247-25' });
    joao = await criarCliente(ana, { nome: 'João Lima', cpf: '111.444.777-35' });
  });

  async function criarComClientes(numero: string, clientes: { nome: string; cliente_id: number | null }[]) {
    const res = resposta();
    await ProcessosController.criar(requisicao({ usuarioId: ana, body: { numero, clientes } }), res as never);
    return res;
  }

  it('um processo aceita vários clientes (cadastrados ou só pelo nome) e usa o nome do cadastro', async () => {
    const res = await criarComClientes(NUMERO_1, [
      { nome: 'maria', cliente_id: maria },
      { nome: 'João Lima', cliente_id: joao },
      { nome: 'Pedro (sem cadastro)', cliente_id: null },
      { nome: '  ', cliente_id: null }, // linha vazia é ignorada
      { nome: 'Maria Souza', cliente_id: maria }, // repetido é ignorado
    ]);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.corpo.clientes, [
      { nome: 'Maria Souza', cliente_id: maria },
      { nome: 'João Lima', cliente_id: joao },
      { nome: 'Pedro (sem cadastro)', cliente_id: null },
    ]);
    assert.equal(res.corpo.cliente, 'Maria Souza; João Lima; Pedro (sem cadastro)');
    assert.equal(res.corpo.cliente_id, maria);
  });

  it('um cliente aparece em todos os seus processos, e o total de processos conta todos', async () => {
    await criarComClientes(NUMERO_1, [{ nome: 'Maria Souza', cliente_id: maria }, { nome: 'João Lima', cliente_id: joao }]);
    await criarComClientes(NUMERO_2, [{ nome: 'João Lima', cliente_id: joao }]);

    const doJoao = await ProcessoModel.listarDoCliente(ana, joao, hoje());
    assert.equal(doJoao.length, 2);
    const daMaria = await ProcessoModel.listarDoCliente(ana, maria, hoje());
    assert.equal(daMaria.length, 1);
    assert.equal((await ClienteModel.buscar(ana, joao))!.total_processos, 2);

    // A busca encontra o processo por qualquer um dos clientes
    const busca = resposta();
    await ProcessosController.listar(requisicao({ usuarioId: ana, query: { busca: 'joão' } }), busca as never);
    assert.equal(busca.corpo.length, 2);
  });

  it('editar o processo troca os clientes; renomear ou excluir o cliente atualiza os processos', async () => {
    const criado = await criarComClientes(NUMERO_1, [{ nome: 'Maria Souza', cliente_id: maria }, { nome: 'João Lima', cliente_id: joao }]);
    const id = criado.corpo.id;

    const editar = resposta();
    await ProcessosController.atualizar(
      requisicao({ usuarioId: ana, params: { id: String(id) }, body: { numero: NUMERO_1, clientes: [{ nome: 'João Lima', cliente_id: joao }] } }),
      editar as never,
    );
    assert.deepEqual(editar.corpo.clientes, [{ nome: 'João Lima', cliente_id: joao }]);
    assert.equal((await ProcessoModel.listarDoCliente(ana, maria, hoje())).length, 0);

    await ClientesController.atualizar(
      requisicao({ usuarioId: ana, params: { id: String(joao) }, body: { ...(await ClienteModel.buscar(ana, joao)), nome: 'João Lima Neto' } }),
      resposta() as never,
    );
    let p = (await ProcessoModel.buscar(ana, id, hoje()))!;
    assert.equal(p.cliente, 'João Lima Neto');

    await ClienteModel.excluir(ana, joao);
    p = (await ProcessoModel.buscar(ana, id, hoje()))!;
    assert.equal(p.cliente, 'João Lima Neto'); // o nome continua no processo
    assert.equal(p.cliente_id, null);
    assert.equal((await ProcessoModel.listarDoCliente(ana, joao, hoje())).length, 0);
  });

  it('recusa cliente de outra usuária, processo sem cliente e o formato antigo continua funcionando', async () => {
    const bia = await criarUsuario('bia@teste.com');
    const daBia = await criarCliente(bia, { nome: 'Cliente da Bia', cpf: '529.982.247-25' });
    const deOutra = await criarComClientes(NUMERO_1, [{ nome: 'X', cliente_id: daBia }]);
    assert.equal(deOutra.statusCode, 400);

    const vazio = await criarComClientes(NUMERO_1, [{ nome: ' ', cliente_id: null }]);
    assert.equal(vazio.corpo.erro, 'Informe o nome do cliente.');

    const antigo = resposta();
    await ProcessosController.criar(requisicao({ usuarioId: ana, body: { numero: NUMERO_2, cliente: 'Maria', cliente_id: maria } }), antigo as never);
    assert.deepEqual(antigo.corpo.clientes, [{ nome: 'Maria Souza', cliente_id: maria }]);
  });

  it('resumoDosClientes() cabe em 150 caracteres', () => {
    const nomes = Array.from({ length: 12 }, (_, i) => ({ nome: `Herdeiro número ${i + 1} da família Oliveira`, cliente_id: null }));
    const resumo = resumoDosClientes(nomes);
    assert.ok(resumo.length <= 150);
    assert.match(resumo, /e mais \d+$/);
  });

  it('migração: processos antigos (um cliente só) passam para o novo formato ao abrir o banco', async () => {
    const banco = await criarBancoLocal(':memory:');
    definirBanco(banco);
    const u = await criarUsuario('velho@teste.com');
    const c = await criarCliente(u, { nome: 'Cliente Antigo' });
    // Simula um processo gravado pela versão anterior
    await banco.executar(
      "INSERT INTO processos (usuario_id, numero, cliente, cliente_id, status) VALUES (?, ?, 'Cliente Antigo', ?, 'ativo')",
      [u, NUMERO_1, c],
    );
    await migrarClientesDosProcessos(banco); // o mesmo que acontece quando o servidor liga
    await migrarClientesDosProcessos(banco); // rodar de novo não duplica nada
    const lista = await ProcessoModel.listarDoCliente(u, c, hoje());
    assert.equal(lista.length, 1);
    assert.equal(lista[0].clientes_nomes, JSON.stringify([{ nome: 'Cliente Antigo', cliente_id: c }]));
  });
});
