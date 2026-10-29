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

export function validarProcesso(form: Pick<ProcessoForm, 'numero' | 'cliente'>): ResultadoValidacao<'numero' | 'cliente'> {
  if (!form.numero?.trim()) return { erro: 'Informe o número do processo.', campo: 'numero' };
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
