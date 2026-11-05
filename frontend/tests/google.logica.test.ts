import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { avisoDaConexao, resumoSincronizacao, textoSituacaoGoogle } from '../src/app/core/logica/google.logica';
import { distribuicaoPorTipo } from '../src/app/core/logica/painel.logica';

/** [F8] Google Agenda — pedido de Thiago Rinaldi Luna (04/11/2026). */
describe('[F8] google.logica', () => {
  it('textoSituacaoGoogle(): desconectado, conectado e com erro', () => {
    assert.equal(textoSituacaoGoogle(null).estado, 'desconectado');
    const ok = textoSituacaoGoogle({ configurado: true, conectado: true, email: 'thamara@gmail.com', ultima_sincronizacao: null, erro: null });
    assert.deepEqual(ok, { rotulo: 'Google Agenda', detalhe: 'thamara@gmail.com', estado: 'conectado' });
    assert.equal(textoSituacaoGoogle({ configurado: true, conectado: true, email: 'x', ultima_sincronizacao: null, erro: 'Reconecte' }).estado, 'erro');
  });

  it('resumoSincronizacao(): só avisa quando algo mudou', () => {
    assert.equal(resumoSincronizacao({ conectado: true, feita: true, novos: 2, atualizados: 1, removidos: 0 }), 'Google Agenda: 2 novos e 1 alterado.');
    assert.equal(resumoSincronizacao({ conectado: true, feita: true, novos: 1, atualizados: 0, removidos: 3 }), 'Google Agenda: 1 novo e 3 excluídos.');
    assert.equal(resumoSincronizacao({ conectado: true, feita: true, novos: 0, atualizados: 0, removidos: 0 }), null);
    assert.equal(resumoSincronizacao({ conectado: true, feita: false, novos: 0, atualizados: 0, removidos: 0 }), null);
  });

  it('avisoDaConexao() na volta do login do Google', () => {
    assert.equal(avisoDaConexao('conectado')?.tipo, 'sucesso');
    assert.equal(avisoDaConexao('erro')?.tipo, 'erro');
    assert.equal(avisoDaConexao(null), null);
  });

  it('o gráfico do Início só mostra "Outro" quando existir algum', () => {
    assert.equal(distribuicaoPorTipo({ audiencia: 1, recurso: 0, manifestacao: 0, despacho: 0, outro: 0 }).length, 4);
    const comOutro = distribuicaoPorTipo({ audiencia: 1, recurso: 0, manifestacao: 0, despacho: 0, outro: 2 });
    assert.deepEqual(comOutro.map((b) => b.valor), ['audiencia', 'recurso', 'manifestacao', 'despacho', 'outro']);
  });
});
