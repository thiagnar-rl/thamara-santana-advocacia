/**
 * [F6] Funções puras para documentos e contatos brasileiros
 * (CPF, CNPJ, CEP, telefone, UF e estado civil) e para aniversários.
 * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const ESTADOS_CIVIS = [
  'Solteiro(a)', 'Casado(a)', 'União estável', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)',
] as const;

/** Mantém só os números. */
export function digitos(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '');
}

/** Todos os dígitos iguais (ex.: 111.111.111-11) — sequências inválidas. */
function repetido(d: string): boolean {
  return /^(\d)\1+$/.test(d);
}

/** CPF com dígitos verificadores corretos. */
export function cpfValido(valor: unknown): boolean {
  const d = digitos(valor);
  if (d.length !== 11 || repetido(d)) return false;
  const calcular = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce((total, n, i) => total + Number(n) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(d.slice(0, 9), 10) === Number(d[9]) && calcular(d.slice(0, 10), 11) === Number(d[10]);
}

/** CNPJ com dígitos verificadores corretos. */
export function cnpjValido(valor: unknown): boolean {
  const d = digitos(valor);
  if (d.length !== 14 || repetido(d)) return false;
  const calcular = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = [...base].reduce((total, n, i) => total + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calcular(d.slice(0, 12)) === Number(d[12]) && calcular(d.slice(0, 13)) === Number(d[13]);
}

/** "12345678909" → "123.456.789-09" */
export function formatarCPF(valor: unknown): string {
  const d = digitos(valor);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/** "11222333000181" → "11.222.333/0001-81" */
export function formatarCNPJ(valor: unknown): string {
  const d = digitos(valor);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/** CEP com 8 dígitos → "01310-100"; caso contrário, null. */
export function normalizarCEP(valor: unknown): string | null {
  const d = digitos(valor);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : null;
}

/** Telefone com DDD (10 ou 11 dígitos) → "(11) 3333-4444" / "(11) 98888-7777"; caso contrário, null. */
export function normalizarTelefone(valor: unknown): string | null {
  const d = digitos(valor);
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return null;
}

/* ---------- Aniversários ---------- */

export interface Aniversario {
  /** Data do próximo aniversário (AAAA-MM-DD), hoje incluído. */
  data: string;
  /** Dias que faltam (0 = hoje). */
  dias: number;
  /** Idade que a pessoa completa (ou anos de fundação). */
  idade: number;
}

function paraData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function paraISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

/**
 * Calcula o próximo aniversário a partir de hoje (inclusive).
 * Quem nasceu em 29/02 comemora em 28/02 nos anos que não são bissextos.
 */
export function proximoAniversario(nascimento: string | null | undefined, hojeIso: string): Aniversario | null {
  if (!nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return null;
  const [anoNasc, mes, dia] = nascimento.split('-').map(Number);
  const hoje = paraData(hojeIso);

  const naqueleAno = (ano: number) => {
    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    return new Date(ano, mes - 1, Math.min(dia, ultimoDiaDoMes));
  };

  let ano = hoje.getFullYear();
  let data = naqueleAno(ano);
  if (data < hoje) data = naqueleAno(++ano);

  return {
    data: paraISO(data),
    dias: Math.round((data.getTime() - hoje.getTime()) / 86_400_000),
    idade: ano - anoNasc,
  };
}
