import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decodificarBytes, lerData, lerFeed, limparTexto, linkSeguro, resumir } from '../src/utils/rss';

/** [F7] Leitura dos feeds de notícias — site institucional (pedido de Thiago Rinaldi Luna, 04/11/2026). */
describe('[F7] Leitura de feeds RSS/Atom', () => {
  const RSS = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel><title>STJ</title>
      <item>
        <title><![CDATA[Herdeiro pode pedir prestação de contas do inventário]]></title>
        <link>https://www.stj.jus.br/noticia-1</link>
        <description>&lt;p&gt;A &lt;b&gt;Terceira Turma&lt;/b&gt; decidiu&amp;nbsp;que…&lt;/p&gt;</description>
        <pubDate>Tue, 03 Nov 2026 14:30:00 -0300</pubDate>
      </item>
      <item><title>Sem link</title></item>
      <item><title>Link perigoso</title><link>javascript:alert(1)</link></item>
    </channel></rss>`;

  it('lerFeed() lê título, link, resumo sem HTML e data em UTC; ignora itens sem link válido', () => {
    const itens = lerFeed(RSS);
    assert.equal(itens.length, 1);
    assert.equal(itens[0].titulo, 'Herdeiro pode pedir prestação de contas do inventário');
    assert.equal(itens[0].link, 'https://www.stj.jus.br/noticia-1');
    assert.equal(itens[0].resumo, 'A Terceira Turma decidiu que…');
    assert.equal(itens[0].data, '2026-11-03T17:30:00.000Z');
  });

  it('lerFeed() no formato do Google Notícias: separa o site de origem e descarta resumo repetido', () => {
    const google = `<rss><channel><item>
      <title>Herança digital entra na pauta do STJ - IBDFAM</title>
      <link>https://news.google.com/rss/articles/abc?oc=5</link>
      <pubDate>Wed, 04 Nov 2026 15:48:04 GMT</pubDate>
      <description>&lt;a href="https://news.google.com/rss/articles/abc"&gt;Herança digital entra na pauta do STJ&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font color="#6f6f6f"&gt;IBDFAM&lt;/font&gt;</description>
      <source url="https://ibdfam.org.br">IBDFAM</source>
    </item></channel></rss>`;
    const [item] = lerFeed(google);
    assert.equal(item.titulo, 'Herança digital entra na pauta do STJ');
    assert.equal(item.fonte, 'IBDFAM');
    assert.equal(item.resumo, null);
  });

  it('lerFeed() também entende o formato Atom', () => {
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
      <entry><title type="html">Nova regra do INSS</title>
        <link rel="alternate" href="https://exemplo.gov.br/inss"/>
        <summary>Resumo &amp; detalhes</summary><updated>2026-11-04T09:00:00Z</updated></entry></feed>`;
    const [item] = lerFeed(atom);
    assert.equal(item.link, 'https://exemplo.gov.br/inss');
    assert.equal(item.resumo, 'Resumo & detalhes');
    assert.equal(item.data, '2026-11-04T09:00:00.000Z');
  });

  it('funções de apoio: limparTexto, resumir, linkSeguro, lerData e decodificarBytes', () => {
    assert.equal(limparTexto('<p>Ol&aacute;?</p>'), 'Ol&aacute;?'); // entidade desconhecida fica como está
    assert.equal(limparTexto('A&#233; &#xE9;'), 'Aé é');
    assert.equal(resumir('um dois três quatro cinco', 10), 'um dois…');
    assert.equal(linkSeguro('ftp://x.com/a'), null);
    assert.equal(linkSeguro('https://a.com/?x=1&amp;y=2'), 'https://a.com/?x=1&y=2');
    assert.equal(lerData('qualquer coisa'), null);
    assert.equal(lerData('Wed, 04 Nov 2026 10:00:00 BRT'), '2026-11-04T13:00:00.000Z');
    // Formato usado pelo STJ (em português, no horário de Brasília)
    assert.equal(lerData('Qua, nov 4 2026 17:11:00'), '2026-11-04T20:11:00.000Z');
    assert.equal(lerData('Sáb, fev 28 2026 09:05:00'), '2026-02-28T12:05:00.000Z');
    const latin1 = new Uint8Array([0x3c, 0x3f, 0x78, 0x6d, 0x6c, 0x20, 0x65, 0x6e, 0x63, 0x6f, 0x64, 0x69, 0x6e, 0x67, 0x3d, 0x22, 0x49, 0x53, 0x4f, 0x2d, 0x38, 0x38, 0x35, 0x39, 0x2d, 0x31, 0x22, 0x3f, 0x3e, 0xe9]);
    assert.ok(decodificarBytes(latin1.buffer, null).endsWith('é'));
  });
});
