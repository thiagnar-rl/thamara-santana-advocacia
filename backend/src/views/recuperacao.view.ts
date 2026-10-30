import { Email } from '../utils/email';
import { VALIDADE_MINUTOS } from '../models/recuperacao.model';

/**
 * VIEW — E-mail de recuperação de senha e mensagens da tela.
 * [F3] Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */

/** Resposta sempre igual, exista ou não a conta (não revela quais e-mails estão cadastrados). */
export const MENSAGEM_PEDIDO_RECEBIDO =
  'Se este e-mail estiver cadastrado, você vai receber em instantes um link para criar uma nova senha. Confira também a caixa de spam.';

export const MENSAGEM_LINK_INVALIDO = 'Este link é inválido ou já expirou. Peça um novo link em "Esqueci minha senha".';

export const MENSAGEM_EMAIL_NAO_CONFIGURADO =
  'O envio de e-mails ainda não foi configurado no servidor. Fale com o responsável pelo sistema.';

function escapar(texto: string): string {
  return texto.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function emailRecuperacaoView(nome: string, para: string, link: string): Email {
  const primeiroNome = nome.trim().split(/\s+/)[0] || nome;
  const texto = [
    `Olá, ${primeiroNome}!`,
    '',
    'Recebemos um pedido para criar uma nova senha no sistema Thamara Santana Advocacia.',
    'Para continuar, abra o link abaixo:',
    '',
    link,
    '',
    `O link vale por ${VALIDADE_MINUTOS} minutos e só pode ser usado uma vez.`,
    'Se não foi você quem pediu, ignore este e-mail: sua senha atual continua valendo.',
  ].join('\n');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2d2c33">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;color:#a9843f">THAMARA SANTANA</p>
    <p style="margin:0 0 24px;font-size:11px;letter-spacing:1px;color:#918e98">ADVOCACIA E CONSULTORIA JURÍDICA</p>
    <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;color:#1d1c21">Criar uma nova senha</h2>
    <p>Olá, ${escapar(primeiroNome)}!</p>
    <p>Recebemos um pedido para criar uma nova senha no sistema. Clique no botão abaixo para continuar:</p>
    <p style="margin:28px 0">
      <a href="${escapar(link)}" style="background:#1d1c21;color:#ffffff;padding:12px 22px;border-radius:9px;text-decoration:none;font-weight:bold">Criar nova senha</a>
    </p>
    <p style="font-size:13px;color:#5e5c66">O link vale por ${VALIDADE_MINUTOS} minutos e só pode ser usado uma vez.<br>
    Se não foi você quem pediu, ignore este e-mail: sua senha atual continua valendo.</p>
    <p style="font-size:12px;color:#918e98;word-break:break-all">Se o botão não funcionar, copie e cole no navegador:<br>${escapar(link)}</p>
  </div>`;

  return { para, assunto: 'Criar nova senha — Thamara Santana Advocacia', texto, html };
}
