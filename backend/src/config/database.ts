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

/**
 * Tabela de compromissos.
 * [F8] Tipo "outro" (eventos criados direto no Google Agenda) e colunas do vínculo com o Google.
 * Solicitado por Thiago Rinaldi Luna (04/11/2026). Fica numa função porque bancos antigos
 * precisam recriar a tabela (o SQLite não deixa alterar a regra CHECK de uma coluna).
 */
export function tabelaCompromissos(nome: string): string {
  return `CREATE TABLE IF NOT EXISTS ${nome} (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id            INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    processo_id           INTEGER REFERENCES processos(id) ON DELETE CASCADE,
    tipo                  TEXT    NOT NULL
                          CHECK (tipo IN ('audiencia', 'recurso', 'manifestacao', 'despacho', 'outro')),
    titulo                TEXT    NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 150),
    data                  TEXT    NOT NULL                          -- AAAA-MM-DD
                          CHECK (data GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
    hora                  TEXT                                      -- HH:MM
                          CHECK (hora IS NULL OR hora GLOB '[0-2][0-9]:[0-5][0-9]'),
    local                 TEXT,
    descricao             TEXT,
    prioridade            TEXT    NOT NULL DEFAULT 'media'
                          CHECK (prioridade IN ('baixa', 'media', 'alta')),
    status                TEXT    NOT NULL DEFAULT 'pendente'
                          CHECK (status IN ('pendente', 'concluido')),
    concluido_em          TEXT,                                     -- quando foi concluído
    criado_em             TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    google_event_id       TEXT,                                     -- [F8] evento correspondente no Google Agenda
    google_atualizado_em  TEXT                                      -- [F8] última alteração conhecida do evento (ISO)
  );`;
}

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

  ${tabelaCompromissos('compromissos')}

  -- [F6] Cadastro de clientes (pessoa física ou jurídica) — solicitado por Thamara Santana (30/10/2026)
  CREATE TABLE IF NOT EXISTS clientes (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id                INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo                      TEXT    NOT NULL DEFAULT 'fisica' CHECK (tipo IN ('fisica', 'juridica')),
    nome                      TEXT    NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 150), -- nome completo ou razão social
    -- Pessoa física
    nacionalidade             TEXT,
    estado_civil              TEXT,
    profissao                 TEXT,
    rg                        TEXT,
    cpf                       TEXT,                                         -- 000.000.000-00
    data_nascimento           TEXT,                                         -- AAAA-MM-DD
    -- Pessoa jurídica
    nome_fantasia             TEXT,
    cnpj                      TEXT,                                         -- 00.000.000/0000-00
    inscricao_estadual        TEXT,
    inscricao_municipal       TEXT,
    ramo_atuacao              TEXT,
    representante_nome        TEXT,
    representante_cpf         TEXT,
    representante_cargo       TEXT,
    representante_nascimento  TEXT,                                         -- AAAA-MM-DD
    -- Contato e localização
    cep                       TEXT,                                         -- 00000-000
    logradouro                TEXT,
    endereco_numero           TEXT,
    complemento               TEXT,
    bairro                    TEXT,
    cidade                    TEXT,
    uf                        TEXT,
    telefone                  TEXT,
    celular                   TEXT,
    whatsapp                  TEXT,
    email                     TEXT,
    observacoes               TEXT,
    criado_em                 TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    atualizado_em             TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  -- [F6] CPF e CNPJ não se repetem para a mesma usuária
  CREATE UNIQUE INDEX IF NOT EXISTS uq_clientes_usuario_cpf  ON clientes (usuario_id, cpf)  WHERE cpf IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS uq_clientes_usuario_cnpj ON clientes (usuario_id, cnpj) WHERE cnpj IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_clientes_usuario_nome ON clientes (usuario_id, nome);

  -- [F3] Pedidos de recuperação de senha ("Esqueci minha senha") — solicitado por Thamara Santana (30/10/2026).
  -- Guarda só o HASH do código enviado por e-mail; o código vale 1 hora e só pode ser usado uma vez.
  CREATE TABLE IF NOT EXISTS recuperacoes_senha (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash  TEXT    NOT NULL UNIQUE,              -- SHA-256 do código
    criado_em   TEXT    NOT NULL,                     -- ISO 8601 (UTC)
    expira_em   TEXT    NOT NULL,                     -- ISO 8601 (UTC)
    usado_em    TEXT                                  -- preenchido quando a senha é trocada
  );
  CREATE INDEX IF NOT EXISTS idx_recuperacoes_usuario ON recuperacoes_senha (usuario_id, criado_em);

  -- [C4] Um processo pode ter vários clientes, e um cliente vários processos.
  -- Solicitado por Thiago Rinaldi Luna (04/11/2026).
  CREATE TABLE IF NOT EXISTS processo_clientes (
    processo_id  INTEGER NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
    cliente_id   INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    ordem        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (processo_id, cliente_id)
  );
  CREATE INDEX IF NOT EXISTS idx_processo_clientes_cliente ON processo_clientes (cliente_id);

  -- [F7] Site institucional — solicitado por Thiago Rinaldi Luna (04/11/2026).
  -- Publicações (notícias e artigos) que a advogada escreve pelo sistema e aparecem no site.
  CREATE TABLE IF NOT EXISTS publicacoes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo         TEXT    NOT NULL CHECK (length(trim(titulo)) BETWEEN 5 AND 150),
    resumo         TEXT,
    conteudo       TEXT    NOT NULL,
    area           TEXT,                                -- área de atuação (opcional)
    publicada      INTEGER NOT NULL DEFAULT 0 CHECK (publicada IN (0, 1)),
    publicado_em   TEXT,                                -- ISO 8601 (UTC), na primeira publicação
    criado_em      TEXT    NOT NULL,                    -- ISO 8601 (UTC)
    atualizado_em  TEXT    NOT NULL                     -- ISO 8601 (UTC)
  );
  CREATE INDEX IF NOT EXISTS idx_publicacoes_site ON publicacoes (publicada, publicado_em);
  CREATE INDEX IF NOT EXISTS idx_publicacoes_usuario ON publicacoes (usuario_id, atualizado_em);

  -- [F7] Notícias jurídicas coletadas automaticamente das fontes (STJ, ConJur...) — guardadas em cache.
  CREATE TABLE IF NOT EXISTS noticias_externas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    fonte         TEXT    NOT NULL,                     -- sigla da fonte (ex.: STJ)
    titulo        TEXT    NOT NULL,
    link          TEXT    NOT NULL UNIQUE,
    resumo        TEXT,
    area          TEXT,                                 -- área de atuação identificada (ou NULL)
    publicado_em  TEXT    NOT NULL,                     -- ISO 8601 (UTC)
    coletado_em   TEXT    NOT NULL                      -- ISO 8601 (UTC)
  );
  CREATE INDEX IF NOT EXISTS idx_noticias_data ON noticias_externas (publicado_em);

  -- [F7] Pequenos registros do site (ex.: quando as notícias foram atualizadas pela última vez).
  CREATE TABLE IF NOT EXISTS site_metadados (
    chave  TEXT PRIMARY KEY,
    valor  TEXT
  );

  -- Um mesmo usuário não pode cadastrar o mesmo número de processo duas vezes
  CREATE UNIQUE INDEX IF NOT EXISTS uq_processos_usuario_numero ON processos (usuario_id, numero);

  CREATE INDEX IF NOT EXISTS idx_processos_usuario_status   ON processos (usuario_id, status);
  CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_data  ON compromissos (usuario_id, data);
  CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_status ON compromissos (usuario_id, status, data);
  CREATE INDEX IF NOT EXISTS idx_compromissos_processo      ON compromissos (processo_id);

  -- [F8] Conta Google conectada (Google Agenda e, no F1, Google Drive). Uma por usuária.
  -- O "refresh token" é guardado CIFRADO (AES-256-GCM); sem o JWT_SECRET ninguém consegue usá-lo.
  CREATE TABLE IF NOT EXISTS google_contas (
    usuario_id             INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    email                  TEXT    NOT NULL,
    refresh_token_cifrado  TEXT    NOT NULL,
    conectado_em           TEXT    NOT NULL,          -- ISO 8601 (UTC)
    ultima_sincronizacao   TEXT,                      -- ISO 8601 (UTC)
    ultimo_erro            TEXT
  );
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
  // [F6] Bancos da versão 1.0 não tinham o vínculo processo → cliente.
  const colunasProcesso = await banco.todos<{ name: string }>('PRAGMA table_info(processos)', []);
  if (!colunasProcesso.some((c) => c.name === 'cliente_id')) {
    await banco.script('ALTER TABLE processos ADD COLUMN cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL');
  }
  await banco.script('CREATE INDEX IF NOT EXISTS idx_processos_cliente ON processos (cliente_id)');
  // [C4] Lista completa de clientes do processo (JSON: [{"nome": "...", "cliente_id": 1}]).
  if (!colunasProcesso.some((c) => c.name === 'clientes_nomes')) {
    await banco.script('ALTER TABLE processos ADD COLUMN clientes_nomes TEXT');
  }
  await migrarClientesDosProcessos(banco);
  await migrarCompromissosParaGoogle(banco);
}

