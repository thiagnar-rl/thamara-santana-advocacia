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
  paragrafos: [
    'Sou advogada com atuação dedicada ao Direito de Família, Patrimônio e Sucessões. Parte essencial do meu trabalho é conduzir as conversas sobre herança enquanto as pessoas ainda podem expressar, por si mesmas, o que desejam e o que as preocupa.',
    'Antes de falar em testamento, doação ou holding, procuro compreender a realidade de cada família: quem depende da renda daquele patrimônio, quais decisões já foram tomadas e quais ficaram apenas em conversas, sem que ninguém saiba ao certo o que foi combinado.',
    'Meu papel é explicar o que a lei permite, quais são as consequências de cada escolha e o que precisa ser formalizado. Assim, a família pode decidir com clareza e segurança o destino daquilo que construiu.',
  ],
  principios: [
    { titulo: 'Escuta antes da solução', texto: 'Cada família tem sua história. O primeiro passo é entendê-la.' },
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

/** Área conduzida pela própria advogada (destaque no site). */
export const AREA_PRINCIPAL: AreaDoSite = {
  chave: 'familia',
  nome: 'Família, Patrimônio e Sucessões',
  icone: 'clientes',
  descricao: 'Atuação conduzida diretamente pela Dra. Thamara Santana, do planejamento à formalização.',
  itens: [
    'Planejamento sucessório e patrimonial',
    'Inventário e partilha, judicial e extrajudicial',
    'Testamentos e doações',
    'Holding familiar',
    'Divórcio, união estável e regime de bens',
    'Guarda, convivência e pensão alimentícia',
  ],
};

/** Áreas atendidas pela equipe do escritório. */
export const AREAS_EQUIPE: AreaDoSite[] = [
  {
    chave: 'previdenciario',
    nome: 'Previdenciário',
    icone: 'documento',
    descricao: 'Aposentadorias, benefícios por incapacidade, BPC/LOAS, pensão por morte e revisões junto ao INSS.',
  },
  {
    chave: 'trabalhista',
    nome: 'Trabalhista',
    icone: 'predio',
    descricao: 'Orientação a empregados e empregadores: rescisões, horas extras, vínculo de emprego e acordos.',
  },
  {
    chave: 'consumidor',
    nome: 'Consumidor',
    icone: 'alerta',
    descricao: 'Cobranças indevidas, negativação, planos de saúde e problemas com compras, serviços e voos.',
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
