import { Anexo } from '../models';

/**
 * [F1] Anexos — funções puras (testadas em frontend/tests/anexos.logica.test.ts).
 * Solicitado por Thamara Santana (cliente) (04/11/2026).
 */

export const TAMANHO_MAXIMO = 50 * 1024 * 1024; // 50 MB, o mesmo limite do servidor

/** "850 KB", "2,4 MB". */
export function tamanhoLegivel(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Problema com o arquivo escolhido, ou null se pode enviar. */
export function problemaNoArquivo(arquivo: { name: string; size: number }): string | null {
  if (!arquivo.size) return `"${arquivo.name}" está vazio.`;
  if (arquivo.size > TAMANHO_MAXIMO) return `"${arquivo.name}" passa de 50 MB.`;
  return null;
}

/** Tipo do arquivo para o ícone e a etiqueta: PDF, Imagem, Word, Planilha… */
export function tipoDoArquivo(a: Pick<Anexo, 'nome' | 'tipo_mime'>): string {
  const mime = a.tipo_mime ?? '';
  const ext = a.nome.split('.').pop()?.toLowerCase() ?? '';
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (mime.startsWith('image/')) return 'Imagem';
  if (/word|opendocument\.text/.test(mime) || ['doc', 'docx', 'odt'].includes(ext)) return 'Word';
  if (/sheet|excel/.test(mime) || ['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'Planilha';
  if (mime.startsWith('audio/')) return 'Áudio';
  if (mime.startsWith('video/')) return 'Vídeo';
  return ext ? ext.toUpperCase().slice(0, 5) : 'Arquivo';
}

/** dd/mm/aaaa da data de envio. */
export function dataDoAnexo(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
