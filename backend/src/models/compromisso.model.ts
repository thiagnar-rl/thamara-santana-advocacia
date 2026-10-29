import { executar, Parametro, todos, um } from '../config/database';
import {
  PRIORIDADES,
  Prioridade,
  STATUS_COMPROMISSO,
  StatusCompromisso,
  TIPOS,
  TipoCompromisso,
  dataValida,
  horaValida,
  texto,
  umDe,
} from '../utils/validacao';
import { ProcessoModel } from './processo.model';

/**
 * MODEL — Compromisso (audiência, recurso, manifestação, despacho)
 * Regras de negócio e acesso à tabela "compromissos".
 */

export interface Compromisso {
  id: number;
  usuario_id: number;
  processo_id: number | null;
  tipo: TipoCompromisso;
  titulo: string;
  data: string;
  hora: string | null;
  local: string | null;
  descricao: string | null;
  prioridade: Prioridade;
  status: StatusCompromisso;
  concluido_em: string | null;
  criado_em: string;
  processo_numero: string | null;
  processo_cliente: string | null;
}

export interface DadosCompromisso {
  processo_id: number | null;
  tipo: TipoCompromisso;
  titulo: string;
  data: string;
  hora: string | null;
  local: string | null;
  descricao: string | null;
  prioridade: Prioridade;
  status: StatusCompromisso;
}

export interface FiltroCompromissos {
  tipo?: string | null;
  status?: string | null;
  de?: string | null;
  ate?: string | null;
  processoId?: string | number | null;
  periodo?: string | null;
}

const SELECT_COMPROMISSO = `
  SELECT c.*, p.numero AS processo_numero, p.cliente AS processo_cliente
  FROM compromissos c
  LEFT JOIN processos p ON p.id = c.processo_id
`;

const ORDEM_HORA = "COALESCE(c.hora, '99:99')";

