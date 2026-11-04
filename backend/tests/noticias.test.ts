import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { FONTES_NOTICIAS } from '../src/config/site';
import { Buscador, classificarArea, NoticiaModel, precisaColetar } from '../src/models/noticia.model';
import { PublicacaoModel } from '../src/models/publicacao.model';
import { SiteController } from '../src/controllers/site.controller';

/** Feed falso: uma notícia de família, uma de consumidor e uma de outro assunto. */
function feed(prefixo: string) {
  return `<rss><channel>
    <item><title>Divórcio e partilha de bens: STJ fixa tese</title><link>https://ex.com/${prefixo}/1</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate></item>
    <item><title>Plano de saúde deve cobrir tratamento</title><link>https://ex.com/${prefixo}/2</link><pubDate>Tue, 03 Nov 2026 10:00:00 GMT</pubDate></item>
    <item><title>Tribunal inaugura nova sede administrativa</title><link>https://ex.com/${prefixo}/3</link><pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate></item>
  </channel></rss>`;
}

/** Simula a internet: a primeira fonte falha, as outras respondem com o feed acima. */
function buscadorFalso(chamadas: string[]): Buscador {
  return async (url) => {
    chamadas.push(url);
    if (url === FONTES_NOTICIAS[0].url) return { ok: false, status: 503, headers: { get: () => null }, arrayBuffer: async () => new ArrayBuffer(0) };
    const bytes = new TextEncoder().encode(feed(String(chamadas.length)));
    return { ok: true, status: 200, headers: { get: () => 'application/rss+xml; charset=utf-8' }, arrayBuffer: async () => bytes.buffer as ArrayBuffer };
  };
}

/** [F7] Notícias automáticas do site — pedido de Thiago Rinaldi Luna (04/11/2026). */
describe('[F7] Notícias jurídicas automáticas', () => {
  beforeEach(async () => {
    await novoBanco();
  });

  it('classificarArea() identifica a área pelo assunto, sem confundir palavras parecidas', () => {
    assert.equal(classificarArea('Inventário extrajudicial com herdeiros menores'), 'familia');
    assert.equal(classificarArea('Aposentadoria especial: INSS deve rever benefício'), 'previdenciario');
    assert.equal(classificarArea('Justa causa anulada pelo TST'), 'trabalhista');
    assert.equal(classificarArea('Companhia aérea indenizará passageiro por voo cancelado'), 'consumidor');
    assert.equal(classificarArea('STF concede habeas corpus a réu primário'), 'criminal');
    assert.equal(classificarArea('Empresa amplia sucesso de vendas'), null); // "empresa" não é "presa"; "sucesso" não é "sucessão"
  });

  it('precisaColetar() respeita o intervalo de 3 horas', () => {
    const agora = new Date('2026-11-04T12:00:00Z');
    assert.equal(precisaColetar(null, agora), true);
    assert.equal(precisaColetar('2026-11-04T10:00:00Z', agora), false);
    assert.equal(precisaColetar('2026-11-04T08:59:00Z', agora), true);
  });

  it('coletar() guarda as notícias, ignora links repetidos e registra a fonte que falhou', async () => {
    const chamadas: string[] = [];
    const situacao = await NoticiaModel.coletar(buscadorFalso(chamadas), new Date('2026-11-04T12:00:00Z'));
    assert.equal(chamadas.length, FONTES_NOTICIAS.length);
    assert.equal(situacao[0].ok, false);
    assert.match(situacao[0].erro!, /503/);
    assert.ok(situacao.slice(1).every((s) => s.ok && s.itens === 3));

    // Só aparecem no site as que combinam com alguma área (2 por fonte que respondeu)
    const lista = await NoticiaModel.listar();
    assert.equal(lista.length, (FONTES_NOTICIAS.length - 1) * 2);
    assert.equal(lista[0].area, 'consumidor'); // a mais recente primeiro
    assert.equal((await NoticiaModel.listar({ area: 'familia' })).length, FONTES_NOTICIAS.length - 1);

    // Salvar os mesmos links de novo não duplica
    const novos = await NoticiaModel.salvarItens('X', [{ titulo: 'Divórcio', link: 'https://ex.com/2/1', resumo: null, data: null }], new Date());
    assert.equal(novos, 0);
  });

  it('atualizarSePreciso() só busca de novo depois do intervalo', async () => {
    const chamadas: string[] = [];
    await NoticiaModel.atualizarSePreciso(buscadorFalso(chamadas), new Date('2026-11-04T12:00:00Z'));
    await NoticiaModel.atualizarSePreciso(buscadorFalso(chamadas), new Date('2026-11-04T13:00:00Z'));
    assert.equal(chamadas.length, FONTES_NOTICIAS.length); // a segunda chamada não buscou
    await NoticiaModel.atualizarSePreciso(buscadorFalso(chamadas), new Date('2026-11-04T15:30:00Z'));
    assert.equal(chamadas.length, FONTES_NOTICIAS.length * 2);
  });

  it('SiteController: notícias e publicações públicas, sem expor usuario_id; rascunho não aparece', async () => {
    await NoticiaModel.coletar(buscadorFalso([]), new Date());
    const dona = await criarUsuario('thamara@teste.com');
    const publicada = await PublicacaoModel.criar(dona, {
      titulo: 'Planejamento sucessório em família',
      resumo: null,
      conteudo: 'Conversar sobre herança enquanto todos podem dizer o que desejam evita conflitos.',
      area: 'familia',
      publicada: true,
    });
    const rascunho = await PublicacaoModel.criar(dona, {
      titulo: 'Rascunho ainda não revisado',
      resumo: null,
      conteudo: 'Texto em construção, ainda não deve aparecer no site.',
      area: null,
      publicada: false,
    });

    const res = resposta();
    await SiteController.noticias(requisicao({ query: { area: 'familia' } }), res as never);
    assert.equal(res.corpo.publicacoes.length, 1);
    assert.equal(res.corpo.publicacoes[0].id, publicada);
    assert.equal('usuario_id' in res.corpo.publicacoes[0], false);
    assert.match(res.corpo.publicacoes[0].resumo, /^Conversar sobre herança/);
    assert.ok(res.corpo.noticias.every((n: { area: string }) => n.area === 'familia'));
    assert.equal(res.corpo.areas.length, 5);

    const artigo = resposta();
    await SiteController.publicacao(requisicao({ params: { id: String(publicada) } }), artigo as never);
    assert.equal(artigo.corpo.area_nome, 'Família, Patrimônio e Sucessões');

    const naoPublicado = resposta();
    await SiteController.publicacao(requisicao({ params: { id: String(rascunho) } }), naoPublicado as never);
    assert.equal(naoPublicado.statusCode, 404);

    const fontes = resposta();
    await SiteController.fontes(requisicao(), fontes as never);
    assert.equal(fontes.corpo.fontes.length, FONTES_NOTICIAS.length);
  });
});
