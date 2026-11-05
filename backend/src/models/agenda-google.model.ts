import { CompromissoModel } from './compromisso.model';
import { GoogleModel } from './google.model';
import { dadosDoEvento, EventoGoogle, eventoDoCompromisso } from '../utils/agenda-google';
import { chamarGoogle, ErroGoogle } from '../utils/google';

/**
 * MODEL — Sincronização com o Google Agenda (nos dois sentidos)
 * [F8] Solicitado por Thiago Rinaldi Luna (04/11/2026).
 *
 * Do sistema para o Google: cada compromisso criado, editado, concluído ou excluído
 *   é repetido na agenda principal da conta Google conectada.
 * Do Google para o sistema: ao abrir a Agenda ou a tela Início (no máximo a cada 2 minutos),
 *   o sistema pega os eventos alterados desde a última vez:
 *     - evento novo → compromisso do tipo "Outro";
 *     - evento alterado → atualiza o compromisso;
 *     - evento excluído → exclui o compromisso.
 *   Em caso de alteração dos dois lados, vale a mais recente.
 */

const AGENDA = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
export const INTERVALO_MINIMO_MS = 2 * 60_000;
const JANELA_PASSADO_DIAS = 30;
const JANELA_FUTURO_DIAS = 365;

export interface ResultadoSincronizacao {
  conectado: boolean;
  feita: boolean;
  novos: number;
  atualizados: number;
  removidos: number;
  erro?: string;
}

