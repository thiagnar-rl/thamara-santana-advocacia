import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  contagem,
  dataCurta,
  dataPorExtenso,
  linkInstagram,
  linkMapa,
  linkMapaIncorporado,
  linkWhatsApp,
  listarComE,
  paragrafos,
  tempoDeLeitura,
  tempoRelativo,
  validarPublicacao,
} from '../src/app/core/logica/site.logica';
import { AREAS_THAMARA, AREAS_EQUIPE, CONTATO, ESCRITORIO } from '../src/app/site/conteudo';

/** [F7] Site institucional — pedido de Thamara Santana (cliente) (04/11/2026). */
describe('[F7] site.logica', () => {
  it('links de WhatsApp, Instagram e Google Maps', () => {
    assert.equal(linkWhatsApp('+55 (13) 99183-5059'), 'https://wa.me/5513991835059');
    assert.equal(linkWhatsApp('5513991835059', 'Olá, tudo bem?'), 'https://wa.me/5513991835059?text=Ol%C3%A1%2C%20tudo%20bem%3F');
    assert.equal(linkInstagram('@thamarasantana.adv'), 'https://www.instagram.com/thamarasantana.adv/');
    assert.match(linkMapa('Rua A, 1 - Guarujá'), /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Rua%20A%2C%201%20-%20Guaruj%C3%A1$/);
    assert.match(linkMapaIncorporado('Rua A'), /output=embed$/);
  });

  it('listarComE() junta com vírgulas e "e"', () => {
    assert.equal(listarComE(['Santos', 'São Vicente', 'Praia Grande']), 'Santos, São Vicente e Praia Grande');
    assert.equal(listarComE(['Guarujá']), 'Guarujá');
  });

  it('paragrafos() separa por linha em branco e junta quebras simples', () => {
    assert.deepEqual(paragrafos('Primeiro\ncontinua\r\n\r\nSegundo\n\n\n  Terceiro  '), ['Primeiro continua', 'Segundo', 'Terceiro']);
    assert.deepEqual(paragrafos(null), []);
  });

  it('datas: tempoRelativo, dataCurta e dataPorExtenso (horário de Brasília)', () => {
    const agora = new Date('2026-11-04T15:00:00Z');
    assert.equal(tempoRelativo('2026-11-04T14:30:00Z', agora), 'agora há pouco');
    assert.equal(tempoRelativo('2026-11-04T12:00:00Z', agora), 'há 3 horas');
    assert.equal(tempoRelativo('2026-11-03T12:00:00Z', agora), 'ontem');
    assert.equal(tempoRelativo('2026-10-31T12:00:00Z', agora), 'há 4 dias');
    assert.equal(tempoRelativo('2026-10-01T12:00:00Z', agora), '01/10/2026');
    assert.equal(tempoRelativo('inválida', agora), '');
    assert.equal(dataCurta('2026-11-05T01:00:00Z'), '04/11/2026'); // 22h em Brasília
    assert.equal(dataPorExtenso('2026-11-04T15:00:00Z'), '4 de novembro de 2026');
  });

  it('tempoDeLeitura(), contagem() e validarPublicacao()', () => {
    assert.equal(tempoDeLeitura('palavra '.repeat(450)), '2 min de leitura');
    assert.equal(tempoDeLeitura(''), '1 min de leitura');
    assert.deepEqual(contagem('a'.repeat(301), 300), { texto: '301 / 300', excedeu: true });
    assert.equal(validarPublicacao({ titulo: 'Oi', resumo: null, conteudo: 'x'.repeat(30) }), 'Escreva um título com pelo menos 5 letras.');
    assert.match(validarPublicacao({ titulo: 'Título ok', resumo: null, conteudo: 'curto' })!, /pelo menos 20/);
    assert.equal(validarPublicacao({ titulo: 'Título ok', resumo: 'r', conteudo: 'x'.repeat(30) }), null);
  });

  it('conteúdo: dados de contato e áreas conforme enviados', () => {
    assert.equal(ESCRITORIO.oab, 'OAB/SP 500.770');
    assert.equal(CONTATO.whatsapp, '5513991835059');
    assert.equal(CONTATO.instagram, 'thamarasantana.adv');
    // [C5] Áreas da Dra. Thamara e da equipe — atualizadas a pedido da cliente Thamara Santana (05/11/2026)
    assert.deepEqual(AREAS_THAMARA.map((a) => a.nome), ['Família e Sucessões', 'Cível', 'Trabalhista']);
    assert.ok(AREAS_THAMARA[0].itens!.includes('Divórcio consensual e litigioso'));
    assert.ok(AREAS_THAMARA[1].itens!.includes('Usucapião'));
    assert.equal(AREAS_THAMARA[2].itens!.length, 2); // empregado (reclamante) e empregador (reclamado)
    assert.deepEqual(AREAS_EQUIPE.map((a) => a.chave), ['previdenciario', 'criminal']);
  });
});

