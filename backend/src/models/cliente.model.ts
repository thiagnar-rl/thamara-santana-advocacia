import { executar, Parametro, todos, um } from '../config/database';
import {
  Aniversario,
  cnpjValido,
  cpfValido,
  digitos,
  ESTADOS_CIVIS,
  formatarCNPJ,
  formatarCPF,
  normalizarCEP,
  normalizarTelefone,
  proximoAniversario,
  UFS,
} from '../utils/documentos';
import { dataValida, emailValido, texto, umDe } from '../utils/validacao';

/**
 * MODEL — Cliente
 * [F6] Cadastro individual de clientes (pessoa física ou jurídica) com aviso de aniversário.
 * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */

export const TIPOS_PESSOA = ['fisica', 'juridica'] as const;
export type TipoPessoa = (typeof TIPOS_PESSOA)[number];

/** Campos que a usuária preenche no formulário. */
export interface DadosCliente {
  tipo: TipoPessoa;
  nome: string;
  nacionalidade: string | null;
  estado_civil: string | null;
  profissao: string | null;
  rg: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  ramo_atuacao: string | null;
  representante_nome: string | null;
  representante_cpf: string | null;
  representante_cargo: string | null;
  representante_nascimento: string | null;
  cep: string | null;
  logradouro: string | null;
  endereco_numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
}

export interface Cliente extends DadosCliente {
  id: number;
  usuario_id: number;
  criado_em: string;
  atualizado_em: string;
  total_processos: number;
}

/** Cliente com o próximo aniversário calculado (para os avisos). */
export interface Aniversariante {
  cliente: Cliente;
  aniversario: Aniversario;
}

/** Ordem das colunas usada no INSERT e no UPDATE. */
const COLUNAS: (keyof DadosCliente)[] = [
  'tipo', 'nome',
  'nacionalidade', 'estado_civil', 'profissao', 'rg', 'cpf', 'data_nascimento',
  'nome_fantasia', 'cnpj', 'inscricao_estadual', 'inscricao_municipal', 'ramo_atuacao',
  'representante_nome', 'representante_cpf', 'representante_cargo', 'representante_nascimento',
  'cep', 'logradouro', 'endereco_numero', 'complemento', 'bairro', 'cidade', 'uf',
  'telefone', 'celular', 'whatsapp', 'email', 'observacoes',
];

const CAMPOS_PESSOA_FISICA: (keyof DadosCliente)[] = [
  'nacionalidade', 'estado_civil', 'profissao', 'rg', 'cpf', 'data_nascimento',
];
const CAMPOS_PESSOA_JURIDICA: (keyof DadosCliente)[] = [
  'nome_fantasia', 'cnpj', 'inscricao_estadual', 'inscricao_municipal', 'ramo_atuacao',
  'representante_nome', 'representante_cpf', 'representante_cargo', 'representante_nascimento',
];

const SELECT_CLIENTE = `
  SELECT cl.*,
    (SELECT COUNT(*) FROM processos p WHERE p.cliente_id = cl.id) AS total_processos
  FROM clientes cl
`;

/** Data de nascimento usada no aviso: da pessoa (PF) ou do representante legal (PJ). */
export function dataDeAniversario(c: Pick<DadosCliente, 'tipo' | 'data_nascimento' | 'representante_nascimento'>): string | null {
  return c.tipo === 'juridica' ? c.representante_nascimento : c.data_nascimento;
}

