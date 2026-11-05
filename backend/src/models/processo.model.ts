import { executar, Parametro, todos, um } from '../config/database';
import { STATUS_PROCESSO, StatusProcesso, normalizarNumeroCNJ, texto, umDe } from '../utils/validacao';

/**
 * MODEL — Processo
 * Regras de negócio e acesso à tabela "processos".
 */

/**
 * [C4] Cliente de um processo: o nome e, se for um cliente cadastrado, o id dele.
 * Solicitado por Thamara Santana (cliente) (04/11/2026): um processo pode ter vários clientes.
 */
export interface ClienteDoProcesso {
  nome: string;
  cliente_id: number | null;
}

/** [C4] No máximo 30 clientes por processo (ex.: herdeiros num inventário). */
export const MAXIMO_CLIENTES = 30;

export interface Processo {
  id: number;
  usuario_id: number;
  numero: string;
  cliente: string; // [C4] resumo com os nomes ("Maria; João e mais 2"), usado nas listas e na busca
  cliente_id: number | null; // [F6] vínculo com o cadastro de clientes ([C4]: o primeiro cliente cadastrado)
  clientes_nomes: string | null; // [C4] lista completa em JSON
  parte_contraria: string | null;
  tribunal: string | null;
  area: string | null;
  status: StatusProcesso;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  total_pendentes: number;
  proximo_compromisso: string | null;
}

export interface DadosProcesso {
  numero: string;
  /** [C4] Clientes do processo. Se não vier, usa "cliente" / "cliente_id" (formato antigo, um cliente só). */
  clientes?: ClienteDoProcesso[];
  cliente: string;
  /** [F6] Cliente cadastrado (opcional). Solicitado por Thamara Santana (30/10/2026). */
  cliente_id?: number | null;
  parte_contraria: string | null;
  tribunal: string | null;
  area: string | null;
  status: StatusProcesso;
  observacoes: string | null;
}

export interface FiltroProcessos {
  busca?: string | null;
  status?: string | null;
}

/** Seleciona o processo já com o total de pendências e o próximo compromisso. */
const SELECT_PROCESSO = `
  SELECT p.*,
    (SELECT COUNT(*) FROM compromissos c
      WHERE c.processo_id = p.id AND c.status = 'pendente') AS total_pendentes,
    (SELECT MIN(c.data) FROM compromissos c
      WHERE c.processo_id = p.id AND c.status = 'pendente' AND c.data >= ?) AS proximo_compromisso
  FROM processos p
`;

/** [C4] Junta os nomes num resumo de até 150 caracteres: "Maria; João; Ana e mais 2". */
export function resumoDosClientes(lista: ClienteDoProcesso[]): string {
  const nomes = lista.map((c) => c.nome);
  const completo = nomes.join('; ');
  if (completo.length <= 150) return completo;
  for (let quantos = nomes.length - 1; quantos >= 1; quantos--) {
    const resumo = `${nomes.slice(0, quantos).join('; ')} e mais ${nomes.length - quantos}`;
    if (resumo.length <= 150) return resumo;
  }
  return `${nomes[0].slice(0, 130)}… e mais ${nomes.length - 1}`;
}

/** [C4] Lista de clientes de um processo (dados novos ou formato antigo de um cliente só). */
export function clientesDe(d: Pick<DadosProcesso, 'clientes' | 'cliente' | 'cliente_id'>): ClienteDoProcesso[] {
  if (d.clientes?.length) return d.clientes;
  return d.cliente ? [{ nome: d.cliente, cliente_id: d.cliente_id ?? null }] : [];
}

/** [C4] Lê a lista gravada no banco; processos antigos caem no formato de um cliente só. */
export function clientesDoProcesso(p: Pick<Processo, 'clientes_nomes' | 'cliente' | 'cliente_id'>): ClienteDoProcesso[] {
  if (p.clientes_nomes) {
    try {
      const lista = JSON.parse(p.clientes_nomes) as ClienteDoProcesso[];
      if (Array.isArray(lista) && lista.length) {
        return lista.map((c) => ({ nome: String(c.nome), cliente_id: c.cliente_id == null ? null : Number(c.cliente_id) }));
      }
    } catch {
      // cai no formato antigo
    }
  }
  return [{ nome: p.cliente, cliente_id: p.cliente_id == null ? null : Number(p.cliente_id) }];
}

