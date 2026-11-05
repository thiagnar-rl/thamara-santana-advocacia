import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { autoresDoSite, PublicacaoModel } from '../src/models/publicacao.model';
import { PublicacoesController } from '../src/controllers/publicacoes.controller';

const ARTIGO = {
  titulo: 'Holding familiar: quando faz sentido?',
  resumo: 'O que considerar antes de criar uma holding.',
  conteudo: 'Antes de falar em holding, é preciso entender quem depende da renda do patrimônio.\n\nSegundo parágrafo.',
  area: 'familia',
  publicada: true,
};

/** [F7] Publicações do escritório no site — pedido de Thamara Santana (cliente) (04/11/2026). */
describe('[F7] Publicações do escritório', () => {
  let dona: number;
  let outra: number;

  beforeEach(async () => {
    await novoBanco();
    dona = await criarUsuario('thamara@teste.com');
    outra = await criarUsuario('visitante@teste.com');
  });

  afterEach(() => {
    delete process.env.SITE_AUTORES;
  });

  it('validar() confere título, texto, tamanho e área', () => {
    assert.equal(PublicacaoModel.validar({ ...ARTIGO, titulo: 'Oi' }).erro, 'Escreva um título com pelo menos 5 letras.');
    assert.match(PublicacaoModel.validar({ ...ARTIGO, conteudo: 'curto' }).erro!, /pelo menos 20/);
    assert.equal(PublicacaoModel.validar({ ...ARTIGO, area: 'astrologia' }).erro, 'Área de atuação inválida.');
    const ok = PublicacaoModel.validar({ ...ARTIGO, conteudo: '  Texto\r\ncom quebra de linha suficiente  ' });
    assert.equal(ok.dados!.conteudo, 'Texto\ncom quebra de linha suficiente');
  });

  it('autoresDoSite(): sem configuração é a conta mais antiga; com SITE_AUTORES são os e-mails informados', async () => {
    assert.deepEqual(await autoresDoSite(), [dona]);
    process.env.SITE_AUTORES = ' VISITANTE@teste.com ';
    assert.deepEqual(await autoresDoSite(), [outra]);
  });

  it('conta não autorizada pode escrever, mas o texto não aparece no site', async () => {
    const id = await PublicacaoModel.criar(outra, ARTIGO);
    assert.equal(await PublicacaoModel.buscarNoSite(id), undefined);
    const res = resposta();
    await PublicacoesController.listar(requisicao({ usuarioId: outra }), res as never);
    assert.equal(res.corpo.aparece_no_site, false);
    assert.equal(res.corpo.publicacoes.length, 1);
  });

  it('CRUD pelo controller: 201, 400, 200, 404 de outra conta e 204', async () => {
    const criar = resposta();
    await PublicacoesController.criar(requisicao({ usuarioId: dona, body: ARTIGO }), criar as never);
    assert.equal(criar.statusCode, 201);
    assert.equal(criar.corpo.publicada, true);
    assert.ok(criar.corpo.publicado_em);
    const id = criar.corpo.id;

    const invalido = resposta();
    await PublicacoesController.criar(requisicao({ usuarioId: dona, body: { titulo: '' } }), invalido as never);
    assert.equal(invalido.statusCode, 400);

    const atualizar = resposta();
    await PublicacoesController.atualizar(
      requisicao({ usuarioId: dona, params: { id: String(id) }, body: { ...ARTIGO, titulo: 'Holding familiar: guia rápido' } }),
      atualizar as never,
    );
    assert.equal(atualizar.corpo.titulo, 'Holding familiar: guia rápido');
    assert.equal(atualizar.corpo.publicado_em, criar.corpo.publicado_em); // a data da 1ª publicação não muda

    const deOutra = resposta();
    await PublicacoesController.obter(requisicao({ usuarioId: outra, params: { id: String(id) } }), deOutra as never);
    assert.equal(deOutra.statusCode, 404);

    const excluir = resposta();
    await PublicacoesController.excluir(requisicao({ usuarioId: dona, params: { id: String(id) } }), excluir as never);
    assert.equal(excluir.statusCode, 204);
    assert.equal(await PublicacaoModel.buscarNoSite(id), undefined);
  });

  it('despublicar tira do site; publicar de novo mantém a data original', async () => {
    const quando = new Date('2026-11-01T10:00:00Z');
    const id = await PublicacaoModel.criar(dona, ARTIGO, quando);
    await PublicacaoModel.atualizar(dona, id, { ...ARTIGO, publicada: false });
    assert.equal(await PublicacaoModel.buscarNoSite(id), undefined);
    await PublicacaoModel.atualizar(dona, id, { ...ARTIGO, publicada: true });
    assert.equal((await PublicacaoModel.buscarNoSite(id))!.publicado_em, quando.toISOString());
  });
});
