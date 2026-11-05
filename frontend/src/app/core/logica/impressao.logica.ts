import { Anexo, ClienteDetalhe, Compromisso, Processo, ProcessoDetalhe } from '../models';
import { dataDoAnexo, tamanhoLegivel, tipoDoArquivo } from './anexos.logica';
import { infoTipo, PRIORIDADES, rotuloStatusProcesso, deISO, paraISO, somarDias } from '../rotulos';
import { enderecoCompleto } from './clientes.logica';

/**
 * MODEL — Impressão (funções puras, testadas em frontend/tests/impressao.logica.test.ts)
 * [F4] Botão Imprimir na Agenda, na ficha do processo, na ficha do cliente e na lista de processos.
 * Solicitado por: Thamara Santana (cliente) (04/11/2026). (O F4 já estava reservado na planilha de testes
 * de 29/10: "Imprimir ou exportar a agenda da semana em PDF", apontado por Pedro Nogueira.)
 *
 * Cada tela monta um "documento" (título + seções) e o componente de impressão desenha esse
 * documento num papel A4 com o timbre do escritório. Para salvar em PDF, basta escolher
 * "Salvar como PDF" na janela de impressão do navegador.
 */

export interface CampoImpressao {
  rotulo: string;
  valor: string;
}

export type SecaoImpressao =
  | { tipo: 'campos'; titulo?: string; campos: CampoImpressao[] }
  | { tipo: 'tabela'; titulo?: string; colunas: string[]; linhas: string[][]; vazio: string }
  | { tipo: 'texto'; titulo?: string; texto: string };

export interface DocumentoImpressao {
  titulo: string;
  subtitulo?: string;
  secoes: SecaoImpressao[];
}