/** [F10] Perguntas frequentes — solicitado por Thamara Santana (cliente) (05/11/2026). */
describe('[F10] Perguntas frequentes', () => {
  it('tem perguntas de todas as áreas, sem repetir, todas com resposta e área conhecida', async () => {
    const { PERGUNTAS, AREAS_PERGUNTAS } = await import('../src/app/site/conteudo');
    assert.equal(PERGUNTAS.length, 16);
    for (const p of PERGUNTAS) assert.ok(AREAS_PERGUNTAS.includes(p.area), p.area);
    for (const a of AREAS_PERGUNTAS) assert.ok(PERGUNTAS.some((p) => p.area === a), a);
    assert.equal(new Set(PERGUNTAS.map((p) => p.pergunta)).size, PERGUNTAS.length);
    for (const p of PERGUNTAS) {
      assert.ok(p.pergunta.endsWith('?'), p.pergunta);
      assert.ok(p.resposta.length > 0 && p.area);
    }
  });

  it('cobre divórcio, pensão, inventário, usucapião e trabalhista, sem prometer resultado', async () => {
    const { PERGUNTAS } = await import('../src/app/site/conteudo');
    const texto = JSON.stringify(PERGUNTAS).toLowerCase();
    for (const tema of ['divórcio', 'pensão', 'inventário', 'usucapião', 'justa causa', 'hora extra', 'audiência de custódia', 'maria da penha', 'não persecução']) assert.ok(texto.includes(tema), tema);
    assert.doesNotMatch(texto, /garant(o|imos) (o )?resultado|100%|sucesso garantido/);
  });
});

/** [F11] Páginas por área, WhatsApp por assunto e sitemap — solicitado por Thamara Santana (cliente) (05/11/2026). */
describe('[F11] Páginas por área e WhatsApp por assunto', () => {
  it('cada área tem endereço próprio, sem repetir, e aparece no sitemap', async () => {
    const { TODAS_AS_AREAS } = await import('../src/app/site/conteudo');
    const { readFileSync } = await import('node:fs');
    const slugs = TODAS_AS_AREAS.map((a) => a.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const s of slugs) assert.match(s, /^[a-z-]+$/);
    const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
    for (const s of slugs) assert.ok(sitemap.includes(`/atuacao/${s}</loc>`), s);
    assert.ok(sitemap.includes('/privacidade</loc>'));
    assert.doesNotMatch(sitemap, /\/sistema/); // a área restrita não vai para o Google
  });

  it('áreas das perguntas de cada página existem na lista de perguntas', async () => {
    const { TODAS_AS_AREAS, AREAS_PERGUNTAS } = await import('../src/app/site/conteudo');
    for (const a of TODAS_AS_AREAS) {
      assert.ok(a.apresentacao.length > 0, a.nome);
      for (const p of a.areasPerguntas) assert.ok(AREAS_PERGUNTAS.includes(p), p);
    }
  });

  it('areaPorSlug() e as mensagens prontas do WhatsApp', async () => {
    const { areaPorSlug, mensagemWhatsAppArea, mensagemWhatsAppPergunta, linkWhatsApp } = await import('../src/app/core/logica/site.logica');
    const areas = [{ slug: 'civel', nome: 'Cível' }];
    assert.equal(areaPorSlug(areas, 'CIVEL')?.nome, 'Cível');
    assert.equal(areaPorSlug(areas, 'inexistente'), undefined);
    assert.equal(mensagemWhatsAppArea('Trabalhista'), 'Olá, Dra. Thamara! Vim pelo site e gostaria de falar sobre Trabalhista.');
    assert.match(mensagemWhatsAppPergunta('Posso pedir revisão?'), /tenho uma dúvida: Posso pedir revisão\?$/);
    assert.match(linkWhatsApp('5513991835059', mensagemWhatsAppArea('Cível')), /^https:\/\/wa\.me\/5513991835059\?text=Ol%C3%A1/);
  });
});
