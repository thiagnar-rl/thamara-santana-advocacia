import { executar, Parametro, todos, um } from '../config/database';
import { STATUS_PROCESSO, StatusProcesso, normalizarNumeroCNJ, texto, umDe } from '../utils/validacao';

/**
 * MODEL — Processo
 * Regras de negócio e acesso à tabela "processos".
 */

export interface Processo {
  id: number;
  usuario_id: number;
  numero: string;
  cliente: string;
  cliente_id: number | null; // [F6] vínculo com o cadastro de clientes
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

/** [C1] Mensagem exibida quando o número não segue o padrão CNJ. */
export const MENSAGEM_NUMERO_INVALIDO =
  'Número do processo inválido. Use o padrão CNJ: 0000000-00.0000.0.00.0000 (20 dígitos).';

export const ProcessoModel = {
  /** Valida os campos do formulário de processo. */
  validar(corpo: unknown): { dados: DadosProcesso; erro: string | null } {
    const b = (corpo ?? {}) as Record<string, unknown>;
    const status = texto(b.status) ?? 'ativo';
    const dados: DadosProcesso = {
      numero: texto(b.numero) ?? '',
      cliente: texto(b.cliente) ?? '',
      cliente_id: Number(b.cliente_id) > 0 ? Number(b.cliente_id) : null,
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
    else if (!dados.cliente) erro = 'Informe o nome do cliente.';
    else if (dados.cliente.length > 150) erro = 'O nome do cliente pode ter no máximo 150 caracteres.';
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
      condicoes.push(`(p.numero LIKE ? OR p.cliente LIKE ? OR p.parte_contraria LIKE ?
                       OR p.tribunal LIKE ? OR p.area LIKE ?)`);
      const termo = `%${busca}%`;
      params.push(termo, termo, termo, termo, termo);
    }

    return await todos<Processo>(
      `${SELECT_PROCESSO} WHERE ${condicoes.join(' AND ')} ORDER BY p.atualizado_em DESC, p.id DESC`,
      ...params,
    );
  },

  /** [F6] Processos vinculados a um cliente. */
  async listarDoCliente(usuarioId: number, clienteId: number, dataHoje: string): Promise<Processo[]> {
    return await todos<Processo>(
      `${SELECT_PROCESSO} WHERE p.usuario_id = ? AND p.cliente_id = ? ORDER BY p.atualizado_em DESC, p.id DESC`,
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
    return (await executar(
      `INSERT INTO processos (usuario_id, numero, cliente, cliente_id, parte_contraria, tribunal, area, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      usuarioId,
      d.numero,
      d.cliente,
      d.cliente_id ?? null,
      d.parte_contraria,
      d.tribunal,
      d.area,
      d.status,
      d.observacoes,
    )).id;
  },

  /** Devolve true se encontrou e atualizou. */
  async atualizar(usuarioId: number, id: number, d: DadosProcesso): Promise<boolean> {
    return (
      (await executar(
        `UPDATE processos
            SET numero = ?, cliente = ?, cliente_id = ?, parte_contraria = ?, tribunal = ?, area = ?,
                status = ?, observacoes = ?, atualizado_em = datetime('now', 'localtime')
          WHERE id = ? AND usuario_id = ?`,
        d.numero,
        d.cliente,
        d.cliente_id ?? null,
        d.parte_contraria,
        d.tribunal,
        d.area,
        d.status,
        d.observacoes,
        id,
        usuarioId,
      )).alteracoes > 0
    );
  },

  /**
   * Exclui o processo e os compromissos dele (RN06).
   * A exclusão dos compromissos é feita explicitamente para funcionar
   * também no Turso, sem depender do ON DELETE CASCADE.
   */
  async excluir(usuarioId: number, id: number): Promise<boolean> {
    if (!(await ProcessoModel.pertenceAo(usuarioId, id))) return false;
    await executar('DELETE FROM compromissos WHERE processo_id = ? AND usuario_id = ?', id, usuarioId);
    return (await executar('DELETE FROM processos WHERE id = ? AND usuario_id = ?', id, usuarioId)).alteracoes > 0;
  },
};