/**
 * [F8] Bancos anteriores não aceitam o tipo "outro" nem têm as colunas do Google.
 * O SQLite não permite mudar a regra CHECK, então a tabela é recriada com os mesmos dados,
 * tudo dentro de uma transação (se algo falhar, nada muda).
 */
export async function migrarCompromissosParaGoogle(banco: Banco): Promise<void> {
  const [tabela] = await banco.todos<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'compromissos'",
    [],
  );
  if (!tabela || tabela.sql.includes("'outro'")) return;
  const colunas = 'id, usuario_id, processo_id, tipo, titulo, data, hora, local, descricao, prioridade, status, concluido_em, criado_em';
  await banco.script(`
    BEGIN;
    ${tabelaCompromissos('compromissos_f8')}
    INSERT INTO compromissos_f8 (${colunas}) SELECT ${colunas} FROM compromissos;
    DROP TABLE compromissos;
    ALTER TABLE compromissos_f8 RENAME TO compromissos;
    CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_data   ON compromissos (usuario_id, data);
    CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_status ON compromissos (usuario_id, status, data);
    CREATE INDEX IF NOT EXISTS idx_compromissos_processo       ON compromissos (processo_id);
    COMMIT;
  `);
}

/**
 * [C4] Processos antigos (um cliente só) passam para o novo formato de vários clientes.
 * Só mexe nos processos que ainda não têm a lista, então pode rodar toda vez que o servidor liga.
 */
export async function migrarClientesDosProcessos(banco: Banco): Promise<void> {
  await banco.script(`
    INSERT OR IGNORE INTO processo_clientes (processo_id, cliente_id, ordem)
      SELECT id, cliente_id, 0 FROM processos WHERE clientes_nomes IS NULL AND cliente_id IS NOT NULL;
    UPDATE processos SET clientes_nomes = json_array(json_object('nome', cliente, 'cliente_id', cliente_id))
      WHERE clientes_nomes IS NULL;
  `);
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
