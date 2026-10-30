import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, criarProcesso, criarUsuario, dadosCliente, novoBanco, requisicao, resposta } from './helpers';
import { ClientesController } from '../src/controllers/clientes.controller';
import { ProcessosController } from '../src/controllers/processos.controller';
import { hoje } from '../src/utils/datas';

const NUMERO = '0001234-56.2026.8.26.0100';

/** [F6] API de clientes — solicitado por Thamara Santana (teste de 30/10/2026). */
describe('[F6] ClientesController (sugestão: Thamara Santana)', () => {
  let ana: number;
  let bia: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario('ana@teste.com');
    bia = await criarUsuario('bia@teste.com');
  });

  it('criar() devolve 201 sem expor usuario_id; 400 se inválido; 409 se o CPF repetir', async () => {
    const res = resposta();
    await ClientesController.criar(requisicao({ usuarioId: ana, body: dadosCliente({ cpf: '52998224725' }) }), res as never);
    assert.equal(res.statusCode, 201);
    assert.equal(res.corpo.cpf, '529.982.247-25');
    assert.equal(res.corpo.total_processos, 0);
    assert.equal('usuario_id' in res.corpo, false);

    const invalido = resposta();
    await ClientesController.criar(requisicao({ usuarioId: ana, body: { nome: '' } }), invalido as never);
    assert.equal(invalido.statusCode, 400);

    const repetido = resposta();
    await ClientesController.criar(requisicao({ usuarioId: ana, body: dadosCliente() }), repetido as never);
    assert.equal(repetido.statusCode, 409);
  });

  it('obter() devolve o cliente com os processos dele, e 404 para outra usuária', async () => {
    const id = await criarCliente(ana);
    await criarProcesso(ana, { cliente_id: id });
    const res = resposta();
    await ClientesController.obter(requisicao({ usuarioId: ana, params: { id: String(id) } }), res as never);
    assert.equal(res.corpo.cliente.id, id);
    assert.equal(res.corpo.processos.length, 1);

    const outra = resposta();
    await ClientesController.obter(requisicao({ usuarioId: bia, params: { id: String(id) } }), outra as never);
    assert.equal(outra.statusCode, 404);
  });

  it('atualizar() devolve 200, e excluir() devolve 204 e depois 404', async () => {
    const id = await criarCliente(ana);
    const res = resposta();
    await ClientesController.atualizar(
      requisicao({ usuarioId: ana, params: { id: String(id) }, body: dadosCliente({ nome: 'Novo nome' }) }),
      res as never,
    );
    assert.equal(res.corpo.nome, 'Novo nome');

    const excluir = resposta();
    await ClientesController.excluir(requisicao({ usuarioId: ana, params: { id: String(id) } }), excluir as never);
    assert.equal(excluir.statusCode, 204);
    const denovo = resposta();
    await ClientesController.excluir(requisicao({ usuarioId: ana, params: { id: String(id) } }), denovo as never);
    assert.equal(denovo.statusCode, 404);
  });

  it('aniversariantes() avisa quem faz aniversário hoje', async () => {
    const [, mes, dia] = hoje().split('-');
    await criarCliente(ana, { nome: 'Aniversariante', cpf: null, data_nascimento: `1990-${mes}-${dia}` });
    await criarCliente(ana, { nome: 'Sem data', cpf: null, data_nascimento: null });
    const res = resposta();
    await ClientesController.aniversariantes(requisicao({ usuarioId: ana, query: {} }), res as never);
    assert.equal(res.corpo.length, 1);
    assert.equal(res.corpo[0].nome, 'Aniversariante');
    assert.equal(res.corpo[0].aniversario.dias, 0);
  });

  it('processos: vincula ao cliente cadastrado e usa o nome do cadastro; recusa cliente de outra usuária', async () => {
    const id = await criarCliente(ana, { nome: 'Maria Aparecida Souza' });
    const res = resposta();
    await ProcessosController.criar(
      requisicao({ usuarioId: ana, body: { numero: NUMERO, cliente: 'maria', cliente_id: id } }),
      res as never,
    );
    assert.equal(res.statusCode, 201);
    assert.equal(res.corpo.cliente_id, id);
    assert.equal(res.corpo.cliente, 'Maria Aparecida Souza');

    const daBia = await criarCliente(bia);
    const outra = resposta();
    await ProcessosController.criar(
      requisicao({ usuarioId: ana, body: { numero: '0007654-32.2025.5.15.0001', cliente: 'X', cliente_id: daBia } }),
      outra as never,
    );
    assert.equal(outra.statusCode, 400);
    assert.equal(outra.corpo.erro, 'Cliente não encontrado.');
  });
});
