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
