import nodemailer from 'nodemailer';

/**
 * [F3] Envio de e-mails (usado pela recuperação de senha).
 * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 *
 * Configuração (variáveis de ambiente — ver backend/.env.example):
 *   SMTP_USUARIO   e-mail que envia (ex.: uma conta Gmail)
 *   SMTP_SENHA     "senha de app" do Gmail (NÃO é a senha normal da conta)
 *   SMTP_HOST      padrão smtp.gmail.com
 *   SMTP_PORTA     padrão 465 (SSL)
 *   EMAIL_REMETENTE nome/endereço exibido (opcional)
 *
 * Sem configuração:
 *   - no computador: o e-mail é mostrado no terminal da API (para testar sem enviar nada);
 *   - na Vercel: gera o erro EMAIL_NAO_CONFIGURADO (a tela mostra uma mensagem clara).
 */

export interface Email {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}

export type Enviador = (email: Email) => Promise<void>;

export class EmailNaoConfigurado extends Error {
  constructor() {
    super('EMAIL_NAO_CONFIGURADO');
  }
}

let enviadorDeTeste: Enviador | null = null;

/** Usado só pelos testes, para "capturar" os e-mails sem enviar nada. */
export function definirEnviador(enviador: Enviador | null): void {
  enviadorDeTeste = enviador;
}

export function emailConfigurado(): boolean {
  return !!(process.env.SMTP_USUARIO && process.env.SMTP_SENHA);
}

/** Envia o e-mail. Devolve "console" quando só foi mostrado no terminal (computador sem SMTP). */
export async function enviarEmail(email: Email): Promise<'enviado' | 'console'> {
  if (enviadorDeTeste) {
    await enviadorDeTeste(email);
    return 'enviado';
  }
  if (!emailConfigurado()) {
    if (process.env.VERCEL) throw new EmailNaoConfigurado();
    console.log(`\n===== E-mail (modo de teste, nada foi enviado) =====\nPara: ${email.para}\nAssunto: ${email.assunto}\n\n${email.texto}\n====================================================\n`);
    return 'console';
  }

  const porta = Number(process.env.SMTP_PORTA || 465);
  const usuario = process.env.SMTP_USUARIO!;
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: porta,
    secure: porta === 465,
    auth: { user: usuario, pass: process.env.SMTP_SENHA },
  });
  await transporte.sendMail({
    from: process.env.EMAIL_REMETENTE || `"Thamara Santana Advocacia" <${usuario}>`,
    to: email.para,
    subject: email.assunto,
    text: email.texto,
    html: email.html,
  });
  return 'enviado';
}

/** Endereço do site usado nos links dos e-mails (nunca vem da requisição, por segurança). */
export function enderecoDoSite(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:4200';
}
