import { CONTATO, ESCRITORIO } from '../conteudo';

/**
 * POLÍTICA DE PRIVACIDADE (texto da página /privacidade)
 * [F9] Solicitado por: Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna.
 * Também é o link informado ao Google na tela de autorização (Google Agenda e Google Drive, F8 e F1).
 *
 * Para mudar o texto, edite SÓ este arquivo. Lembre de trocar a data em ATUALIZADA_EM.
 */

export const ATUALIZADA_EM = '05/11/2026';

export interface SecaoPolitica {
  /** Âncora da seção (ex.: /privacidade#google). */
  id: string;
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
}

export const POLITICA: SecaoPolitica[] = [
  {
    id: 'quem-somos',
    titulo: '1. Quem é responsável pelos seus dados',
    paragrafos: [
      `Este site e o sistema interno do escritório pertencem a ${ESCRITORIO.advogada} (${ESCRITORIO.oab}), que atua como controladora dos dados pessoais, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).`,
      `Endereço: ${CONTATO.endereco.linha1}, ${CONTATO.endereco.linha2}, CEP ${CONTATO.endereco.cep}. Contato sobre privacidade: ${CONTATO.email}.`,
    ],
  },
  {
    id: 'site',
    titulo: '2. Visitantes do site',
    paragrafos: [
      'O site é informativo. Ele não tem formulários, não pede cadastro e não usa ferramentas de publicidade ou de rastreamento de visitantes.',
      'Quando você entra em contato pelo WhatsApp, pelo Instagram ou por e-mail, recebemos as informações que você mesmo envia (como nome, telefone e o relato do caso), apenas para responder e, se for o caso, iniciar o atendimento. Essas conversas também seguem as políticas de privacidade de cada aplicativo.',
    ],
  },
  {
    id: 'terceiros',
    titulo: '3. Serviços de terceiros usados no site',
    itens: [
      'Vercel: hospedagem do site. Registra dados técnicos de acesso (como endereço IP e navegador) para segurança e funcionamento.',
      'Google Maps: mapa do escritório na seção Contato. O Google pode usar cookies próprios ao exibir o mapa.',
      'Google Fonts: fontes usadas no visual do site.',
      'Notícias: os resumos da aba Notícias levam a sites de terceiros (tribunais e portais jurídicos), que têm suas próprias políticas.',
    ],
  },
  {
    id: 'clientes',
    titulo: '4. Clientes do escritório',
    paragrafos: [
      'Para prestar os serviços de advocacia, o escritório registra, em sistema próprio de acesso restrito, dados de clientes e de processos: identificação (nome, CPF ou CNPJ, RG), contato, endereço, informações dos processos, compromissos e documentos enviados.',
      'Esses dados são tratados para a execução do contrato de prestação de serviços, o cumprimento de obrigações legais e o exercício regular de direitos em processos (art. 7º, incisos II, V e VI, e art. 11 da LGPD), sempre sob o sigilo profissional previsto no Estatuto da Advocacia (Lei nº 8.906/1994).',
    ],
  },
  {
    id: 'google',
    titulo: '5. Integração com Google Agenda e Google Drive',
    paragrafos: [
      'O sistema interno pode ser ligado, pela própria advogada, à conta Google do escritório. Com essa autorização, o sistema:',
    ],
    itens: [
      'Google Agenda: cria, altera e exclui na agenda do escritório os compromissos cadastrados no sistema, e lê os eventos da agenda para exibi-los no sistema.',
      'Google Drive: guarda os documentos anexados aos cadastros numa pasta do próprio Drive do escritório. O sistema só acessa os arquivos que ele mesmo criou, e não enxerga os demais arquivos da conta.',
      'Os dados recebidos das APIs do Google são usados somente para essas funções. Não são vendidos, não são compartilhados com terceiros, não são usados para publicidade e não são usados para treinar modelos de inteligência artificial. O uso segue a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de uso limitado.',
      'A autorização pode ser retirada a qualquer momento, no botão "Desconectar" do sistema ou em myaccount.google.com/permissions.',
    ],
  },
  {
    id: 'seguranca',
    titulo: '6. Como os dados são protegidos',
    itens: [
      'Conexão sempre criptografada (HTTPS).',
      'Acesso ao sistema somente com login. As senhas são guardadas de forma irreversível (criptografia bcrypt).',
      'A autorização do Google fica guardada cifrada (AES-256).',
      'O navegador de quem usa o sistema guarda apenas a sessão de login. O site público não grava cookies próprios.',
    ],
  },
  {
    id: 'prazo',
    titulo: '7. Por quanto tempo os dados são guardados',
    paragrafos: [
      'Os dados de clientes ficam guardados enquanto durar a prestação de serviços e, depois, pelo prazo necessário para cumprir obrigações legais e para a defesa de direitos, observados os prazos de prescrição. Mensagens de quem apenas fez contato e não se tornou cliente são descartadas quando deixam de ser necessárias.',
    ],
  },
  {
    id: 'direitos',
    titulo: '8. Seus direitos',
    paragrafos: [`Pela LGPD (art. 18), você pode pedir, pelo e-mail ${CONTATO.email}:`],
    itens: [
      'confirmação de que tratamos seus dados e acesso a eles;',
      'correção de dados incompletos, inexatos ou desatualizados;',
      'anonimização, bloqueio ou eliminação de dados desnecessários;',
      'informação sobre com quem os dados foram compartilhados;',
      'revogação do consentimento, quando ele for a base do tratamento.',
    ],
  },
  {
    id: 'alteracoes',
    titulo: '9. Alterações desta política',
    paragrafos: [
      'Esta política pode ser atualizada para refletir mudanças no site, no sistema ou na lei. A data da última atualização aparece no topo da página. Em caso de dúvida, fale com o escritório pelo e-mail ou pelo WhatsApp.',
    ],
  },
];