/** dd/mm/aaaa a partir de AAAA-MM-DD (ou vazio). */
export function dataBR(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** [F1] Lista dos documentos anexados (só aparece se houver algum). */
function secaoAnexos(anexos: Anexo[]): SecaoImpressao[] {
  if (!anexos.length) return [];
  return [
    {
      tipo: 'tabela',
      titulo: 'Documentos anexados (Google Drive)',
      colunas: ['Documento', 'Tipo', 'Tamanho', 'Anexado em'],
      linhas: anexos.map((a) => [a.nome, tipoDoArquivo(a), tamanhoLegivel(a.tamanho) || '—', dataDoAnexo(a.criado_em)]),
      vazio: '',
    },
  ];
}

/** Só os campos preenchidos (o papel não fica cheio de linhas vazias). */
function campos(lista: [string, string | null | undefined][]): CampoImpressao[] {
  return lista.filter(([, v]) => v != null && String(v).trim() !== '').map(([rotulo, valor]) => ({ rotulo, valor: String(valor) }));
}

/** Compromissos em ordem de data e hora (sem hora vai primeiro no dia). */
function ordenarCompromissos(lista: Compromisso[]): Compromisso[] {
  return [...lista].sort((a, b) => a.data.localeCompare(b.data) || (a.hora ?? '').localeCompare(b.hora ?? ''));
}

function situacaoCompromisso(c: Compromisso, hojeIso: string): string {
  if (c.status === 'concluido') return 'Concluído';
  return c.data < hojeIso ? 'Atrasado' : 'Pendente';
}

/** Linha de compromisso para as tabelas. */
function linhaCompromisso(c: Compromisso, hojeIso: string, comProcesso: boolean): string[] {
  const prioridade = PRIORIDADES.find((p) => p.valor === c.prioridade)?.rotulo ?? '';
  const linha = [dataBR(c.data), c.hora ?? '—', infoTipo(c.tipo).rotulo, c.titulo];
  if (comProcesso) {
    linha.push([c.processo_numero, c.processo_cliente].filter(Boolean).join(' · ') || '—');
  }
  linha.push(c.local || '—', `${situacaoCompromisso(c, hojeIso)}${c.status === 'pendente' && c.prioridade === 'alta' ? ` · prioridade ${prioridade.toLowerCase()}` : ''}`);
  return linha;
}

/** Agenda: lista de compromissos de um período. */
export function impressaoAgenda(titulo: string, subtitulo: string, lista: Compromisso[], hojeIso: string): DocumentoImpressao {
  const ordenada = ordenarCompromissos(lista);
  const pendentes = ordenada.filter((c) => c.status === 'pendente').length;
  return {
    titulo,
    subtitulo: `${subtitulo} · ${ordenada.length} compromisso${ordenada.length === 1 ? '' : 's'}${pendentes ? ` (${pendentes} pendente${pendentes === 1 ? '' : 's'})` : ''}`,
    secoes: [
      {
        tipo: 'tabela',
        colunas: ['Data', 'Hora', 'Tipo', 'Compromisso', 'Processo / cliente', 'Local', 'Situação'],
        linhas: ordenada.map((c) => linhaCompromisso(c, hojeIso, true)),
        vazio: 'Nenhum compromisso neste período.',
      },
    ],
  };
}

/** Ficha do processo: dados, clientes e compromissos. */
export function impressaoProcesso(d: ProcessoDetalhe, hojeIso: string, anexos: Anexo[] = []): DocumentoImpressao {
  const p = d.processo;
  const clientes = (p.clientes?.length ? p.clientes : [{ nome: p.cliente, cliente_id: p.cliente_id }]).map((c) => c.nome);
  const secoes: SecaoImpressao[] = [
    {
      tipo: 'campos',
      campos: campos([
        ['Número', p.numero],
        [clientes.length > 1 ? 'Clientes' : 'Cliente', clientes.join('; ')],
        ['Parte contrária', p.parte_contraria],
        ['Vara / Tribunal', p.tribunal],
        ['Área', p.area],
        ['Situação', rotuloStatusProcesso(p.status)],
      ]),
    },
  ];
  if (p.observacoes) secoes.push({ tipo: 'texto', titulo: 'Observações', texto: p.observacoes });
  secoes.push({
    tipo: 'tabela',
    titulo: 'Compromissos',
    colunas: ['Data', 'Hora', 'Tipo', 'Compromisso', 'Local', 'Situação'],
    linhas: ordenarCompromissos(d.compromissos).map((c) => linhaCompromisso(c, hojeIso, false)),
    vazio: 'Nenhum compromisso cadastrado.',
  });
  secoes.push(...secaoAnexos(anexos)); // [F1]
  return { titulo: `Processo ${p.numero}`, subtitulo: clientes.join('; '), secoes };
}

/** Ficha do cliente: identificação, contato, endereço e processos. */
export function impressaoCliente(d: ClienteDetalhe, anexos: Anexo[] = []): DocumentoImpressao {
  const c = d.cliente;
  const pj = c.tipo === 'juridica';
  const identificacao = pj
    ? campos([
        ['Razão social', c.nome],
        ['Nome fantasia', c.nome_fantasia],
        ['CNPJ', c.cnpj],
        ['Inscrição estadual', c.inscricao_estadual],
        ['Inscrição municipal', c.inscricao_municipal],
        ['Ramo de atuação', c.ramo_atuacao],
      ])
    : campos([
        ['Nome completo', c.nome],
        ['CPF', c.cpf],
        ['RG', c.rg],
        ['Data de nascimento', dataBR(c.data_nascimento)],
        ['Nacionalidade', c.nacionalidade],
        ['Estado civil', c.estado_civil],
        ['Profissão', c.profissao],
      ]);
  const secoes: SecaoImpressao[] = [{ tipo: 'campos', titulo: pj ? 'Empresa' : 'Identificação', campos: identificacao }];
  if (pj) {
    const representante = campos([
      ['Nome', c.representante_nome],
      ['CPF', c.representante_cpf],
      ['Cargo', c.representante_cargo],
      ['Data de nascimento', dataBR(c.representante_nascimento)],
    ]);
    if (representante.length) secoes.push({ tipo: 'campos', titulo: 'Representante legal', campos: representante });
  }
  const contato = campos([
    ['Celular', c.celular],
    ['WhatsApp', c.whatsapp],
    ['Telefone', c.telefone],
    ['E-mail', c.email],
    ['Endereço', enderecoCompleto(c)],
  ]);
  if (contato.length) secoes.push({ tipo: 'campos', titulo: 'Contato e endereço', campos: contato });
  if (c.observacoes) secoes.push({ tipo: 'texto', titulo: 'Observações', texto: c.observacoes });
  secoes.push({
    tipo: 'tabela',
    titulo: 'Processos',
    colunas: ['Número', 'Clientes', 'Parte contrária', 'Vara / Tribunal', 'Situação'],
    linhas: d.processos.map((p) => [p.numero, p.cliente, p.parte_contraria || '—', p.tribunal || '—', rotuloStatusProcesso(p.status)]),
    vazio: 'Nenhum processo vinculado.',
  });
  secoes.push(...secaoAnexos(anexos)); // [F1]
  return { titulo: c.nome, subtitulo: pj ? 'Ficha do cliente · Pessoa jurídica' : 'Ficha do cliente · Pessoa física', secoes };
}

/** Lista de processos (com o filtro que estiver aplicado na tela). */
export function impressaoProcessos(lista: Processo[], filtro: string): DocumentoImpressao {
  return {
    titulo: 'Processos',
    subtitulo: `${filtro} · ${lista.length} processo${lista.length === 1 ? '' : 's'}`,
    secoes: [
      {
        tipo: 'tabela',
        colunas: ['Número', 'Clientes', 'Parte contrária', 'Vara / Tribunal', 'Área', 'Situação', 'Próximo compromisso'],
        linhas: lista.map((p) => [
          p.numero,
          p.cliente,
          p.parte_contraria || '—',
          p.tribunal || '—',
          p.area || '—',
          rotuloStatusProcesso(p.status),
          dataBR(p.proximo_compromisso) || '—',
        ]),
        vazio: 'Nenhum processo encontrado.',
      },
    ],
  };
}

/** Semana (domingo a sábado, como no calendário) que contém a data. */
export function semanaDe(iso: string): { de: string; ate: string } {
  const de = somarDias(iso, -deISO(iso).getDay());
  return { de, ate: somarDias(de, 6) };
}

/** Primeiro e último dia do mês (mesISO = AAAA-MM-01). */
export function mesDe(mesISO: string): { de: string; ate: string } {
  const inicio = deISO(mesISO);
  return { de: paraISO(new Date(inicio.getFullYear(), inicio.getMonth(), 1)), ate: paraISO(new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0)) };
}

/** "02/11/2026 a 08/11/2026" */
export function textoPeriodo(p: { de: string; ate: string }): string {
  return `${dataBR(p.de)} a ${dataBR(p.ate)}`;
}
