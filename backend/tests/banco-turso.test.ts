import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import './helpers';
import { criarBancoTurso, definirBanco } from '../src/config/database';
import { CompromissoModel } from '../src/models/compromisso.model';
import { ProcessoModel } from '../src/models/processo.model';
import { UsuarioModel } from '../src/models/usuario.model';

/**
 * Simula o cliente do Turso (@libsql/client) usando um SQLite em memória,
 * devolvendo os resultados no mesmo formato da biblioteca real
 * (rows, rowsAffected e lastInsertRowid como bigint).
 * As chaves estrangeiras ficam DESLIGADAS, para garantir que o sistema
 * não dependa do ON DELETE CASCADE na nuvem.
 */
function clienteFalso() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = OFF;');
  return {
    async execute({ sql, args }: { sql: string; args: (string | number | null)[] }) {
      const stmt = db.prepare(sql);
      if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
        return { rows: stmt.all(...args), rowsAffected: 0, lastInsertRowid: undefined };
      }
      const r = stmt.run(...args);
      return { rows: [], rowsAffected: Number(r.changes), lastInsertRowid: BigInt(r.lastInsertRowid) };
    },
    async executeMultiple(sql: string) {
      db.exec(sql);
    },
  };
}

describe('Banco Turso (nuvem) — driver libSQL', () => {
  it('cria as tabelas e executa o fluxo completo do sistema', async () => {
    const banco = await criarBancoTurso('libsql://teste.turso.io', 'token', (() => clienteFalso()) as never);
    definirBanco(banco);

    const ana = await UsuarioModel.criar({ nome: 'Ana', email: 'ana@x.com', senha: 'segredo1' });
    assert.equal(typeof ana, 'number');
    assert.ok((await UsuarioModel.autenticar('ana@x.com', 'segredo1'))?.id === ana);

    const { dados } = ProcessoModel.validar({ numero: '0001234-56.2026.8.26.0100', cliente: 'Carlos' });
    const p = await ProcessoModel.criar(ana, dados);
    const c = await CompromissoModel.criar(ana, {
      processo_id: p, tipo: 'audiencia', titulo: 'Instrução', data: '2026-11-05',
      hora: '10:00', local: null, descricao: null, prioridade: 'alta', status: 'pendente',
    });

    assert.equal((await ProcessoModel.buscar(ana, p, '2026-10-28'))!.total_pendentes, 1);
    assert.equal(await CompromissoModel.alterarStatus(ana, c, 'concluido'), true);

    // Exclusão do processo apaga os compromissos mesmo sem chave estrangeira ativa (RN06)
    assert.equal(await ProcessoModel.excluir(ana, p), true);
    assert.equal((await CompromissoModel.listar(ana, {}, '2026-10-28')).length, 0);
  });
});