export const AgendaGoogleModel = {
  /**
   * Executa uma ação com o Google sem deixar um problema lá derrubar a tela da usuária:
   * se falhar, o erro fica registrado na conexão (aparece em "Google Agenda" no menu).
   */
  async tentar(usuarioId: number, acao: () => Promise<void>): Promise<void> {
    try {
      await acao();
    } catch (erro) {
      console.error('[F8] Falha ao sincronizar com o Google:', erro);
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      await GoogleModel.registrarErro(usuarioId, `Falha ao sincronizar com o Google: ${mensagem}`.slice(0, 300)).catch(() => undefined);
    }
  },

  /** Envia (cria ou atualiza) um compromisso para o Google. Sem conta conectada, não faz nada. */
  async enviar(usuarioId: number, compromissoId: number): Promise<void> {
    const token = await GoogleModel.acesso(usuarioId);
    if (!token) return;
    const c = await CompromissoModel.buscar(usuarioId, compromissoId);
    if (!c) return;
    const corpo = eventoDoCompromisso({ ...c, id: Number(c.id) });
    let evento: EventoGoogle | null = null;
    if (c.google_event_id) {
      try {
        evento = (await chamarGoogle(token, 'PATCH', `${AGENDA}/${encodeURIComponent(c.google_event_id)}`, corpo)) as EventoGoogle;
      } catch (erro) {
        // Evento apagado no Google: cria de novo
        if (!(erro instanceof ErroGoogle && (erro.status === 404 || erro.status === 410))) throw erro;
      }
    }
    if (!evento) evento = (await chamarGoogle(token, 'POST', AGENDA, corpo)) as EventoGoogle;
    await CompromissoModel.definirVinculoGoogle(usuarioId, compromissoId, evento.id ?? null, evento.updated ?? null);
  },

  /** Na primeira conexão: envia os compromissos pendentes de hoje em diante (até 200). */
  async enviarPendentes(usuarioId: number, hojeIso = new Date().toISOString().slice(0, 10)): Promise<void> {
    const lista = await CompromissoModel.listar(usuarioId, { status: 'pendente', de: hojeIso }, hojeIso);
    for (const c of lista.slice(0, 200)) {
      if (!c.google_event_id) await AgendaGoogleModel.enviar(usuarioId, Number(c.id));
    }
  },

  /** Apaga o evento no Google (o compromisso já foi ou será excluído no sistema). */
  async apagar(usuarioId: number, eventoId: string | null | undefined): Promise<void> {
    if (!eventoId) return;
    const token = await GoogleModel.acesso(usuarioId);
    if (!token) return;
    try {
      await chamarGoogle(token, 'DELETE', `${AGENDA}/${encodeURIComponent(eventoId)}`);
    } catch (erro) {
      if (!(erro instanceof ErroGoogle && (erro.status === 404 || erro.status === 410))) throw erro;
    }
  },

  /** Traz para o sistema o que mudou no Google desde a última vez. */
  async receber(usuarioId: number, agora = new Date(), forcar = false): Promise<ResultadoSincronizacao> {
    const resultado: ResultadoSincronizacao = { conectado: false, feita: false, novos: 0, atualizados: 0, removidos: 0 };
    const conta = await GoogleModel.buscar(usuarioId);
    if (!conta) return resultado;
    resultado.conectado = true;
    if (!forcar && conta.ultima_sincronizacao && agora.getTime() - new Date(conta.ultima_sincronizacao).getTime() < INTERVALO_MINIMO_MS) {
      return resultado;
    }
    const token = await GoogleModel.acesso(usuarioId, agora.getTime());
    if (!token) return { ...resultado, erro: (await GoogleModel.buscar(usuarioId))?.ultimo_erro ?? undefined };

    const params = new URLSearchParams({
      singleEvents: 'true',
      showDeleted: 'true',
      maxResults: '250',
      timeMin: new Date(agora.getTime() - JANELA_PASSADO_DIAS * 86_400_000).toISOString(),
      timeMax: new Date(agora.getTime() + JANELA_FUTURO_DIAS * 86_400_000).toISOString(),
    });
    // Só o que mudou desde a última vez (com 5 minutos de folga)
    if (conta.ultima_sincronizacao) {
      params.set('updatedMin', new Date(new Date(conta.ultima_sincronizacao).getTime() - 5 * 60_000).toISOString());
    }

    let pagina: string | undefined;
    for (let vez = 0; vez < 10; vez++) {
      if (pagina) params.set('pageToken', pagina);
      const resposta = (await chamarGoogle(token, 'GET', `${AGENDA}?${params.toString()}`)) as { items?: EventoGoogle[]; nextPageToken?: string };
      for (const ev of resposta.items ?? []) await AgendaGoogleModel.aplicarEvento(usuarioId, ev, resultado);
      pagina = resposta.nextPageToken;
      if (!pagina) break;
    }

    await GoogleModel.registrarSincronizacao(usuarioId, agora.toISOString());
    resultado.feita = true;
    return resultado;
  },

  /** Aplica no sistema um evento que veio do Google. */
  async aplicarEvento(usuarioId: number, ev: EventoGoogle, resultado: ResultadoSincronizacao): Promise<void> {
    if (!ev.id) return;
    let existente = await CompromissoModel.buscarPorEventoGoogle(usuarioId, ev.id);
    const dados = dadosDoEvento(ev);

    // Evento criado pelo sistema, mas o vínculo não chegou a ser gravado: liga pelo id escondido no evento
    if (!existente && dados?.compromissoId) {
      const candidato = await CompromissoModel.buscar(usuarioId, dados.compromissoId);
      if (candidato && !candidato.google_event_id) existente = candidato;
    }

    if (ev.status === 'cancelled' || !dados) {
      if (existente && ev.status === 'cancelled') {
        await CompromissoModel.excluir(usuarioId, Number(existente.id));
        resultado.removidos++;
      }
      return;
    }

    if (existente) {
      // Alteração que o próprio sistema fez (ou já recebida): nada a fazer
      if (existente.google_atualizado_em && ev.updated && ev.updated <= existente.google_atualizado_em) return;
      await CompromissoModel.atualizarDoGoogle(usuarioId, Number(existente.id), dados, ev.updated ?? null);
      if (!existente.google_event_id) await CompromissoModel.definirVinculoGoogle(usuarioId, Number(existente.id), ev.id, ev.updated ?? null);
      resultado.atualizados++;
      return;
    }

    const id = await CompromissoModel.criar(usuarioId, {
      processo_id: null,
      tipo: dados.tipo ?? 'outro',
      titulo: dados.titulo,
      data: dados.data,
      hora: dados.hora,
      local: dados.local,
      descricao: dados.descricao,
      prioridade: 'media',
      status: dados.concluido ? 'concluido' : 'pendente',
    });
    await CompromissoModel.definirVinculoGoogle(usuarioId, id, ev.id, ev.updated ?? null);
    resultado.novos++;
  },
};