export const ClienteModel = {
  /** Valida e padroniza os campos do formulário (máscaras de CPF, CNPJ, CEP e telefones). */
  validar(corpo: unknown, dataHoje: string): { dados: DadosCliente; erro: string | null } {
    const b = (corpo ?? {}) as Record<string, unknown>;
    const tipo = (texto(b.tipo) ?? 'fisica') as TipoPessoa;

    const dados = Object.fromEntries(COLUNAS.map((c) => [c, texto(b[c])])) as unknown as DadosCliente;
    dados.tipo = tipo;
    dados.nome = texto(b.nome) ?? '';

    // Guarda só os campos do tipo escolhido (evita dados "escondidos" do outro tipo).
    for (const campo of tipo === 'juridica' ? CAMPOS_PESSOA_FISICA : CAMPOS_PESSOA_JURIDICA) {
      (dados as unknown as Record<string, null>)[campo] = null;
    }

    const erro = ((): string | null => {
      if (!umDe(TIPOS_PESSOA, tipo)) return 'Escolha se o cliente é pessoa física ou jurídica.';
      if (!dados.nome) return tipo === 'juridica' ? 'Informe a razão social.' : 'Informe o nome completo.';
      if (dados.nome.length > 150) return 'O nome pode ter no máximo 150 caracteres.';

      if (dados.cpf) {
        if (!cpfValido(dados.cpf)) return 'CPF inválido. Confira os 11 números.';
        dados.cpf = formatarCPF(dados.cpf);
      }
      if (dados.cnpj) {
        if (!cnpjValido(dados.cnpj)) return 'CNPJ inválido. Confira os 14 números.';
        dados.cnpj = formatarCNPJ(dados.cnpj);
      }
      if (dados.representante_cpf) {
        if (!cpfValido(dados.representante_cpf)) return 'CPF do representante legal inválido.';
        dados.representante_cpf = formatarCPF(dados.representante_cpf);
      }
      for (const [campo, rotulo] of [
        ['data_nascimento', 'Data de nascimento'],
        ['representante_nascimento', 'Data de nascimento do representante'],
      ] as const) {
        const valor = dados[campo];
        if (valor && (!dataValida(valor) || valor > dataHoje)) return `${rotulo} inválida.`;
      }
      if (dados.estado_civil && !umDe(ESTADOS_CIVIS, dados.estado_civil)) return 'Estado civil inválido.';

      if (dados.cep) {
        const cep = normalizarCEP(dados.cep);
        if (!cep) return 'CEP inválido. Use 8 números (00000-000).';
        dados.cep = cep;
      }
      if (dados.uf) {
        dados.uf = dados.uf.toUpperCase();
        if (!umDe(UFS, dados.uf)) return 'UF inválida.';
      }
      for (const [campo, rotulo] of [
        ['telefone', 'Telefone fixo'],
        ['celular', 'Celular'],
        ['whatsapp', 'WhatsApp'],
      ] as const) {
        const valor = dados[campo];
        if (valor) {
          const numero = normalizarTelefone(valor);
          if (!numero) return `${rotulo} inválido. Informe DDD + número.`;
          dados[campo] = numero;
        }
      }
      if (dados.email) {
        dados.email = dados.email.toLowerCase();
        if (!emailValido(dados.email)) return 'E-mail inválido.';
      }
      return null;
    })();

    return { dados, erro };
  },

  async listar(usuarioId: number, filtro: { busca?: string | null; tipo?: string | null } = {}): Promise<Cliente[]> {
    const condicoes = ['cl.usuario_id = ?'];
    const params: Parametro[] = [usuarioId];

    if (umDe(TIPOS_PESSOA, filtro.tipo)) {
      condicoes.push('cl.tipo = ?');
      params.push(filtro.tipo);
    }
    const busca = texto(filtro.busca);
    if (busca) {
      const termo = `%${busca}%`;
      const opcoes = ['cl.nome LIKE ?', 'cl.nome_fantasia LIKE ?', 'cl.email LIKE ?', 'cl.cidade LIKE ?'];
      params.push(termo, termo, termo, termo);
      // Busca por CPF/CNPJ digitando só os números (com ou sem pontuação).
      const termoDigitos = digitos(busca);
      if (termoDigitos.length >= 3) {
        opcoes.push("replace(replace(replace(COALESCE(cl.cpf, cl.cnpj, ''), '.', ''), '-', ''), '/', '') LIKE ?");
        params.push(`%${termoDigitos}%`);
      }
      condicoes.push(`(${opcoes.join(' OR ')})`);
    }
    return await todos<Cliente>(`${SELECT_CLIENTE} WHERE ${condicoes.join(' AND ')} ORDER BY cl.nome COLLATE NOCASE`, ...params);
  },

  async buscar(usuarioId: number, id: number): Promise<Cliente | undefined> {
    return await um<Cliente>(`${SELECT_CLIENTE} WHERE cl.id = ? AND cl.usuario_id = ?`, id, usuarioId);
  },

  async pertenceAo(usuarioId: number, id: number): Promise<boolean> {
    return !!(await um('SELECT id FROM clientes WHERE id = ? AND usuario_id = ?', id, usuarioId));
  },

  /** CPF ou CNPJ já cadastrado para a mesma usuária? Devolve a mensagem de erro, ou null. */
  async documentoRepetido(usuarioId: number, d: DadosCliente, ignorarId = 0): Promise<string | null> {
    if (d.cpf && (await um('SELECT id FROM clientes WHERE usuario_id = ? AND cpf = ? AND id <> ?', usuarioId, d.cpf, ignorarId))) {
      return 'Já existe um cliente cadastrado com este CPF.';
    }
    if (d.cnpj && (await um('SELECT id FROM clientes WHERE usuario_id = ? AND cnpj = ? AND id <> ?', usuarioId, d.cnpj, ignorarId))) {
      return 'Já existe um cliente cadastrado com este CNPJ.';
    }
    return null;
  },

  async criar(usuarioId: number, d: DadosCliente): Promise<number> {
    return (
      await executar(
        `INSERT INTO clientes (usuario_id, ${COLUNAS.join(', ')}) VALUES (?, ${COLUNAS.map(() => '?').join(', ')})`,
        usuarioId,
        ...COLUNAS.map((c) => d[c]),
      )
    ).id;
  },

  /**
   * Atualiza o cliente e mantém o nome nos processos vinculados
   * (o nome também fica gravado no processo para buscas e para o histórico).
   */
  async atualizar(usuarioId: number, id: number, d: DadosCliente): Promise<boolean> {
    const r = await executar(
      `UPDATE clientes SET ${COLUNAS.map((c) => `${c} = ?`).join(', ')}, atualizado_em = datetime('now', 'localtime')
        WHERE id = ? AND usuario_id = ?`,
      ...COLUNAS.map((c) => d[c]),
      id,
      usuarioId,
    );
    if (r.alteracoes === 0) return false;
    await executar('UPDATE processos SET cliente = ? WHERE cliente_id = ? AND usuario_id = ?', d.nome, id, usuarioId);
    return true;
  },

  /**
   * Exclui o cliente. Os processos dele NÃO são apagados: apenas perdem o vínculo
   * e continuam com o nome gravado. (Feito explicitamente para funcionar também no Turso.)
   */
  async excluir(usuarioId: number, id: number): Promise<boolean> {
    if (!(await ClienteModel.pertenceAo(usuarioId, id))) return false;
    await executar('UPDATE processos SET cliente_id = NULL WHERE cliente_id = ? AND usuario_id = ?', id, usuarioId);
    return (await executar('DELETE FROM clientes WHERE id = ? AND usuario_id = ?', id, usuarioId)).alteracoes > 0;
  },

  /** Aniversários de hoje até daqui a "dias" dias, do mais próximo ao mais distante. */
  async aniversariantes(usuarioId: number, dataHoje: string, dias = 7): Promise<Aniversariante[]> {
    const lista = await todos<Cliente>(
      `${SELECT_CLIENTE} WHERE cl.usuario_id = ?
         AND ((cl.tipo = 'fisica' AND cl.data_nascimento IS NOT NULL)
           OR (cl.tipo = 'juridica' AND cl.representante_nascimento IS NOT NULL))`,
      usuarioId,
    );
    return lista
      .map((cliente) => ({ cliente, aniversario: proximoAniversario(dataDeAniversario(cliente), dataHoje) }))
      .filter((a): a is Aniversariante => a.aniversario !== null && a.aniversario.dias <= dias)
      .sort((a, b) => a.aniversario.dias - b.aniversario.dias || a.cliente.nome.localeCompare(b.cliente.nome));
  },
};
