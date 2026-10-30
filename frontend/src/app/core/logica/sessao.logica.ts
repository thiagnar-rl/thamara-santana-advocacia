/**
 * MODEL (regras da sessão) — funções puras, testadas em frontend/tests.
 *
 * [C2] Confirmar antes de sair do sistema.
 * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026) — cliente 3 na ordem de testes.
 * Problema relatado: o botão "Sair" desconectava na hora, sem perguntar; ao clicar sem querer,
 * ela perdeu um compromisso que estava preenchendo.
 */

export interface PerguntaSaida {
  titulo: string;
  mensagem: string;
  detalhe?: string;
  botao: string;
}

/** Monta a pergunta exibida ao clicar em "Sair". */
export function perguntaSaida(formularioAberto: boolean): PerguntaSaida {
  return {
    titulo: 'Sair do sistema?',
    mensagem: 'Você precisará entrar novamente com seu e-mail e senha.',
    detalhe: formularioAberto
      ? 'Há um formulário aberto. O que não foi salvo será perdido.'
      : undefined,
    botao: 'Sair',
  };
}