export const CompromissoModel = {
  /** Valida os campos do formulário (RN03 e RN04). */
  async validar(corpo: unknown, usuarioId: number): Promise<{ dados: DadosCompromisso; erro: string | null }> {
    const b = (corpo ?? {}) as Record<string, unknown>;
    const processoId = b.processo_id ? Number(b.processo_id) : null;
    const tipo = texto(b.tipo);
    const prioridade = texto(b.prioridade) ?? 'media';
    const status = texto(b.status) ?? 'pendente';
    const dados: DadosCompromisso = {
      processo_id: processoId,
      tipo: tipo as TipoCompromisso,
      titulo: texto(b.titulo) ?? '',
      data: texto(b.data) ?? '',
      hora: texto(b.hora),
      local: texto(b.local),
      descricao: texto(b.descricao),
      prioridade: prioridade as Prioridade,
      status: status as StatusCompromisso,
    };

    let erro: string | null = null;
    if (!umDe(TIPOS, tipo)) erro = 'Escolha o tipo do compromisso.';
    else if (!dados.titulo) erro = 'Informe um título.';
    else if (dados.titulo.length > 150) erro = 'O título pode ter no máximo 150 caracteres.';
    else if (!dataValida(dados.data)) erro = 'Informe uma data válida.';
    else if (dados.hora && !horaValida(dados.hora)) erro = 'Hora inválida.';
    else if (!umDe(PRIORIDADES, prioridade)) erro = 'Prioridade inválida.';
    else if (!umDe(STATUS_COMPROMISSO, status)) erro = 'Status inválido.';
    else if (processoId !== null && !(await ProcessoModel.pertenceAo(usuarioId, processoId))) erro = 'Processo não encontrado.';

    return { dados, erro };
  },

  async listar(usuarioId: number, filtro: FiltroCompromissos, dataHoje: string): Promise<Compromisso[]> {
    const condicoes: string[] = ['c.usuario_id = ?'];
    const params: Parametro[] = [usuarioId];

    if (umDe(TIPOS, filtro.tipo)) {
      condicoes.push('c.tipo = ?');
      params.push(filtro.tipo);
    }
    if (umDe(STATUS_COMPROMISSO, filtro.status)) {
      condicoes.push('c.status = ?');
      params.push(filtro.status);
    }
    if (dataValida(filtro.de)) {
      condicoes.push('c.data >= ?');
      params.push(filtro.de);
    }
    if (dataValida(filtro.ate)) {
      condicoes.push('c.data <= ?');
      params.push(filtro.ate);
    }
    if (filtro.processoId) {
      condicoes.push('c.processo_id = ?');
      params.push(Number(filtro.processoId));
    }

    let ordem = 'ASC';
    if (filtro.periodo === 'atrasados') {
      condicoes.push("c.data < ? AND c.status = 'pendente'");
      params.push(dataHoje);
      ordem = 'DESC';
    }

    return await todos<Compromisso>(
      `${SELECT_COMPROMISSO} WHERE ${condicoes.join(' AND ')} ORDER BY c.data ${ordem}, ${ORDEM_HORA} ASC`,
      ...params,
    );
  },

  async buscar(usuarioId: number, id: number): Promise<Compromisso | undefined> {
    return await um<Compromisso>(`${SELECT_COMPROMISSO} WHERE c.id = ? AND c.usuario_id = ?`, id, usuarioId);
  },

  /** Compromissos de um processo: pendentes primeiro, depois por data. */
  async listarDoProcesso(usuarioId: number, processoId: number): Promise<Compromisso[]> {
    return await todos<Compromisso>(
      `${SELECT_COMPROMISSO} WHERE c.processo_id = ? AND c.usuario_id = ?
       ORDER BY c.status = 'concluido', c.data ASC, ${ORDEM_HORA} ASC`,
      processoId,
      usuarioId,
    );
  },

  async criar(usuarioId: number, d: DadosCompromisso): Promise<number> {
    return (await executar(
      `INSERT INTO compromissos
         (usuario_id, processo_id, tipo, titulo, data, hora, local, descricao, prioridade, status, concluido_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               CASE WHEN ? = 'concluido' THEN datetime('now', 'localtime') END)`,
      usuarioId,
      d.processo_id,
      d.tipo,
      d.titulo,
      d.data,
      d.hora,
      d.local,
      d.descricao,
      d.prioridade,
      d.status,
      d.status,
    )).id;
  },

  async atualizar(usuarioId: number, id: number, d: DadosCompromisso): Promise<boolean> {
    return (
      (await executar(
        `UPDATE compromissos
            SET processo_id = ?, tipo = ?, titulo = ?, data = ?, hora = ?, local = ?,
                descricao = ?, prioridade = ?, status = ?,
                concluido_em = CASE
                  WHEN ? = 'concluido' THEN COALESCE(concluido_em, datetime('now', 'localtime'))
                  ELSE NULL END
          WHERE id = ? AND usuario_id = ?`,
        d.processo_id,
        d.tipo,
        d.titulo,
        d.data,
        d.hora,
        d.local,
        d.descricao,
        d.prioridade,
        d.status,
        d.status,
        id,
        usuarioId,
      )).alteracoes > 0
    );
  },

  /** Conclui ou reabre, registrando/limpando a data de conclusão (RN07). */
  async alterarStatus(usuarioId: number, id: number, status: StatusCompromisso): Promise<boolean> {
    return (
      (await executar(
        `UPDATE compromissos
            SET status = ?,
                concluido_em = CASE WHEN ? = 'concluido' THEN datetime('now', 'localtime') ELSE NULL END
          WHERE id = ? AND usuario_id = ?`,
        status,
        status,
        id,
        usuarioId,
      )).alteracoes > 0
    );
  },

  async excluir(usuarioId: number, id: number): Promise<boolean> {
    return (await executar('DELETE FROM compromissos WHERE id = ? AND usuario_id = ?', id, usuarioId)).alteracoes > 0;
  },

  /** RN05 — atrasado é derivado: pendente com data anterior a hoje. */
  estaAtrasado(c: Pick<Compromisso, 'status' | 'data'>, dataHoje: string): boolean {
    return c.status === 'pendente' && c.data < dataHoje;
  },
};
