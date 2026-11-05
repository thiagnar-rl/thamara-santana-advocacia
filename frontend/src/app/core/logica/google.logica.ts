import { ResultadoSincronizacao, SituacaoGoogle } from '../models';

/**
 * [F8] Textos da conexão com o Google Agenda (funções puras, testadas em frontend/tests/google.logica.test.ts).
 * Solicitado por Thamara Santana (cliente) (04/11/2026).
 */

/** "Google Agenda conectada" / "Reconectar o Google" / "Conectar Google Agenda". */
export function textoSituacaoGoogle(s: SituacaoGoogle | null): { rotulo: string; detalhe: string; estado: 'conectado' | 'erro' | 'desconectado' } {
  if (!s || !s.conectado) {
    return { rotulo: 'Conectar Google Agenda', detalhe: 'Sincronize a agenda com o Google', estado: 'desconectado' };
  }
  if (s.erro) return { rotulo: 'Reconectar o Google', detalhe: s.erro, estado: 'erro' };
  return { rotulo: 'Google Agenda', detalhe: s.email ?? 'Conectada', estado: 'conectado' };
}

/** Mensagem curta depois de sincronizar ("2 novos e 1 alterado vieram do Google") — ou null se nada mudou. */
export function resumoSincronizacao(r: ResultadoSincronizacao | null | undefined): string | null {
  if (!r?.feita) return null;
  const partes = [
    r.novos ? `${r.novos} ${r.novos === 1 ? 'novo' : 'novos'}` : '',
    r.atualizados ? `${r.atualizados} ${r.atualizados === 1 ? 'alterado' : 'alterados'}` : '',
    r.removidos ? `${r.removidos} ${r.removidos === 1 ? 'excluído' : 'excluídos'}` : '',
  ].filter(Boolean);
  if (!partes.length) return null;
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : partes[0];
  return `Google Agenda: ${lista}.`;
}

/** Aviso na volta do login do Google (?google=conectado | cancelado | erro). */
export function avisoDaConexao(situacao: string | null): { tipo: 'sucesso' | 'erro'; texto: string } | null {
  switch (situacao) {
    case 'conectado':
      return { tipo: 'sucesso', texto: 'Google Agenda conectada! Os compromissos agora aparecem lá também.' };
    case 'cancelado':
      return { tipo: 'erro', texto: 'A conexão com o Google foi cancelada.' };
    case 'erro':
      return { tipo: 'erro', texto: 'Não foi possível conectar o Google. Tente de novo.' };
    default:
      return null;
  }
}
