/**
 * CONTEÚDO DO SITE INSTITUCIONAL
 * [F7] Solicitado por: Thamara Santana (cliente) (04/11/2026), com os dados enviados por ele.
 *
 * Para mudar um texto, telefone ou endereço do site, edite SÓ este arquivo.
 *
 * Cuidados de publicidade da advocacia (Provimento 205/2021 da OAB), seguidos aqui:
 * - texto informativo e sóbrio, com nome e número de inscrição na OAB visíveis;
 * - sem promessa de resultado, sem preços e sem comparação com outros escritórios.
 */

export const ESCRITORIO = {
  nome: 'Thamara Santana',
  subtitulo: 'Advocacia e Consultoria Jurídica',
  advogada: 'Thamara de Oliveira Santana do Carmo',
  oab: 'OAB/SP 500.770',
};

export const CONTATO = {
  /** Só números, com DDI 55 e DDD. */
  whatsapp: '5513991835059',
  whatsappExibicao: '(13) 99183-5059',
  mensagemWhatsapp: 'Olá, Dra. Thamara! Vim pelo site e gostaria de agendar um atendimento.',
  instagram: 'thamarasantana.adv',
  email: 'thamarasantana.adv@gmail.com',
  endereco: {
    linha1: 'Rua Montenegro, 587 — Sala 4',
    linha2: 'Vila Maia · Guarujá/SP',
    cep: '11410-040',
    /** Texto usado para localizar o escritório no Google Maps. */
    busca: 'Rua Montenegro, 587, Vila Maia, Guarujá - SP, 11410-040',
  },
  cidadesAtendidas: ['Guarujá', 'Santos', 'São Vicente', 'Praia Grande'],
};

export const SOBRE = {
  // [C5] Textos revistos a pedido da cliente Thamara Santana (05/11/2026): Família e Sucessões, Cível e Trabalhista
  paragrafos: [
    'Sou advogada com atuação em Direito de Família e Sucessões, Direito Civil e Direito do Trabalho. Em cada caso, o ponto de partida é ouvir com atenção: entender a história, as preocupações e o que realmente importa para quem me procura.',
    'Questões como divórcio, pensão alimentícia, reconhecimento de paternidade e inventário mexem com a vida de toda a família. Por isso, conduzo cada etapa com sensibilidade, sigilo e firmeza, do primeiro atendimento até a solução.',
    'Meu papel é explicar o que a lei permite, quais são as consequências de cada escolha e o que precisa ser formalizado. Assim, você decide com clareza e segurança o melhor caminho.',
  ],
  principios: [
    { titulo: 'Escuta antes da solução', texto: 'Cada caso tem sua história. O primeiro passo é entendê-la.' },
    { titulo: 'Clareza em cada escolha', texto: 'Explicação objetiva do que a lei permite e das consequências.' },
    { titulo: 'Formalização segura', texto: 'O que foi decidido fica registrado da forma correta.' },
  ],
};

export interface AreaDoSite {
  chave: string;
  nome: string;
  icone: string;
  descricao: string;
  itens?: string[];
}

/**
 * Áreas conduzidas pela própria advogada (destaque no site).
 * [C5] Família e Sucessões, Cível e Trabalhista — lista de especialidades enviada pela cliente Thamara Santana (04/11/2026).
 */
export const AREAS_THAMARA: AreaDoSite[] = [
  {
    chave: 'familia',
    nome: 'Família e Sucessões',
    icone: 'clientes',
    descricao: 'Questões de família tratadas com escuta, sigilo e cuidado em cada etapa.',
    itens: [
      'Divórcio consensual e litigioso',
      'Reconhecimento de paternidade',
      'Ação de alimentos (pensão): fixação, revisão e exoneração',
      'Cumprimento de sentença de alimentos, pelo rito da penhora ou da prisão',
      'Inventário e partilha de bens',
    ],
  },
  {
    chave: 'civel',
    nome: 'Cível',
    icone: 'balanca',
    descricao: 'Conflitos do dia a dia, imóveis, contratos e relações de consumo.',
    itens: [
      'Usucapião',
      'Adjudicação compulsória',
      'Indenização por dano moral e material',
      'Obrigação de fazer',
      'Direito do consumidor',
      'Contratos em geral: locação, compra e venda e outros',
    ],
  },
  {
    chave: 'trabalhista',
    nome: 'Trabalhista',
    icone: 'predio',
    descricao: 'Atuação nos dois lados da relação de trabalho.',
    itens: ['Reclamação trabalhista em favor do empregado (reclamante)', 'Defesa do empregador (reclamado)'],
  },
];

/** Áreas atendidas pela equipe do escritório. */
export const AREAS_EQUIPE: AreaDoSite[] = [
  {
    chave: 'previdenciario',
    nome: 'Previdenciário',
    icone: 'documento',
    descricao: 'Aposentadorias, benefícios por incapacidade, BPC/LOAS, pensão por morte e revisões junto ao INSS.',
  },
  {
    chave: 'criminal',
    nome: 'Criminal',
    icone: 'tribunal',
    descricao: 'Acompanhamento em inquéritos e processos criminais, audiências e defesa técnica em todas as fases.',
  },
];

/** Etapas do atendimento. */
export const ETAPAS = [
  { titulo: 'Primeiro contato', texto: 'Pelo WhatsApp, Instagram ou e-mail, você conta brevemente o que precisa.' },
  { titulo: 'Reunião de orientação', texto: 'Presencial no escritório em Guarujá ou online, para entender o caso com calma.' },
  { titulo: 'Caminho definido', texto: 'Você recebe a explicação das alternativas e decide, com clareza, como seguir.' },
];

export const AVISO_LEGAL =
  'O conteúdo deste site é informativo e não substitui a orientação jurídica individualizada. Consulte um advogado de sua confiança.';
