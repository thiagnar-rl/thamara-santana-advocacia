import { Aniversario, Cliente, ClienteForm, TipoPessoa } from '../models';

/**
 * MODEL (regras da tela de Clientes) — funções puras, testadas em frontend/tests.
 * [F6] Cadastro individual de clientes com aviso de aniversário.
 * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */

export const TIPOS_PESSOA: { valor: TipoPessoa; rotulo: string; curto: string }[] = [
  { valor: 'fisica', rotulo: 'Pessoa física', curto: 'PF' },
  { valor: 'juridica', rotulo: 'Pessoa jurídica', curto: 'PJ' },
];

export const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'União estável', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)'];

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/** Formulário em branco. */
export function clienteVazio(tipo: TipoPessoa = 'fisica'): ClienteForm {
  return {
    tipo,
    nome: '',
    nacionalidade: tipo === 'fisica' ? 'brasileira' : null,
    estado_civil: null,
    profissao: null,
    rg: null,
    cpf: null,
    data_nascimento: null,
    nome_fantasia: null,
    cnpj: null,
    inscricao_estadual: null,
    inscricao_municipal: null,
    ramo_atuacao: null,
    representante_nome: null,
    representante_cpf: null,
    representante_cargo: null,
    representante_nascimento: null,
    cep: null,
    logradouro: null,
    endereco_numero: null,
    complemento: null,
    bairro: null,
    cidade: null,
    uf: null,
    telefone: null,
    celular: null,
    whatsapp: null,
    email: null,
    observacoes: null,
  };
}

/** Copia só os campos do formulário a partir de um cliente salvo. */
export function formDoCliente(c: Cliente): ClienteForm {
  const form = clienteVazio(c.tipo);
  for (const chave of Object.keys(form) as (keyof ClienteForm)[]) {
    (form as unknown as Record<string, unknown>)[chave] = c[chave] ?? null;
  }
  return form;
}

/* ---------- Máscaras (aplicadas enquanto a usuária digita) ---------- */

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Encaixa os dígitos num modelo, ex.: "000.000.000-00". */
function aplicarModelo(valor: string | null | undefined, modelo: string): string {
  const d = somenteDigitos(valor);
  let resultado = '';
  let i = 0;
  for (const caractere of modelo) {
    if (i >= d.length) break;
    if (caractere === '0') resultado += d[i++];
    else resultado += caractere;
  }
  return resultado;
}

export const mascaraCPF = (v: string | null | undefined) => aplicarModelo(v, '000.000.000-00');
export const mascaraCNPJ = (v: string | null | undefined) => aplicarModelo(v, '00.000.000/0000-00');
export const mascaraCEP = (v: string | null | undefined) => aplicarModelo(v, '00000-000');

/** Fixo "(11) 3333-4444" ou celular "(11) 98888-7777", conforme a quantidade de dígitos. */
export function mascaraTelefone(valor: string | null | undefined): string {
  const d = somenteDigitos(valor);
  return aplicarModelo(d, d.length > 10 ? '(00) 00000-0000' : '(00) 0000-00000');
}

/* ---------- Validações ---------- */

export function cpfValido(valor: string | null | undefined): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calcular = (base: string, peso: number) => {
    const soma = [...base].reduce((t, n, i) => t + Number(n) * (peso - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(d.slice(0, 9), 10) === Number(d[9]) && calcular(d.slice(0, 10), 11) === Number(d[10]);
}

export function cnpjValido(valor: string | null | undefined): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calcular = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = [...base].reduce((t, n, i) => t + Number(n) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calcular(d.slice(0, 12)) === Number(d[12]) && calcular(d.slice(0, 13)) === Number(d[13]);
}

export type CampoCliente = keyof ClienteForm;

/** Confere o formulário antes de enviar. Devolve a mensagem e o campo que fica em vermelho. */
export function validarCliente(form: ClienteForm, hojeIso: string): { erro: string | null; campo: CampoCliente | null } {
  const falha = (erro: string, campo: CampoCliente) => ({ erro, campo });
  const pj = form.tipo === 'juridica';

  if (!form.nome?.trim()) return falha(pj ? 'Informe a razão social.' : 'Informe o nome completo.', 'nome');
  if (!pj && form.cpf && !cpfValido(form.cpf)) return falha('CPF inválido. Confira os 11 números.', 'cpf');
  if (pj && form.cnpj && !cnpjValido(form.cnpj)) return falha('CNPJ inválido. Confira os 14 números.', 'cnpj');
  if (pj && form.representante_cpf && !cpfValido(form.representante_cpf)) {
    return falha('CPF do representante legal inválido.', 'representante_cpf');
  }
  const nascimento = pj ? form.representante_nascimento : form.data_nascimento;
  if (nascimento && nascimento > hojeIso) {
    return falha('A data de nascimento não pode ser no futuro.', pj ? 'representante_nascimento' : 'data_nascimento');
  }
  if (form.cep && somenteDigitos(form.cep).length !== 8) return falha('CEP incompleto. Use 8 números.', 'cep');
  for (const [campo, rotulo] of [['telefone', 'Telefone fixo'], ['celular', 'Celular'], ['whatsapp', 'WhatsApp']] as const) {
    const n = somenteDigitos(form[campo]).length;
    if (form[campo] && n !== 10 && n !== 11) return falha(`${rotulo} incompleto. Informe DDD + número.`, campo);
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return falha('E-mail inválido.', 'email');
  return { erro: null, campo: null };
}

/* ---------- Apresentação ---------- */

/** CPF (PF) ou CNPJ (PJ) para mostrar no cartão. */
export function documentoPrincipal(c: Pick<Cliente, 'tipo' | 'cpf' | 'cnpj'>): string | null {
  return c.tipo === 'juridica' ? c.cnpj : c.cpf;
}

/** "Hoje 🎂", "Amanhã", "em 3 dias". */
export function textoAniversario(a: Aniversario | null | undefined): string {
  if (!a) return '';
  if (a.dias === 0) return 'Hoje';
  if (a.dias === 1) return 'Amanhã';
  return `em ${a.dias} dias`;
}

/** Aniversário dentro da janela de aviso (padrão: próximos 7 dias)? */
export function aniversarioProximo(a: Aniversario | null | undefined, dias = 7): boolean {
  return !!a && a.dias <= dias;
}

/** Link para abrir uma conversa no WhatsApp (com o 55 do Brasil). */
export function linkWhatsApp(numero: string | null | undefined, mensagem?: string): string | null {
  const d = somenteDigitos(numero);
  if (d.length < 10) return null;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  return `https://wa.me/55${d}${texto}`;
}

/** Endereço em uma linha: "Av. Paulista, 1000 · Apto 12 · Bela Vista · São Paulo/SP · CEP 01310-100". */
export function enderecoCompleto(c: Partial<ClienteForm>): string {
  const rua = [c.logradouro, c.endereco_numero].filter(Boolean).join(', ');
  const cidade = [c.cidade, c.uf].filter(Boolean).join('/');
  return [rua, c.complemento, c.bairro, cidade, c.cep ? `CEP ${c.cep}` : null].filter(Boolean).join(' · ');
}

/** Procura um cliente cadastrado pelo nome digitado (sem diferenciar maiúsculas/acentos). */
export function encontrarClientePorNome<T extends { nome: string }>(lista: T[], nome: string | null | undefined): T | null {
  const normalizar = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
  const alvo = normalizar(nome ?? '');
  if (!alvo) return null;
  return lista.find((c) => normalizar(c.nome) === alvo) ?? null;
}