/** [C4] Grava a lista no processo (resumo, primeiro cliente cadastrado e JSON) e refaz os vínculos. */
async function gravarClientes(processoId: number, lista: ClienteDoProcesso[]): Promise<void> {
  const primeiroCadastrado = lista.find((c) => c.cliente_id)?.cliente_id ?? null;
  await executar(
    'UPDATE processos SET cliente = ?, cliente_id = ?, clientes_nomes = ? WHERE id = ?',
    resumoDosClientes(lista),
    primeiroCadastrado,
    JSON.stringify(lista),
    processoId,
  );
  await executar('DELETE FROM processo_clientes WHERE processo_id = ?', processoId);
  const vinculados = lista.filter((c) => c.cliente_id);
  for (const [ordem, c] of vinculados.entries()) {
    await executar(
      'INSERT OR IGNORE INTO processo_clientes (processo_id, cliente_id, ordem) VALUES (?, ?, ?)',
      processoId,
      c.cliente_id,
      ordem,
    );
  }
}

/** [C1] Mensagem exibida quando o número não segue o padrão CNJ. */
export const MENSAGEM_NUMERO_INVALIDO =
  'Número do processo inválido. Use o padrão CNJ: 0000000-00.0000.0.00.0000 (20 dígitos).';

export const ProcessoModel = {
  /** Valida os campos do formulário de processo. */
  validar(corpo: unknown): { dados: DadosProcesso; erro: string | null } {
    const b = (corpo ?? {}) as Record<string, unknown>;
    const status = texto(b.status) ?? 'ativo';

    // [C4] Vários clientes: [{ nome, cliente_id }]. Sem a lista, aceita o formato antigo (cliente / cliente_id).
    const recebidos: ClienteDoProcesso[] = Array.isArray(b.clientes)
      ? (b.clientes as Record<string, unknown>[]).map((c) => ({
          nome: texto(c?.nome) ?? '',
          cliente_id: Number(c?.cliente_id) > 0 ? Number(c.cliente_id) : null,
        }))
      : [{ nome: texto(b.cliente) ?? '', cliente_id: Number(b.cliente_id) > 0 ? Number(b.cliente_id) : null }];
    const vistos = new Set<string>();
    const clientes = recebidos.filter((c) => {
      const chave = c.cliente_id ? `id:${c.cliente_id}` : `nome:${c.nome.toLowerCase()}`;
      if (!c.nome || vistos.has(chave)) return false; // tira linhas vazias e repetidas
      vistos.add(chave);
      return true;
    });

    const dados: DadosProcesso = {
      numero: texto(b.numero) ?? '',
      clientes,
      cliente: clientes[0]?.nome ?? '',
      cliente_id: clientes.find((c) => c.cliente_id)?.cliente_id ?? null,
      parte_contraria: texto(b.parte_contraria),
      tribunal: texto(b.tribunal),
      area: texto(b.area),
      status: status as StatusProcesso,
      observacoes: texto(b.observacoes),
    };

    // [C1] Número no padrão CNJ — solicitado por Mariana Couto (teste de 29/10/2026).
    const numeroCNJ = normalizarNumeroCNJ(dados.numero);
    if (numeroCNJ) dados.numero = numeroCNJ;

    let erro: string | null = null;
    if (!dados.numero) erro = 'Informe o número do processo.';
    else if (!numeroCNJ) erro = MENSAGEM_NUMERO_INVALIDO;
    else if (!clientes.length) erro = 'Informe o nome do cliente.';
    else if (clientes.some((c) => c.nome.length > 150)) erro = 'O nome do cliente pode ter no máximo 150 caracteres.';
    else if (clientes.length > MAXIMO_CLIENTES) erro = `Um processo pode ter no máximo ${MAXIMO_CLIENTES} clientes.`;
    else if (!umDe(STATUS_PROCESSO, status)) erro = 'Status inválido.';

    return { dados, erro };
  },

  async listar(usuarioId: number, filtro: FiltroProcessos, dataHoje: string): Promise<Processo[]> {
    const condicoes: string[] = ['p.usuario_id = ?'];
    const params: Parametro[] = [dataHoje, usuarioId];

    if (umDe(STATUS_PROCESSO, filtro.status)) {
      condicoes.push('p.status = ?');
      params.push(filtro.status);
    }

    const busca = texto(filtro.busca);
    if (busca) {
      condicoes.push(`(p.numero LIKE ? OR p.cliente LIKE ? OR p.clientes_nomes LIKE ? OR p.parte_contraria LIKE ?
                       OR p.tribunal LIKE ? OR p.area LIKE ?)`);
      const termo = `%${busca}%`;
      params.push(termo, termo, termo, termo, termo, termo);
    }

    return await todos<Processo>(
      `${SELECT_PROCESSO} WHERE ${condicoes.join(' AND ')} ORDER BY p.atualizado_em DESC, p.id DESC`,
      ...params,
    );
  },

  /** [F6] Processos vinculados a um cliente. [C4] Pela tabela de ligação: todos os processos em que ele aparece. */
  async listarDoCliente(usuarioId: number, clienteId: number, dataHoje: string): Promise<Processo[]> {
    return await todos<Processo>(
      `${SELECT_PROCESSO} WHERE p.usuario_id = ?
         AND p.id IN (SELECT processo_id FROM processo_clientes WHERE cliente_id = ?)
       ORDER BY p.atualizado_em DESC, p.id DESC`,
      dataHoje,
      usuarioId,
      clienteId,
    );
  },

  async buscar(usuarioId: number, id: number, dataHoje: string): Promise<Processo | undefined> {
    return await um<Processo>(`${SELECT_PROCESSO} WHERE p.id = ? AND p.usuario_id = ?`, dataHoje, id, usuarioId);
  },

  /** O processo existe e pertence à usuária? (RN04) */
  async pertenceAo(usuarioId: number, id: number): Promise<boolean> {
    return !!await um('SELECT id FROM processos WHERE id = ? AND usuario_id = ?', id, usuarioId);
  },

  /** RN02 — número de processo único por usuária. */
  async numeroRepetido(usuarioId: number, numero: string, ignorarId = 0): Promise<boolean> {
    return !!await um(
      'SELECT id FROM processos WHERE usuario_id = ? AND numero = ? AND id <> ?',
      usuarioId,
      numero,
      ignorarId,
    );
  },

  async criar(usuarioId: number, d: DadosProcesso): Promise<number> {
    const clientes = clientesDe(d);
    const id = (await executar(
      `INSERT INTO processos (usuario_id, numero, cliente, cliente_id, parte_contraria, tribunal, area, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      usuarioId,
      d.numero,
      resumoDosClientes(clientes),
      clientes.find((c) => c.cliente_id)?.cliente_id ?? null,
      d.parte_contraria,
      d.tribunal,
      d.area,
      d.status,
      d.observacoes,
    )).id;
    await gravarClientes(id, clientes); // [C4]
    return id;
  },

  /** Devolve true se encontrou e atualizou. */
  async atualizar(usuarioId: number, id: number, d: DadosProcesso): Promise<boolean> {
    const alterou =
      (await executar(
        `UPDATE processos
            SET numero = ?, parte_contraria = ?, tribunal = ?, area = ?,
                status = ?, observacoes = ?, atualizado_em = datetime('now', 'localtime')
          WHERE id = ? AND usuario_id = ?`,
        d.numero,
        d.parte_contraria,
        d.tribunal,
        d.area,
        d.status,
        d.observacoes,
        id,
        usuarioId,
      )).alteracoes > 0;
    if (alterou) await gravarClientes(id, clientesDe(d)); // [C4]
    return alterou;
  },

  /** [C4] Quando o cadastro do cliente muda de nome, o nome muda também em todos os processos dele. */
  async renomearCliente(usuarioId: number, clienteId: number, nome: string): Promise<void> {
    const processos = await todos<Processo>(
      `SELECT * FROM processos WHERE usuario_id = ?
         AND id IN (SELECT processo_id FROM processo_clientes WHERE cliente_id = ?)`,
      usuarioId,
      clienteId,
    );
    for (const p of processos) {
      const lista = clientesDoProcesso(p).map((c) => (c.cliente_id === clienteId ? { ...c, nome } : c));
      await gravarClientes(Number(p.id), lista);
    }
  },

  /** [C4] Quando o cliente é excluído, os processos continuam com o nome dele, mas sem o vínculo. */
  async desvincularCliente(usuarioId: number, clienteId: number): Promise<void> {
    const processos = await todos<Processo>(
      `SELECT * FROM processos WHERE usuario_id = ?
         AND id IN (SELECT processo_id FROM processo_clientes WHERE cliente_id = ?)`,
      usuarioId,
      clienteId,
    );
    for (const p of processos) {
      const lista = clientesDoProcesso(p).map((c) => (c.cliente_id === clienteId ? { ...c, cliente_id: null } : c));
      await gravarClientes(Number(p.id), lista);
    }
    // Processos antigos que só tinham o vínculo direto
    await executar('UPDATE processos SET cliente_id = NULL WHERE cliente_id = ? AND usuario_id = ?', clienteId, usuarioId);
  },

  /**
   * Exclui o processo e os compromissos dele (RN06).
   * A exclusão dos compromissos é feita explicitamente para funcionar
   * também no Turso, sem depender do ON DELETE CASCADE.
   */
  async excluir(usuarioId: number, id: number): Promise<boolean> {
    if (!(await ProcessoModel.pertenceAo(usuarioId, id))) return false;
    await executar('DELETE FROM compromissos WHERE processo_id = ? AND usuario_id = ?', id, usuarioId);
    await executar('DELETE FROM processo_clientes WHERE processo_id = ?', id); // [C4]
    return (await executar('DELETE FROM processos WHERE id = ? AND usuario_id = ?', id, usuarioId)).alteracoes > 0;
  },
};
