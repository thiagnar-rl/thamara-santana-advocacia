import { executar, todos, um } from '../config/database';
import { ArquivoDrive, criarPasta, dadosDoArquivo, iniciarEnvio, moverParaLixeira, TAMANHO_MAXIMO } from '../utils/drive';
import { ErroGoogle } from '../utils/google';
import { GoogleModel } from './google.model';

/**
 * MODEL — Anexos (documentos guardados no Google Drive)
 * [F1] Solicitado por Thamara Santana (cliente) (04/11/2026): "botões de anexar documentos nos tipos de compromissos,
 * bem como atribuídos ao cliente e também atribuídos ao processo".
 *
 * Os arquivos ficam no Drive da conta Google conectada (a mesma do Google Agenda, F8), na pasta
 * "Thamara Santana Advocacia", com as subpastas Clientes, Processos e Compromissos.
 */

export const DONOS = ['cliente', 'processo', 'compromisso'] as const;
export type DonoAnexo = (typeof DONOS)[number];

export interface Anexo {
  id: number;
  usuario_id: number;
  dono_tipo: DonoAnexo;
  dono_id: number;
  nome: string;
  tipo_mime: string | null;
  tamanho: number | null;
  drive_arquivo_id: string;
  link: string | null;
  criado_em: string;
}

export const PASTA_RAIZ = 'Thamara Santana Advocacia';
const SUBPASTAS: Record<DonoAnexo, string> = { cliente: 'Clientes', processo: 'Processos', compromisso: 'Compromissos' };
const TABELA_DO_DONO: Record<DonoAnexo, string> = { cliente: 'clientes', processo: 'processos', compromisso: 'compromissos' };

/** Erro com mensagem para a tela (status HTTP + texto). */
export class ErroAnexo extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export const MENSAGEM_SEM_GOOGLE = 'Conecte a conta Google (no menu, "Conectar Google Agenda") para anexar documentos no Google Drive.';

async function acessoObrigatorio(usuarioId: number): Promise<string> {
  const token = await GoogleModel.acesso(usuarioId);
  if (!token) throw new ErroAnexo(409, MENSAGEM_SEM_GOOGLE);
  return token;
}

