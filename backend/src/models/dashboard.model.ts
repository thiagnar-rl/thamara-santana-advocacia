import { todos, um } from '../config/database';
import { inicioDoMes, somarDias } from '../utils/datas';
import { TIPOS, TipoCompromisso } from '../utils/validacao';
import { Compromisso } from './compromisso.model';

/**
 * MODEL — Painel (dashboard)
 * Consultas agregadas para a tela inicial.
 */

export interface Resumo {
  processosAtivos: number;
  hoje: number;
  semana: number;
  atrasados: number;
  concluidosMes: number;
}

export interface DadosPainel {
  resumo: Resumo;
  hoje: Compromisso[];
  proximos: Compromisso[];
  atrasados: Compromisso[];
  porTipo: Record<TipoCompromisso, number>;
}

const SELECT_COMPROMISSO = `
  SELECT c.*, p.numero AS processo_numero, p.cliente AS processo_cliente
  FROM compromissos c
  LEFT JOIN processos p ON p.id = c.processo_id
`;

async function contar(sql: string, ...params: (string | number)[]): Promise<number> {
  return Number((await um<{ total: number }>(sql, ...params))?.total ?? 0);
}

export const DashboardModel = {
  /** Monta todos os dados do painel para a data informada. */
  async montar(usuarioId: number, dataHoje: string): Promise<DadosPainel> {
    const u = usuarioId;
    const daquiSeteDias = somarDias(dataHoje, 7);

    const resumo: Resumo = {
      processosAtivos: await contar("SELECT COUNT(*) AS total FROM processos WHERE usuario_id = ? AND status = 'ativo'", u),
      hoje: await contar(
        "SELECT COUNT(*) AS total FROM compromissos WHERE usuario_id = ? AND status = 'pendente' AND data = ?",
        u,
        dataHoje,
      ),
      semana: await contar(
        `SELECT COUNT(*) AS total FROM compromissos
          WHERE usuario_id = ? AND status = 'pendente' AND data > ? AND data <= ?`,
        u,
        dataHoje,
        daquiSeteDias,
      ),
      atrasados: await contar(
        "SELECT COUNT(*) AS total FROM compromissos WHERE usuario_id = ? AND status = 'pendente' AND data < ?",
        u,
        dataHoje,
      ),
      concluidosMes: await contar(
        `SELECT COUNT(*) AS total FROM compromissos
          WHERE usuario_id = ? AND status = 'concluido' AND COALESCE(substr(concluido_em, 1, 10), data) >= ?`,
        u,
        inicioDoMes(dataHoje),
      ),
    };

    const hoje = await todos<Compromisso>(
      `${SELECT_COMPROMISSO} WHERE c.usuario_id = ? AND c.data = ?
       ORDER BY c.status = 'concluido', COALESCE(c.hora, '99:99')`,
      u,
      dataHoje,
    );

    const proximos = await todos<Compromisso>(
      `${SELECT_COMPROMISSO} WHERE c.usuario_id = ? AND c.status = 'pendente' AND c.data > ? AND c.data <= ?
       ORDER BY c.data, COALESCE(c.hora, '99:99') LIMIT 12`,
      u,
      dataHoje,
      daquiSeteDias,
    );

    const atrasados = await todos<Compromisso>(
      `${SELECT_COMPROMISSO} WHERE c.usuario_id = ? AND c.status = 'pendente' AND c.data < ?
       ORDER BY c.data DESC LIMIT 8`,
      u,
      dataHoje,
    );

    const porTipo = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<TipoCompromisso, number>;
    const linhas = await todos<{ tipo: TipoCompromisso; total: number }>(
      `SELECT tipo, COUNT(*) AS total FROM compromissos
        WHERE usuario_id = ? AND status = 'pendente' AND data >= ?
        GROUP BY tipo`,
      u,
      dataHoje,
    );
    for (const linha of linhas) porTipo[linha.tipo] = Number(linha.total);

    return { resumo, hoje, proximos, atrasados, porTipo };
  },
};
