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
  /** [F11] Endereço da página da área: /atuacao/<slug>. */
  slug: string;
  /** [F11] Texto de apresentação da página da área. */
  apresentacao: string[];
  /** [F11] Áreas das perguntas frequentes mostradas na página (ver PERGUNTAS). */
  areasPerguntas: string[];
}

/**
 * Áreas conduzidas pela própria advogada (destaque no site).
 * [C5] Família e Sucessões, Cível e Trabalhista — lista de especialidades enviada pela cliente Thamara Santana (04/11/2026).
 */
export const AREAS_THAMARA: AreaDoSite[] = [
  {
    chave: 'familia',
    slug: 'familia-e-sucessoes',
    apresentacao: [
      'O Direito de Família cuida das relações mais próximas da vida de cada pessoa: casamento e união estável, filhos, pensão alimentícia e herança. São questões que envolvem emoções e decisões importantes, e por isso pedem escuta, sigilo e orientação clara.',
      'A Dra. Thamara conduz pessoalmente esses casos. Sempre que possível, busca primeiro a solução consensual, em cartório ou por acordo homologado, e atua na Justiça quando necessário.',
    ],
    areasPerguntas: ['Família', 'Sucessões'],
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
    slug: 'civel',
    apresentacao: [
      'O Direito Civil trata dos conflitos do dia a dia: imóveis, contratos, cobranças, danos e relações de consumo.',
      'Da usucapião que regulariza o imóvel da família à indenização por um dano sofrido, cada caso começa pela análise dos documentos e pela explicação das alternativas, inclusive as soluções fora da Justiça.',
    ],
    areasPerguntas: ['Cível'],
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
    slug: 'trabalhista',
    apresentacao: [
      'A Dra. Thamara atua nos dois lados da relação de trabalho: na defesa do empregado que teve direitos desrespeitados e na defesa do empregador acionado na Justiça do Trabalho.',
      'Os prazos trabalhistas são curtos (2 anos depois do fim do contrato), por isso buscar orientação logo no início faz diferença.',
    ],
    areasPerguntas: ['Trabalhista'],
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
    slug: 'previdenciario',
    apresentacao: [
      'Pedidos e revisões junto ao INSS exigem atenção a documentos, prazos e regras que mudaram muito nos últimos anos.',
      'Os casos previdenciários são atendidos pela equipe do escritório, com profissionais que acompanham a área no dia a dia.',
    ],
    areasPerguntas: [],
    nome: 'Previdenciário',
    icone: 'documento',
    descricao: 'Aposentadorias, benefícios por incapacidade, BPC/LOAS, pensão por morte e revisões junto ao INSS.',
    itens: [
      'Aposentadorias por idade, por tempo de contribuição e especial',
      'Benefícios por incapacidade (auxílio e aposentadoria)',
      'BPC/LOAS para idosos e pessoas com deficiência',
      'Pensão por morte',
      'Revisão de benefícios',
    ],
  },
  {
    chave: 'criminal',
    slug: 'criminal',
    apresentacao: [
      'Em um inquérito ou processo criminal, cada etapa conta: o depoimento na delegacia, a audiência de custódia, as provas e a defesa no processo.',
      'Os casos criminais são atendidos pela equipe do escritório, com atuação desde a fase policial até o julgamento.',
    ],
    areasPerguntas: ['Criminal'],
    nome: 'Criminal',
    icone: 'tribunal',
    descricao: 'Acompanhamento em inquéritos e processos criminais, audiências e defesa técnica em todas as fases.',
    itens: [
      'Acompanhamento em depoimentos e inquéritos policiais',
      'Audiência de custódia e pedidos de liberdade',
      'Defesa em processos criminais',
      'Acordo de não persecução penal (ANPP)',
      'Medidas protetivas da Lei Maria da Penha',
    ],
  },
];

/** Etapas do atendimento. */
export const ETAPAS = [
  { titulo: 'Primeiro contato', texto: 'Pelo WhatsApp, Instagram ou e-mail, você conta brevemente o que precisa.' },
  { titulo: 'Reunião de orientação', texto: 'Presencial no escritório em Guarujá ou online, para entender o caso com calma.' },
  { titulo: 'Caminho definido', texto: 'Você recebe a explicação das alternativas e decide, com clareza, como seguir.' },
];

/**
 * Perguntas frequentes (seção da página inicial).
 * [F10] Solicitado por: Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna.
 * Texto informativo e geral (Provimento 205/2021 da OAB): sem promessa de resultado nem análise de caso concreto.
 * Para mudar uma pergunta, edite só esta lista.
 * A ordem segue a relevância (dúvidas mais procuradas primeiro), como pedido pela cliente.
 */
export interface PerguntaFrequente {
  area: string;
  pergunta: string;
  resposta: string[];
}

