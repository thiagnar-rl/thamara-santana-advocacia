import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compromissoView } from '../src/views/compromisso.view';
import { erroView } from '../src/views/erro.view';
import { processoDetalheView, processoView } from '../src/views/processo.view';
import { sessaoView, usuarioView } from '../src/views/usuario.view';
import type { Compromisso } from '../src/models/compromisso.model';
import type { Processo } from '../src/models/processo.model';

const processo: Processo = {
  id: 1,
  usuario_id: 7,
  numero: '1',
  cliente: 'Ana',
  parte_contraria: null,
  tribunal: null,
  area: null,
  status: 'ativo',
  observacoes: null,
  criado_em: '2026-10-01 10:00:00',
  atualizado_em: '2026-10-01 10:00:00',
  total_pendentes: 2,
  proximo_compromisso: null,
};

const compromisso: Compromisso = {
  id: 3,
  usuario_id: 7,
  processo_id: 1,
  tipo: 'audiencia',
  titulo: 'Conciliação',
  data: '2026-10-28',
  hora: null,
  local: null,
  descricao: null,
  prioridade: 'alta',
  status: 'pendente',
  concluido_em: null,
  criado_em: '2026-10-01 10:00:00',
  processo_numero: '1',
  processo_cliente: 'Ana',
};

describe('Views', () => {
  it('usuarioView() nunca expõe o hash da senha', async () => {
    const json = usuarioView({ id: 1, nome: 'Ana', email: 'a@b.com', senha_hash: 'xyz' } as never);
    assert.deepEqual(json, { id: 1, nome: 'Ana', email: 'a@b.com' });
  });

  it('sessaoView() devolve token e usuário', async () => {
    assert.deepEqual(sessaoView('tok', { id: 1, nome: 'Ana', email: 'a@b.com' }), {
      token: 'tok',
      usuario: { id: 1, nome: 'Ana', email: 'a@b.com' },
    });
  });

  it('processoView() e compromissoView() escondem o usuario_id', async () => {
    assert.equal('usuario_id' in processoView(processo), false);
    assert.equal('usuario_id' in compromissoView(compromisso), false);
  });

  it('processoDetalheView() junta processo e compromissos', async () => {
    const json = processoDetalheView(processo, [compromisso]);
    assert.equal(json.processo.total_pendentes, 2);
    assert.equal(json.compromissos[0].titulo, 'Conciliação');
  });

  it('erroView() usa o formato { erro }', async () => {
    assert.deepEqual(erroView('Falhou.'), { erro: 'Falhou.' });
  });
});
