import { CompromissoForm, ProcessoForm } from '../models';

/**
 * MODEL (regras dos formulários) — validação no navegador, antes de chamar a API.
 * Devolve a mensagem e o campo que deve ficar destacado em vermelho.
 */

export interface ResultadoValidacao<C extends string> {
  erro: string | null;
  campo: C | null;
}

const OK = { erro: null, campo: null };

export function validarCompromisso(form: Pick<CompromissoForm, 'titulo' | 'data' | 'hora'>): ResultadoValidacao<'titulo' | 'data' | 'hora'> {
  if (!form.titulo?.trim()) return { erro: 'Dê um título ao compromisso.', campo: 'titulo' };
  if (!form.data) return { erro: 'Escolha a data.', campo: 'data' };
  if (form.hora && !/^\d{2}:\d{2}$/.test(form.hora)) return { erro: 'Hora inválida.', campo: 'hora' };
  return OK;
}

/**
 * [C1] Número do processo no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos).
 * Solicitado por: Mariana Couto (teste de usuário de 29/10/2026).
 */
export const FORMATO_CNJ = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
export const MENSAGEM_NUMERO_INVALIDO =
  'Número do processo incompleto ou inválido. Use o padrão CNJ: 0000000-00.0000.0.00.0000 (20 dígitos).';

/** Posição (em dígitos) de cada separador da máscara CNJ. */
const SEPARADORES_CNJ: Record<number, string> = { 7: '-', 9: '.', 13: '.', 14: '.', 16: '.' };

/**
 * [C1] Máscara aplicada enquanto a usuária digita: mantém só os números (no máximo 20)
 * e coloca o traço e os pontos nos lugares certos. Ex.: "10023456720268260100" → "1002345-67.2026.8.26.0100".
 */
export function formatarNumeroCNJ(valor: string | null | undefined): string {
  const digitos = (valor ?? '').replace(/\D/g, '').slice(0, 20);
  let resultado = '';
  for (let i = 0; i < digitos.length; i++) {
    if (i > 0 && SEPARADORES_CNJ[i]) resultado += SEPARADORES_CNJ[i];
    resultado += digitos[i];
  }
  return resultado;
}

/** [C1] Confere se o número está completo e no formato CNJ. */
export function numeroCNJValido(valor: string | null | undefined): boolean {
  return FORMATO_CNJ.test((valor ?? '').trim());
}

export function validarProcesso(form: Pick<ProcessoForm, 'numero' | 'cliente'>): ResultadoValidacao<'numero' | 'cliente'> {
  if (!form.numero?.trim()) return { erro: 'Informe o número do processo.', campo: 'numero' };
  if (!numeroCNJValido(form.numero)) return { erro: MENSAGEM_NUMERO_INVALIDO, campo: 'numero' };
  if (!form.cliente?.trim()) return { erro: 'Informe o nome do cliente.', campo: 'cliente' };
  return OK;
}

export function validarAcesso(
  modo: 'entrar' | 'cadastro',
  dados: { nome: string; email: string; senha: string },
): string | null {
  if (modo === 'cadastro' && !dados.nome.trim()) return 'Informe seu nome.';
  if (!dados.email.trim() || !dados.senha) return 'Preencha e-mail e senha.';
  if (modo === 'cadastro' && dados.senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return null;
}