export const AnexoModel = {
  listar(usuarioId: number, dono: DonoAnexo, donoId: number): Promise<Anexo[]> {
    return todos<Anexo>(
      'SELECT * FROM anexos WHERE usuario_id = ? AND dono_tipo = ? AND dono_id = ? ORDER BY criado_em DESC, id DESC',
      usuarioId,
      dono,
      donoId,
    );
  },

  buscar(usuarioId: number, id: number): Promise<Anexo | undefined> {
    return um<Anexo>('SELECT * FROM anexos WHERE id = ? AND usuario_id = ?', id, usuarioId);
  },

  /** O cliente, processo ou compromisso existe e é da usuária? */
  async donoExiste(usuarioId: number, dono: DonoAnexo, donoId: number): Promise<boolean> {
    const linha = await um<{ id: number }>(`SELECT id FROM ${TABELA_DO_DONO[dono]} WHERE id = ? AND usuario_id = ?`, donoId, usuarioId);
    return !!linha;
  },

  /** Pasta do Drive para o tipo de dono (cria "Thamara Santana Advocacia/Processos" etc. na primeira vez). */
  async pasta(usuarioId: number, token: string, dono: DonoAnexo): Promise<string> {
    const valida = async (chave: string): Promise<string | null> => {
      const linha = await um<{ drive_id: string }>('SELECT drive_id FROM google_pastas WHERE usuario_id = ? AND chave = ?', usuarioId, chave);
      if (!linha) return null;
      if (await dadosDoArquivo(token, linha.drive_id)) return linha.drive_id;
      await executar('DELETE FROM google_pastas WHERE usuario_id = ? AND chave = ?', usuarioId, chave); // apagada no Drive: cria de novo
      return null;
    };
    const guardar = (chave: string, id: string) =>
      executar(
        'INSERT INTO google_pastas (usuario_id, chave, drive_id) VALUES (?, ?, ?) ON CONFLICT(usuario_id, chave) DO UPDATE SET drive_id = excluded.drive_id',
        usuarioId,
        chave,
        id,
      );

    let sub = await valida(dono);
    if (sub) return sub;
    let raiz = await valida('raiz');
    if (!raiz) {
      raiz = await criarPasta(token, PASTA_RAIZ, null);
      await guardar('raiz', raiz);
    }
    sub = await criarPasta(token, SUBPASTAS[dono], raiz);
    await guardar(dono, sub);
    return sub;
  },

  /** Abre o envio de um arquivo e devolve o endereço do Drive para o navegador mandar o arquivo. */
  async iniciarEnvio(
    usuarioId: number,
    dados: { dono: DonoAnexo; donoId: number; nome: string; tipoMime: string; tamanho: number },
    origem: string,
  ): Promise<string> {
    if (dados.tamanho > TAMANHO_MAXIMO) throw new ErroAnexo(400, 'O arquivo passa de 50 MB.');
    if (!(await AnexoModel.donoExiste(usuarioId, dados.dono, dados.donoId))) throw new ErroAnexo(404, 'Registro não encontrado.');
    const token = await acessoObrigatorio(usuarioId);
    const pasta = await AnexoModel.pasta(usuarioId, token, dados.dono);
    return iniciarEnvio(
      token,
      {
        nome: dados.nome,
        tipoMime: dados.tipoMime,
        tamanho: dados.tamanho,
        pasta,
        propriedades: { tsDono: dados.dono, tsDonoId: String(dados.donoId), tsUsuario: String(usuarioId) },
      },
      origem,
    );
  },

  /**
   * Registra o arquivo que o navegador acabou de mandar ao Drive.
   * Confere no próprio Drive que o arquivo existe e foi criado pelo sistema para este dono.
   */
  async registrar(usuarioId: number, driveArquivoId: string): Promise<Anexo> {
    const token = await acessoObrigatorio(usuarioId);
    const arquivo: ArquivoDrive | null = await dadosDoArquivo(token, driveArquivoId);
    const p = arquivo?.appProperties ?? {};
    const dono = p.tsDono as DonoAnexo;
    const donoId = Number(p.tsDonoId);
    if (!arquivo || !DONOS.includes(dono) || p.tsUsuario !== String(usuarioId) || !Number.isInteger(donoId)) {
      throw new ErroAnexo(400, 'Arquivo não encontrado no Google Drive.');
    }
    if (!(await AnexoModel.donoExiste(usuarioId, dono, donoId))) throw new ErroAnexo(404, 'Registro não encontrado.');
    await executar(
      `INSERT INTO anexos (usuario_id, dono_tipo, dono_id, nome, tipo_mime, tamanho, drive_arquivo_id, link, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(usuario_id, drive_arquivo_id) DO NOTHING`,
      usuarioId,
      dono,
      donoId,
      arquivo.name.slice(0, 255),
      arquivo.mimeType ?? null,
      arquivo.size ? Number(arquivo.size) : null,
      arquivo.id,
      arquivo.webViewLink ?? `https://drive.google.com/file/d/${arquivo.id}/view`,
      new Date().toISOString(),
    );
    const anexo = await um<Anexo>('SELECT * FROM anexos WHERE usuario_id = ? AND drive_arquivo_id = ?', usuarioId, arquivo.id);
    return anexo!;
  },

  /** Exclui o anexo: o arquivo vai para a lixeira do Drive e sai do sistema. */
  async excluir(usuarioId: number, id: number): Promise<boolean> {
    const anexo = await AnexoModel.buscar(usuarioId, id);
    if (!anexo) return false;
    const token = await GoogleModel.acesso(usuarioId);
    if (token) await moverParaLixeira(token, anexo.drive_arquivo_id);
    await executar('DELETE FROM anexos WHERE id = ? AND usuario_id = ?', id, usuarioId);
    return true;
  },

  /**
   * Depois de excluir clientes, processos ou compromissos: os anexos que ficaram sem dono
   * vão para a lixeira do Drive e saem do sistema. Erros do Google não impedem a exclusão.
   */
  async limparOrfaos(usuarioId: number): Promise<number> {
    const orfaos = await todos<Anexo>(
      `SELECT a.* FROM anexos a
        WHERE a.usuario_id = ?
          AND ((a.dono_tipo = 'cliente'     AND NOT EXISTS (SELECT 1 FROM clientes     c WHERE c.id = a.dono_id AND c.usuario_id = a.usuario_id))
            OR (a.dono_tipo = 'processo'    AND NOT EXISTS (SELECT 1 FROM processos    p WHERE p.id = a.dono_id AND p.usuario_id = a.usuario_id))
            OR (a.dono_tipo = 'compromisso' AND NOT EXISTS (SELECT 1 FROM compromissos m WHERE m.id = a.dono_id AND m.usuario_id = a.usuario_id)))`,
      usuarioId,
    );
    if (!orfaos.length) return 0;
    let token: string | null = null;
    try {
      token = await GoogleModel.acesso(usuarioId);
    } catch {
      token = null;
    }
    for (const anexo of orfaos) {
      if (token) {
        try {
          await moverParaLixeira(token, anexo.drive_arquivo_id);
        } catch (erro) {
          if (!(erro instanceof ErroGoogle)) throw erro;
        }
      }
      await executar('DELETE FROM anexos WHERE id = ?', anexo.id);
    }
    return orfaos.length;
  },

  /** Quantos anexos de cada registro (para mostrar o número nas listas). */
  async contar(usuarioId: number, dono: DonoAnexo, ids: number[]): Promise<Map<number, number>> {
    const mapa = new Map<number, number>();
    if (!ids.length) return mapa;
    const linhas = await todos<{ dono_id: number; total: number }>(
      `SELECT dono_id, COUNT(*) AS total FROM anexos WHERE usuario_id = ? AND dono_tipo = ? AND dono_id IN (${ids.map(() => '?').join(',')}) GROUP BY dono_id`,
      usuarioId,
      dono,
      ...ids,
    );
    for (const l of linhas) mapa.set(Number(l.dono_id), Number(l.total));
    return mapa;
  },
};