export const PERGUNTAS: PerguntaFrequente[] = [
  {
    area: 'Família',
    pergunta: 'Como é definido o valor da pensão alimentícia?',
    resposta: [
      'Não existe um percentual fixo previsto em lei. O valor é definido pelo equilíbrio entre a necessidade de quem recebe e a possibilidade de quem paga (art. 1.694 do Código Civil).',
      'Se a situação de qualquer um dos dois mudar (perda de emprego, aumento de renda, novas despesas), é possível pedir a revisão do valor, para mais ou para menos.',
    ],
  },
  {
    area: 'Família',
    pergunta: 'O que acontece se a pensão não for paga?',
    resposta: [
      'Quem recebe pode cobrar na Justiça pelo cumprimento de sentença. Pelo rito da prisão, que vale para as três últimas parcelas vencidas antes da cobrança e as que vencerem durante o processo, o devedor pode ter a prisão civil decretada por 1 a 3 meses.',
      'Pelo rito da penhora, é possível bloquear contas, salário e bens. O nome do devedor também pode ser protestado e incluído em cadastros de inadimplentes.',
    ],
  },
  {
    area: 'Família',
    pergunta: 'Preciso de advogado para me divorciar? Dá para fazer em cartório?',
    resposta: [
      'Sim, a presença de advogado é obrigatória tanto no divórcio judicial quanto no feito em cartório.',
      'Quando o casal está de acordo sobre tudo (partilha, nome e, havendo filhos, guarda, convivência e pensão), o divórcio pode ser feito por escritura pública em cartório, de forma mais rápida. Se houver filhos menores ou incapazes, as questões referentes a eles precisam ter sido resolvidas antes na Justiça. Quando não há acordo, o divórcio é litigioso e segue pelo Judiciário.',
    ],
  },
  {
    area: 'Trabalhista',
    pergunta: 'Fui demitido por justa causa. Quais direitos eu perco?',
    resposta: [
      'Na justa causa, o trabalhador recebe apenas o saldo de salário e as férias vencidas com o adicional de 1/3. Perde o aviso prévio, o 13º e as férias proporcionais, a multa de 40% do FGTS, o saque do FGTS e o seguro-desemprego.',
      'A justa causa precisa estar entre os motivos previstos no art. 482 da CLT e ser comprovada pela empresa. Quando é aplicada sem motivo grave ou sem provas, pode ser revertida na Justiça do Trabalho, garantindo as verbas da demissão sem justa causa.',
    ],
  },
  {
    area: 'Trabalhista',
    pergunta: 'Trabalho sem carteira assinada. Tenho direitos?',
    resposta: [
      'Sim. Se o trabalho é feito pessoalmente, com frequência, mediante salário e sob ordens de alguém, existe vínculo de emprego (art. 3º da CLT), mesmo sem registro.',
      'Na Justiça, é possível pedir o reconhecimento do vínculo e, com ele, a anotação na carteira, FGTS, férias, 13º e contribuições ao INSS do período. Mensagens, comprovantes de pagamento e testemunhas ajudam a provar a relação.',
    ],
  },
  {
    area: 'Sucessões',
    pergunta: 'O inventário é obrigatório? Existe prazo para abrir?',
    resposta: [
      'Sim. Sem o inventário, os bens de quem faleceu não podem ser transferidos, vendidos ou regularizados em nome dos herdeiros.',
      'A lei prevê que o inventário seja aberto em até 2 meses a contar do falecimento (art. 611 do CPC). Em São Paulo, o atraso gera multa sobre o imposto de transmissão (ITCMD). Quando os herdeiros estão de acordo, o inventário pode ser feito em cartório, inclusive, cumpridas algumas condições, quando há herdeiro menor de idade.',
    ],
  },
  {
    area: 'Família',
    pergunta: 'A pensão acaba automaticamente quando o filho faz 18 anos?',
    resposta: [
      'Não. A maioridade não encerra a pensão de forma automática: quem paga precisa pedir a exoneração na Justiça, e o filho tem a oportunidade de se manifestar (Súmula 358 do STJ).',
      'Os tribunais costumam manter a pensão, por exemplo, enquanto o filho estiver cursando faculdade ou curso técnico, em geral até os 24 anos, conforme o caso.',
    ],
  },
  {
    area: 'Trabalhista',
    pergunta: 'Qual é o prazo para entrar com uma ação trabalhista?',
    resposta: [
      'O trabalhador tem até 2 anos depois do fim do contrato para entrar com a ação e pode cobrar os direitos dos últimos 5 anos trabalhados (art. 7º, XXIX, da Constituição).',
      'Por isso, vale buscar orientação logo após a demissão, reunindo documentos como carteira de trabalho, holerites, extratos do FGTS e mensagens.',
    ],
  },
  {
    area: 'Trabalhista',
    pergunta: 'Faço hora extra e não recebo. O que posso fazer?',
    resposta: [
      'A jornada normal é de até 8 horas por dia e 44 por semana. O que passar disso deve ser pago com adicional de, no mínimo, 50% (art. 7º, XVI, da Constituição), salvo acordo válido de banco de horas ou compensação.',
      'As horas não pagas podem ser cobradas na Justiça, com reflexos em férias, 13º e FGTS. Anotações de horário, cartões de ponto, mensagens e registros de acesso ao sistema servem como prova.',
    ],
  },
  {
    area: 'Criminal',
    pergunta: 'Alguém da minha família foi preso em flagrante. O que acontece agora?',
    resposta: [
      'A pessoa presa deve ser levada a um juiz em até 24 horas, na audiência de custódia (art. 310 do Código de Processo Penal). Nela, o juiz verifica se a prisão foi legal e decide se a pessoa responde em liberdade, com ou sem fiança e outras medidas, ou se a prisão continua.',
      'O preso tem direito de avisar a família e de ser assistido por advogado desde o início. A atuação rápida da defesa faz diferença nessa fase.',
    ],
  },
  {
    area: 'Criminal',
    pergunta: 'Como pedir medida protetiva pela Lei Maria da Penha?',
    resposta: [
      'A vítima de violência doméstica pode pedir medida protetiva na delegacia (de preferência na Delegacia da Mulher), ao Ministério Público, à Defensoria Pública ou por meio de advogado. O juiz deve decidir em até 48 horas (art. 18 da Lei 11.340/2006).',
      'As medidas podem incluir o afastamento do agressor do lar e a proibição de se aproximar ou manter contato. Descumprir a medida protetiva é crime. Em situação de emergência, ligue 190; a Central de Atendimento à Mulher é o 180.',
    ],
  },
  {
    area: 'Criminal',
    pergunta: 'Fui intimado para depor na delegacia. Preciso ir com advogado?',
    resposta: [
      'Não é obrigatório, mas é recomendável, principalmente quando a pessoa é chamada como investigada. A Constituição garante o direito de permanecer em silêncio (art. 5º, LXIII), e o advogado pode acompanhar o depoimento e ter acesso aos autos do inquérito.',
      'Quem é chamado como testemunha tem o dever de dizer a verdade. Em qualquer caso, é importante comparecer na data marcada ou justificar a ausência.',
    ],
  },
  {
    area: 'Trabalhista',
    pergunta: 'Posso fazer um acordo com a empresa para sair do emprego?',
    resposta: [
      'Sim. Desde a Reforma Trabalhista, existe a rescisão por acordo (art. 484-A da CLT): o trabalhador recebe metade do aviso prévio indenizado, multa de 20% sobre o FGTS e pode sacar até 80% do saldo, além das demais verbas.',
      'Nessa modalidade não há direito ao seguro-desemprego. Antes de assinar, vale conferir os cálculos.',
    ],
  },
  {
    area: 'Cível',
    pergunta: 'Moro há muitos anos num imóvel sem escritura. Posso regularizar por usucapião?',
    resposta: [
      'Pode ser possível. A usucapião reconhece a propriedade de quem tem a posse do imóvel de forma contínua, sem oposição e como se fosse dono, por um prazo que varia de 2 a 15 anos, conforme a modalidade e a situação.',
      'O pedido pode ser feito na Justiça ou, em muitos casos, diretamente no cartório de registro de imóveis. A análise dos documentos e do tempo de posse define o melhor caminho.',
    ],
  },
  {
    area: 'Família',
    pergunta: 'Como funciona o reconhecimento de paternidade?',
    resposta: [
      'Quando o pai concorda, o reconhecimento pode ser feito diretamente no cartório de registro civil, sem processo.',
      'Se houver resistência, é possível entrar com ação de investigação de paternidade, em que normalmente se faz o exame de DNA. O reconhecimento garante ao filho direitos como nome, pensão alimentícia e herança.',
    ],
  },
  {
    area: 'Criminal',
    pergunta: 'O que é o acordo de não persecução penal (ANPP)?',
    resposta: [
      'É um acordo com o Ministério Público que evita o processo criminal em crimes sem violência ou grave ameaça, com pena mínima menor que 4 anos (art. 28-A do Código de Processo Penal). A pessoa confessa o fato e cumpre condições, como prestar serviços à comunidade ou pagar um valor.',
      'Cumprido o acordo, o caso é encerrado e não gera antecedentes criminais. O ANPP não se aplica, por exemplo, a casos de violência doméstica ou a quem já recebeu benefício semelhante nos últimos 5 anos.',
    ],
  },
];

/** [F10] Áreas usadas nos filtros das perguntas frequentes, das mais procuradas para as menos. */
export const AREAS_PERGUNTAS = ['Família', 'Trabalhista', 'Criminal', 'Sucessões', 'Cível'];

export const AVISO_LEGAL =
  'O conteúdo deste site é informativo e não substitui a orientação jurídica individualizada. Consulte um advogado de sua confiança.';

/** [F11] Todas as áreas do site (Dra. Thamara + equipe), para as páginas /atuacao/<slug>. */
export const TODAS_AS_AREAS: AreaDoSite[] = [...AREAS_THAMARA, ...AREAS_EQUIPE];
