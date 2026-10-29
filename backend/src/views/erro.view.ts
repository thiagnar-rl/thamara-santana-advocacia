/**
 * VIEW — Erros
 * Formato padrão das mensagens de erro: { "erro": "texto para a usuária" }
 */
export function erroView(mensagem: string) {
  return { erro: mensagem };
}
