import { enderecoDoSite } from './email';

/**
 * [F8] Conversa com o Google (login, Google Agenda e, no F1, Google Drive).
 * Usa chamadas HTTP diretas, sem biblioteca nova.
 * Solicitado por Thiago Rinaldi Luna (04/11/2026).
 *
 * Configuração (variáveis de ambiente — ver backend/.env.example e a ficha F8):
 *   GOOGLE_CLIENT_ID      "ID do cliente" criado no Google Cloud
 *   GOOGLE_CLIENT_SECRET  "Chave secreta do cliente" (só na Vercel, nunca no GitHub)
 */

export const ESCOPOS = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events', // criar, ver, editar e apagar eventos da agenda
  'https://www.googleapis.com/auth/drive.file', // [F1] só os arquivos que o próprio sistema criar no Drive
];

export interface RespostaHttp {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
  headers?: { get(nome: string): string | null }; // [F1] o Drive devolve o endereço de envio no cabeçalho Location
}

export type ClienteHttp = (
  url: string,
  opcoes?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<RespostaHttp>;

let clienteDeTeste: ClienteHttp | null = null;

/** Usado só pelos testes, para simular o Google sem acessar a internet. */
export function definirClienteHttp(cliente: ClienteHttp | null): void {
  clienteDeTeste = cliente;
}

function http(): ClienteHttp {
  return clienteDeTeste ?? (fetch as unknown as ClienteHttp);
}

/** Erro devolvido pelo Google (status HTTP + mensagem). */
export class ErroGoogle extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export function googleConfigurado(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Endereço para onde o Google devolve a usuária depois de autorizar (cadastrado no Google Cloud). */
export function enderecoDeRetorno(): string {
  return `${enderecoDoSite()}/api/google/retorno`;
}

/** Página do Google onde a usuária escolhe a conta e autoriza o acesso. */
export function urlDeAutorizacao(estado: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: enderecoDeRetorno(),
    response_type: 'code',
    scope: ESCOPOS.join(' '),
    access_type: 'offline', // para continuar sincronizando sem pedir login de novo
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: estado,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function pedirToken(campos: Record<string, string>): Promise<Record<string, unknown>> {
  const resposta = await http()('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      ...campos,
    }).toString(),
  });
  const corpo = (await resposta.json()) as Record<string, unknown>;
  if (!resposta.ok) throw new ErroGoogle(resposta.status, String(corpo.error_description ?? corpo.error ?? 'Falha no login do Google'));
  return corpo;
}

/** Troca o código recebido na volta do login pelos tokens de acesso. */
export async function trocarCodigo(codigo: string): Promise<{ refreshToken: string | null; accessToken: string; expiraEmSegundos: number }> {
  const t = await pedirToken({ code: codigo, grant_type: 'authorization_code', redirect_uri: enderecoDeRetorno() });
  return {
    refreshToken: typeof t.refresh_token === 'string' ? t.refresh_token : null,
    accessToken: String(t.access_token),
    expiraEmSegundos: Number(t.expires_in ?? 3600),
  };
}

/** Pede um novo acesso (vale ~1 hora) a partir do refresh token guardado. */
export async function renovarAcesso(refreshToken: string): Promise<{ accessToken: string; expiraEmSegundos: number }> {
  const t = await pedirToken({ refresh_token: refreshToken, grant_type: 'refresh_token' });
  return { accessToken: String(t.access_token), expiraEmSegundos: Number(t.expires_in ?? 3600) };
}

/** E-mail da conta Google que autorizou. */
export async function emailDaConta(accessToken: string): Promise<string> {
  const dados = (await chamarGoogle(accessToken, 'GET', 'https://openidconnect.googleapis.com/v1/userinfo')) as { email?: string };
  return dados?.email ?? '';
}

/** Cancela a autorização no Google (ao desconectar). Erros são ignorados. */
export async function revogar(token: string): Promise<void> {
  try {
    await http()(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    // se não conseguir avisar o Google, a conexão é apagada do sistema mesmo assim
  }
}

/** [F1] Cliente HTTP atual (o de verdade ou o dos testes). */
export function clienteHttp(): ClienteHttp {
  return http();
}

/** Chamada autenticada a uma API do Google. Devolve o JSON (ou null quando não há corpo). */
export async function chamarGoogle(accessToken: string, metodo: string, url: string, corpo?: unknown): Promise<unknown> {
  const resposta = await http()(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
  });
  const texto = await resposta.text();
  const json = texto ? (JSON.parse(texto) as { error?: { message?: string } }) : null;
  if (!resposta.ok) throw new ErroGoogle(resposta.status, json?.error?.message ?? `Erro ${resposta.status} do Google`);
  return json;
}
