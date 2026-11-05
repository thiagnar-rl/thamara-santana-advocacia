import { chamarGoogle, clienteHttp, ErroGoogle } from './google';

/**
 * [F1] Conversa com o Google Drive (anexos) — pedido de Thiago Rinaldi Luna (04/11/2026).
 *
 * Com a permissão "drive.file", o sistema só enxerga os arquivos e pastas que ele mesmo criou.
 * O arquivo vai do navegador DIRETO para o Drive (envio "retomável"), então não passa pela Vercel
 * e não esbarra no limite de 4,5 MB dela.
 */

export const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const ENVIO = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,webViewLink';
export const TIPO_PASTA = 'application/vnd.google-apps.folder';
export const TAMANHO_MAXIMO = 50 * 1024 * 1024; // 50 MB por arquivo

export interface ArquivoDrive {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
  trashed?: boolean;
  appProperties?: Record<string, string>;
}

const CAMPOS = 'id,name,mimeType,size,webViewLink,parents,trashed,appProperties';

/** Cria uma pasta (dentro de outra, se informada). */
export async function criarPasta(token: string, nome: string, pai: string | null): Promise<string> {
  const pasta = (await chamarGoogle(token, 'POST', `${DRIVE}?fields=id`, {
    name: nome,
    mimeType: TIPO_PASTA,
    ...(pai ? { parents: [pai] } : {}),
  })) as { id: string };
  return pasta.id;
}

/** Dados de um arquivo. Devolve null se ele não existe mais (ou está na lixeira). */
export async function dadosDoArquivo(token: string, id: string): Promise<ArquivoDrive | null> {
  try {
    const arquivo = (await chamarGoogle(token, 'GET', `${DRIVE}/${encodeURIComponent(id)}?fields=${CAMPOS}`)) as ArquivoDrive;
    return arquivo.trashed ? null : arquivo;
  } catch (erro) {
    if (erro instanceof ErroGoogle && (erro.status === 404 || erro.status === 403)) return null;
    throw erro;
  }
}

/** Manda o arquivo para a lixeira do Drive (pode ser recuperado lá por 30 dias). */
export async function moverParaLixeira(token: string, id: string): Promise<void> {
  try {
    await chamarGoogle(token, 'PATCH', `${DRIVE}/${encodeURIComponent(id)}?fields=id`, { trashed: true });
  } catch (erro) {
    if (erro instanceof ErroGoogle && erro.status === 404) return; // já não existe
    throw erro;
  }
}

/**
 * Abre um envio no Drive e devolve o endereço para onde o navegador manda o arquivo.
 * "origem" é o endereço do site: o Drive só aceita o envio vindo dele.
 */
export async function iniciarEnvio(
  token: string,
  dados: { nome: string; tipoMime: string; tamanho: number; pasta: string; propriedades: Record<string, string> },
  origem: string,
): Promise<string> {
  const resposta = await clienteHttp()(ENVIO, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': dados.tipoMime,
      'X-Upload-Content-Length': String(dados.tamanho),
      Origin: origem,
    },
    body: JSON.stringify({ name: dados.nome, parents: [dados.pasta], appProperties: dados.propriedades }),
  });
  if (!resposta.ok) {
    const texto = await resposta.text();
    let mensagem = `Erro ${resposta.status} do Google Drive`;
    try {
      mensagem = (JSON.parse(texto) as { error?: { message?: string } }).error?.message ?? mensagem;
    } catch {
      // resposta sem JSON
    }
    throw new ErroGoogle(resposta.status, mensagem);
  }
  const endereco = resposta.headers?.get('location') ?? resposta.headers?.get('Location');
  if (!endereco) throw new ErroGoogle(502, 'O Google Drive não devolveu o endereço de envio.');
  return endereco;
}
