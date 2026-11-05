import { executar, um } from '../config/database';
import { cifrar, decifrar } from '../utils/cripto';
import { ErroGoogle, googleConfigurado, renovarAcesso, revogar } from '../utils/google';

/**
 * MODEL — Conta Google conectada
 * [F8] Solicitado por Thamara Santana (cliente) (04/11/2026): ligar a agenda do sistema à Google Agenda
 * da Thamara (e, no F1, guardar anexos no Google Drive dela).
 *
 * - Guarda só o "refresh token", CIFRADO. O acesso de curta duração (1 hora) fica na memória.
 * - Se o Google recusar o token (a usuária tirou a permissão), a conexão é marcada para reconectar.
 */

export interface ContaGoogle {
  usuario_id: number;
  email: string;
  refresh_token_cifrado: string;
  conectado_em: string;
  ultima_sincronizacao: string | null;
  ultimo_erro: string | null;
}

export const MENSAGEM_RECONECTAR = 'O Google recusou o acesso. Conecte a conta Google de novo.';

/** Acessos válidos na memória do servidor: usuarioId → token e validade. */
const acessos = new Map<number, { token: string; expira: number }>();

export const GoogleModel = {
  buscar(usuarioId: number): Promise<ContaGoogle | undefined> {
    return um<ContaGoogle>('SELECT * FROM google_contas WHERE usuario_id = ?', usuarioId);
  },

  async salvar(usuarioId: number, email: string, refreshToken: string, agora = new Date()): Promise<void> {
    acessos.delete(usuarioId);
    await executar(
      `INSERT INTO google_contas (usuario_id, email, refresh_token_cifrado, conectado_em, ultima_sincronizacao, ultimo_erro)
       VALUES (?, ?, ?, ?, NULL, NULL)
       ON CONFLICT(usuario_id) DO UPDATE SET email = excluded.email, refresh_token_cifrado = excluded.refresh_token_cifrado,
         conectado_em = excluded.conectado_em, ultima_sincronizacao = NULL, ultimo_erro = NULL`,
      usuarioId,
      email,
      cifrar(refreshToken),
      agora.toISOString(),
    );
  },

  /** Situação para a tela: configurado no servidor? conectado? com qual e-mail? */
  async situacao(usuarioId: number) {
    const conta = await GoogleModel.buscar(usuarioId);
    return {
      configurado: googleConfigurado(),
      conectado: !!conta,
      email: conta?.email ?? null,
      ultima_sincronizacao: conta?.ultima_sincronizacao ?? null,
      erro: conta?.ultimo_erro ?? null,
    };
  },

  /**
   * Acesso válido para chamar o Google (renova quando precisa).
   * Devolve null se a usuária não conectou o Google.
   */
  async acesso(usuarioId: number, agora = Date.now()): Promise<string | null> {
    const guardado = acessos.get(usuarioId);
    if (guardado && guardado.expira > agora + 60_000) return guardado.token;
    const conta = await GoogleModel.buscar(usuarioId);
    if (!conta) return null;
    const refresh = decifrar(conta.refresh_token_cifrado);
    if (!refresh) {
      await GoogleModel.registrarErro(usuarioId, MENSAGEM_RECONECTAR);
      return null;
    }
    try {
      const novo = await renovarAcesso(refresh);
      acessos.set(usuarioId, { token: novo.accessToken, expira: agora + novo.expiraEmSegundos * 1000 });
      return novo.accessToken;
    } catch (erro) {
      if (erro instanceof ErroGoogle && (erro.status === 400 || erro.status === 401)) {
        await GoogleModel.registrarErro(usuarioId, MENSAGEM_RECONECTAR);
        return null;
      }
      throw erro;
    }
  },

  async registrarErro(usuarioId: number, erro: string | null): Promise<void> {
    await executar('UPDATE google_contas SET ultimo_erro = ? WHERE usuario_id = ?', erro, usuarioId);
  },

  async registrarSincronizacao(usuarioId: number, quando: string): Promise<void> {
    await executar('UPDATE google_contas SET ultima_sincronizacao = ?, ultimo_erro = NULL WHERE usuario_id = ?', quando, usuarioId);
  },

  /** Desconecta: avisa o Google, apaga a conexão e esquece os vínculos dos compromissos (os eventos continuam no Google). */
  async desconectar(usuarioId: number): Promise<void> {
    const conta = await GoogleModel.buscar(usuarioId);
    if (conta) {
      const refresh = decifrar(conta.refresh_token_cifrado);
      if (refresh) await revogar(refresh);
    }
    acessos.delete(usuarioId);
    await executar('DELETE FROM google_contas WHERE usuario_id = ?', usuarioId);
    await executar('DELETE FROM google_pastas WHERE usuario_id = ?', usuarioId); // [F1] (os arquivos continuam no Drive e na lista de anexos)
    await executar('UPDATE compromissos SET google_event_id = NULL, google_atualizado_em = NULL WHERE usuario_id = ?', usuarioId);
  },

  /** Só para os testes: esquece os acessos guardados na memória. */
  limparMemoria(): void {
    acessos.clear();
  },
};
