import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client/web';

/**
 * CONFIGURAÇÃO DO BANCO DE DADOS
 *
 * - No computador (desenvolvimento): arquivo SQLite local em backend/data/agenda.db
 *   (módulo nativo node:sqlite).
 * - Na nuvem (Vercel): banco Turso (libSQL, compatível com SQLite), usado quando
 *   as variáveis TURSO_DATABASE_URL e TURSO_AUTH_TOKEN estão definidas.
 *
 * Os Models usam apenas as funções todos(), um() e executar() — não sabem
 * qual dos dois bancos está por trás.
 */

/** Pasta onde fica o arquivo do banco local (backend/data). */
export const PASTA_DADOS = path.resolve(__dirname, '..', '..', 'data');

/** Script DDL — projeto físico do banco. */
export const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT    NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 120),
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (email LIKE '%_@_%._%'),
    senha_hash  TEXT    NOT NULL,
    criado_em   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS processos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    numero           TEXT    NOT NULL CHECK (length(trim(numero)) BETWEEN 1 AND 40),
    cliente          TEXT    NOT NULL CHECK (length(trim(cliente)) BETWEEN 1 AND 150),
    parte_contraria  TEXT,
    tribunal         TEXT,
    area             TEXT,
    status           TEXT    NOT NULL DEFAULT 'ativo'
                     CHECK (status IN ('ativo', 'suspenso', 'arquivado', 'encerrado')),
    observacoes      TEXT,
    criado_em        TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    atualizado_em    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS compromissos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    processo_id   INTEGER REFERENCES processos(id) ON DELETE CASCADE,
    tipo          TEXT    NOT NULL
                  CHECK (tipo IN ('audiencia', 'recurso', 'manifestacao', 'despacho')),
    titulo        TEXT    NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 150),
    data          TEXT    NOT NULL                                  -- AAAA-MM-DD
                  CHECK (data GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
    hora          TEXT                                              -- HH:MM
                  CHECK (hora IS NULL OR hora GLOB '[0-2][0-9]:[0-5][0-9]'),
    local         TEXT,
    descricao     TEXT,
    prioridade    TEXT    NOT NULL DEFAULT 'media'
                  CHECK (prioridade IN ('baixa', 'media', 'alta')),
    status        TEXT    NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'concluido')),
    concluido_em  TEXT,                                             -- quando foi concluído
    criado_em     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  -- Um mesmo usuário não pode cadastrar o mesmo número de processo duas vezes
  CREATE UNIQUE INDEX IF NOT EXISTS uq_processos_usuario_numero ON processos (usuario_id, numero);

  CREATE INDEX IF NOT EXISTS idx_processos_usuario_status   ON processos (usuario_id, status);
  CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_data  ON compromissos (usuario_id, data);
  CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_status ON compromissos (usuario_id, status, data);
  CREATE INDEX IF NOT EXISTS idx_compromissos_processo      ON compromissos (processo_id);
`;

export type Parametro = string | number | null;

/** Contrato comum aos dois bancos (local e Turso). */
export interface Banco {
  todos<T>(sql: string, params: Parametro[]): Promise<T[]>;
  executar(sql: string, params: Parametro[]): Promise<{ alteracoes: number; id: number }>;
  script(sql: string): Promise<void>;
}

/* ---------- Banco local: arquivo SQLite (node:sqlite) ---------- */

/** Abre um banco SQLite local (arquivo ou ':memory:') já com as tabelas criadas. */
export async function criarBancoLocal(arquivo: string): Promise<Banco> {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(arquivo);
  db.exec('PRAGMA foreign_keys = ON;');
  if (arquivo !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');

  const banco: Banco = {
    async todos<T>(sql: string, params: Parametro[]) {
      return db.prepare(sql).all(...params) as unknown as T[];
    },
    async executar(sql: string, params: Parametro[]) {
      const r = db.prepare(sql).run(...params);
      return { alteracoes: Number(r.changes), id: Number(r.lastInsertRowid) };
    },
    async script(sql: string) {
      db.exec(sql);
    },
  };
  await prepararEsquema(banco);
  return banco;
}

/* ---------- Banco na nuvem: Turso (libSQL) ---------- */

/**
 * Conecta ao Turso. O parâmetro "fabrica" existe só para os testes
 * poderem simular o cliente sem acessar a internet.
 */
export async function criarBancoTurso(
  url: string,
  authToken?: string,
  fabrica: typeof createClient = createClient,
): Promise<Banco> {
  const cliente = fabrica({ url, authToken });

  const banco: Banco = {
    async todos<T>(sql: string, params: Parametro[]) {
      const r = await cliente.execute({ sql, args: params });
      return r.rows as unknown as T[];
    },
    async executar(sql: string, params: Parametro[]) {
      const r = await cliente.execute({ sql, args: params });
      return { alteracoes: r.rowsAffected, id: Number(r.lastInsertRowid ?? 0) };
    },
    async script(sql: string) {
      await cliente.executeMultiple(sql);
    },
  };
  await prepararEsquema(banco);
  return banco;
}

/** Cria as tabelas (se não existirem) e aplica migrações simples. */
async function prepararEsquema(banco: Banco): Promise<void> {
  await banco.script(ESQUEMA);
  // Bancos da versão 1.0 não tinham a coluna concluido_em.
  const colunas = await banco.todos<{ name: string }>('PRAGMA table_info(compromissos)', []);
  if (!colunas.some((c) => c.name === 'concluido_em')) {
    await banco.script('ALTER TABLE compromissos ADD COLUMN concluido_em TEXT');
  }
}

/* ---------- Conexão atual ---------- */

let conexao: Promise<Banco> | null = null;

/** Abre a conexão na primeira vez que for usada (Turso se configurado; senão, arquivo local). */
export function obterBanco(): Promise<Banco> {
  if (!conexao) {
    const urlTurso = process.env.TURSO_DATABASE_URL;
    if (urlTurso) {
      conexao = criarBancoTurso(urlTurso, process.env.TURSO_AUTH_TOKEN);
    } else {
      if (process.env.VERCEL) {
        throw new Error('Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis de ambiente da Vercel.');
      }
      fs.mkdirSync(PASTA_DADOS, { recursive: true });
      conexao = criarBancoLocal(process.env.DB_ARQUIVO || path.join(PASTA_DADOS, 'agenda.db'));
    }
    conexao.catch(() => (conexao = null)); // permite tentar de novo se falhar
  }
  return conexao;
}

/** Troca a conexão (usado nos testes com banco em memória). */
export function definirBanco(banco: Banco): void {
  conexao = Promise.resolve(banco);
}

/** Executa um SELECT e devolve todas as linhas. */
export async function todos<T>(sql: string, ...params: Parametro[]): Promise<T[]> {
  return (await obterBanco()).todos<T>(sql, params);
}

/** Executa um SELECT e devolve só a primeira linha (ou undefined). */
export async function um<T>(sql: string, ...params: Parametro[]): Promise<T | undefined> {
  return (await todos<T>(sql, ...params))[0];
}

/** Executa INSERT / UPDATE / DELETE. */
export async function executar(sql: string, ...params: Parametro[]) {
  return (await obterBanco()).executar(sql, params);
}
