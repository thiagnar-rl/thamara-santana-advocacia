/**
 * Leitura de feeds RSS e Atom (funções puras, sem acesso à internet).
 * [F7] Site institucional — solicitado por Thiago Rinaldi Luna (04/11/2026).
 *
 * Não usamos biblioteca externa: um feed é um XML simples, e só precisamos de
 * título, link, data e resumo de cada item.
 */

export interface ItemFeed {
  titulo: string;
  link: string;
  resumo: string | null;
  /** Data em ISO 8601 (UTC), ou null se o feed não informar uma data válida. */
  data: string | null;
  /** Site de origem, quando o feed informa (ex.: Google Notícias: <source>IBDFAM</source>). */
  fonte?: string | null;
}

const ENTIDADES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  ordm: 'º',
  ordf: 'ª',
};

/** Troca &amp; &#233; &#xE9; etc. pelos caracteres correspondentes. */
export function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (inteiro, codigo: string) => {
    if (codigo[0] === '#') {
      const numero = codigo[1] === 'x' || codigo[1] === 'X' ? parseInt(codigo.slice(2), 16) : parseInt(codigo.slice(1), 10);
      return Number.isFinite(numero) && numero > 0 && numero < 0x110000 ? String.fromCodePoint(numero) : inteiro;
    }
    return ENTIDADES[codigo.toLowerCase()] ?? inteiro;
  });
}

/** Tira CDATA, tags HTML e espaços repetidos — sobra só o texto. */
export function limparTexto(bruto: string | null | undefined): string {
  if (!bruto) return '';
  let t = bruto.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  t = decodificarEntidades(t); // o HTML do resumo costuma vir "escapado" (&lt;p&gt;)
  t = t.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  t = decodificarEntidades(t);
  return t.replace(/\s+/g, ' ').trim();
}

/** Corta o texto no limite, sem quebrar palavra, e coloca reticências. */
export function resumir(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const corte = texto.slice(0, limite + 1);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return `${corte.slice(0, ultimoEspaco > limite * 0.6 ? ultimoEspaco : limite).replace(/[\s,.;:–—-]+$/, '')}…`;
}

/** Conteúdo da primeira tag com esse nome (ex.: "title", "dc:date"). */
function tag(bloco: string, nome: string): string | null {
  const nomeEscapado = nome.replace(':', '\\:');
  const m = bloco.match(new RegExp(`<${nomeEscapado}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${nomeEscapado}>`, 'i'));
  return m ? m[1] : null;
}

/** Link de um item Atom: <link href="..."/> (de preferência rel="alternate"). */
function linkAtom(bloco: string): string | null {
  const links = [...bloco.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  const atributo = (attrs: string, nome: string) => attrs.match(new RegExp(`${nome}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? null;
  const preferido = links.find((a) => !atributo(a, 'rel') || atributo(a, 'rel') === 'alternate') ?? links[0];
  return preferido ? atributo(preferido, 'href') : null;
}

/** Só aceita endereços http(s) — nunca "javascript:" ou outros esquemas. */
export function linkSeguro(link: string | null): string | null {
  if (!link) return null;
  const limpo = decodificarEntidades(link.replace(/<!\[CDATA\[|\]\]>/g, '').trim());
  try {
    const url = new URL(limpo);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Datas escritas em português, como as do STJ: "Qua, nov 4 2026 17:11:00".
 * Sem fuso informado, considera o horário de Brasília (-03:00).
 */
function lerDataEmPortugues(texto: string): string | null {
  const t = normalizar(texto);
  const mes = MESES_PT.findIndex((m) => new RegExp(`\\b${m}`).test(t));
  const ano = t.match(/\b(20\d{2})\b/)?.[1];
  const dia = t.replace(ano ?? '', '').match(/\b(\d{1,2})\b/)?.[1];
  if (mes < 0 || !ano || !dia) return null;
  const [hora, minuto, segundo] = (t.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?/)?.slice(1) ?? []).map((v) => v ?? '00');
  const iso = `${ano}-${String(mes + 1).padStart(2, '0')}-${dia.padStart(2, '0')}T${(hora ?? '12').padStart(2, '0')}:${minuto ?? '00'}:${segundo ?? '00'}-03:00`;
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/** Converte as datas usadas em RSS (RFC 822), Atom (ISO 8601) ou em português para ISO em UTC. */
export function lerData(bruta: string | null): string | null {
  if (!bruta) return null;
  const texto = limparTexto(bruta)
    // fusos por extenso que o JavaScript não entende
    .replace(/\b(BRT|BRST)\b/, (f) => (f === 'BRT' ? '-0300' : '-0200'));
  const data = new Date(texto);
  if (!Number.isNaN(data.getTime())) return data.toISOString();
  return lerDataEmPortugues(texto);
}

/** Lê um feed RSS 2.0 ou Atom e devolve os itens (ignora os que não têm título ou link válido). */
export function lerFeed(xml: string): ItemFeed[] {
  const blocos = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const ehAtom = blocos.length === 0;
  const lista = ehAtom ? [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]) : blocos;

  const itens: ItemFeed[] = [];
  for (const bloco of lista) {
    const fonte = limparTexto(tag(bloco, 'source')) || null;
    let titulo = limparTexto(tag(bloco, 'title'));
    // Agregadores escrevem "Título - Site"; o site já aparece separado
    if (fonte && titulo.endsWith(` - ${fonte}`)) titulo = titulo.slice(0, -(fonte.length + 3)).trim();
    const link = linkSeguro(ehAtom ? linkAtom(bloco) : (tag(bloco, 'link') ?? tag(bloco, 'guid')));
    if (!titulo || !link) continue;
    let resumoBruto = limparTexto(tag(bloco, 'description') ?? tag(bloco, 'summary') ?? tag(bloco, 'content'));
    // Resumo que só repete o título (e o nome do site) não acrescenta nada
    if (resumoBruto && normalizar(resumoBruto).startsWith(normalizar(titulo).slice(0, 60))) resumoBruto = '';
    const data = lerData(
      tag(bloco, 'pubDate') ?? tag(bloco, 'dc:date') ?? tag(bloco, 'published') ?? tag(bloco, 'updated'),
    );
    itens.push({ titulo: resumir(titulo, 200), link, resumo: resumoBruto ? resumir(resumoBruto, 280) : null, data, fonte });
  }
  return itens;
}

/** Descobre a codificação do texto (algumas fontes ainda usam ISO-8859-1) e decodifica os bytes. */
export function decodificarBytes(bytes: ArrayBuffer, contentType: string | null): string {
  const doCabecalho = contentType?.match(/charset=([\w-]+)/i)?.[1];
  const inicio = new TextDecoder('latin1').decode(bytes.slice(0, 200));
  const doXml = inicio.match(/encoding=["']([\w-]+)["']/i)?.[1];
  const codificacao = (doXml || doCabecalho || 'utf-8').toLowerCase();
  try {
    return new TextDecoder(codificacao).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

/** Remove acentos e passa para minúsculas (para comparar palavras). */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
