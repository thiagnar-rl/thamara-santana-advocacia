import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ATUALIZADA_EM, POLITICA } from '../src/app/site/privacidade/politica';

/** [F9] Política de Privacidade — solicitado por Thamara Santana (cliente) (05/11/2026). */
describe('[F9] Política de Privacidade', () => {
  it('tem as seções exigidas pela LGPD e pelo Google, com âncoras únicas', () => {
    const ids = POLITICA.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const obrigatoria of ['quem-somos', 'google', 'seguranca', 'direitos']) assert.ok(ids.includes(obrigatoria), obrigatoria);
    assert.match(ATUALIZADA_EM, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('identifica a advogada responsável e o e-mail de contato', () => {
    const texto = JSON.stringify(POLITICA);
    assert.match(texto, /OAB\/SP 500\.770/);
    assert.match(texto, /thamarasantana\.adv@gmail\.com/);
  });

  it('explica o uso limitado dos dados do Google (exigência para o app do Google)', () => {
    const google = JSON.stringify(POLITICA.find((s) => s.id === 'google'));
    assert.match(google, /Google Agenda/);
    assert.match(google, /Google Drive/);
    assert.match(google, /uso limitado/);
    assert.match(google, /não são usados para publicidade/);
    assert.match(google, /myaccount\.google\.com\/permissions/);
  });
});
