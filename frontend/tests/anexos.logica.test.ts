import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dataDoAnexo, problemaNoArquivo, tamanhoLegivel, tipoDoArquivo } from '../src/app/core/logica/anexos.logica';
import { impressaoProcesso } from '../src/app/core/logica/impressao.logica';
import { Anexo, ProcessoDetalhe } from '../src/app/core/models';

/** [F1] Anexos no Google Drive — pedido de Thamara Santana (cliente) (04/11/2026). */
describe('[F1] anexos.logica', () => {
  it('tamanhoLegivel()', () => {
    assert.equal(tamanhoLegivel(500), '500 B');
    assert.equal(tamanhoLegivel(870_000), '850 KB');
    assert.equal(tamanhoLegivel(2.4 * 1024 * 1024), '2,4 MB');
    assert.equal(tamanhoLegivel(null), '');
  });

  it('problemaNoArquivo(): vazio e acima de 50 MB', () => {
    assert.equal(problemaNoArquivo({ name: 'a.pdf', size: 1000 }), null);
    assert.match(problemaNoArquivo({ name: 'a.pdf', size: 0 })!, /vazio/);
    assert.match(problemaNoArquivo({ name: 'video.mp4', size: 51 * 1024 * 1024 })!, /50 MB/);
  });

  it('tipoDoArquivo() e dataDoAnexo()', () => {
    assert.equal(tipoDoArquivo({ nome: 'procuracao.pdf', tipo_mime: 'application/pdf' }), 'PDF');
    assert.equal(tipoDoArquivo({ nome: 'foto.jpg', tipo_mime: 'image/jpeg' }), 'Imagem');
    assert.equal(tipoDoArquivo({ nome: 'peticao.docx', tipo_mime: null }), 'Word');
    assert.equal(tipoDoArquivo({ nome: 'custas.xlsx', tipo_mime: '' }), 'Planilha');
    assert.equal(tipoDoArquivo({ nome: 'leia-me', tipo_mime: null }), 'LEIA-');
    assert.equal(dataDoAnexo('2026-11-05T14:00:00.000Z'), '05/11/2026');
  });

  it('a ficha impressa do processo lista os documentos anexados (só quando houver)', () => {
    const d = {
      processo: { id: 1, numero: '0001234-56.2026.8.26.0100', cliente: 'Maria', cliente_id: null, clientes: [], parte_contraria: null, tribunal: null, area: null, status: 'ativo', observacoes: null, criado_em: '2026-11-01' },
      compromissos: [],
    } as unknown as ProcessoDetalhe;
    const anexo: Anexo = { id: 1, dono_tipo: 'processo', dono_id: 1, nome: 'procuracao.pdf', tipo_mime: 'application/pdf', tamanho: 2048, link: null, criado_em: '2026-11-05T10:00:00Z' };
    assert.equal(impressaoProcesso(d, '2026-11-05').secoes.length, 2);
    const com = impressaoProcesso(d, '2026-11-05', [anexo]);
    const ultima = com.secoes[com.secoes.length - 1];
    assert.equal(ultima.titulo, 'Documentos anexados (Google Drive)');
    assert.deepEqual(ultima.tipo === 'tabela' ? ultima.linhas[0] : null, ['procuracao.pdf', 'PDF', '2 KB', '05/11/2026']);
  });
});
