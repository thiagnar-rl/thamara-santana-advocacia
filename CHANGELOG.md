# Histórico de alterações

Todas as mudanças do sistema **Thamara Santana Advocacia e Consultoria Jurídica** ficam registradas aqui.
Cada item traz o **código do pedido**, **quem pediu** e o link para a ficha completa em [`docs/solicitacoes/`](docs/solicitacoes/README.md).

Numeração de versões: `MAIOR.MENOR.CORREÇÃO`. Por exemplo, `1.0.1` é uma correção na versão `1.0`.

---

## [1.7.0] — 05/11/2026

### Adicionado

- **[F9] Política de Privacidade.** O site tem a página `/privacidade`, com índice e 9 seções baseadas na LGPD e nas regras do Google para Agenda e Drive. O link aparece no rodapé. É esse o link que vai cadastrado na tela de autorização do Google.
  - **Solicitado por:** Thamara Santana (cliente), pedido de 05/11/2026
  - **Ramo:** `melhoria/F9-politica-de-privacidade`
  - **Ficha:** [docs/solicitacoes/F9-politica-de-privacidade.md](docs/solicitacoes/F9-politica-de-privacidade.md)

---

## [1.6.2] — 05/11/2026

### Corrigido

- **[C5] Site: áreas de atuação e fotos novas.**
  - A "Atuação da Dra. Thamara" passou a ter três áreas: **Família e Sucessões**, **Cível** e **Trabalhista**, com as especialidades enviadas pela cliente.
  - "Família, Patrimônio e Sucessões" virou **"Família e Sucessões"** em todo o site.
  - A foto da seção "Sobre mim" foi trocada pelas duas fotos novas.
  - A equipe ficou com Previdenciário e Criminal.
  - **Solicitado por:** Thamara Santana (cliente), pedido de 05/11/2026
  - **Ramo:** `correcao/C5-areas-de-atuacao-e-fotos`
  - **Ficha:** [docs/solicitacoes/C5-areas-de-atuacao-e-fotos.md](docs/solicitacoes/C5-areas-de-atuacao-e-fotos.md)

---

## [1.6.1] — 05/11/2026

### Documentação

- **README reorganizado.** Agora tem a seção "Quem é quem" (Thamara Santana como cliente e autora das solicitações; Thiago Rinaldi Luna como desenvolvedor), o resumo de todas as solicitações atendidas, as variáveis do Google, os scripts de publicação e as dicas de problemas comuns.
- **Fichas e histórico atualizados.** As solicitações C4, F1, F4, F7 e F8 aparecem como pedidos da cliente Thamara Santana, repassados pelo desenvolvedor. As fichas C4, F1, F4 e F8 foram marcadas como publicadas em 05/11/2026.
- **Marcas no código.** Os comentários `[C4]`, `[F1]`, `[F4]`, `[F7]` e `[F8]` passam a citar a cliente como solicitante. Nenhuma mudança de funcionamento.
  - **Ramo:** `docs/readme-e-solicitacoes`

---

## [1.6.0] — 05/11/2026

### Adicionado

- **[F1] Anexar documentos no Google Drive.** As fichas do processo e do cliente e o formulário do compromisso agora têm o quadro **Documentos**, com o botão **Anexar** (vários arquivos, até 50 MB cada). Os arquivos ficam no Google Drive da Thamara, na pasta "Thamara Santana Advocacia". Excluir manda o arquivo para a lixeira do Drive, e as fichas impressas listam os documentos.
  - **Solicitado por:** Thamara Santana (cliente) (pedido de 04/11/2026); o código F1 já estava reservado na planilha de testes de 29/10
  - **Ramo:** `melhoria/F1-anexos-google-drive`
  - **Ficha:** [docs/solicitacoes/F1-anexos-google-drive.md](docs/solicitacoes/F1-anexos-google-drive.md)

---

## [1.5.0] — 05/11/2026

### Adicionado

- **[F8] Agenda ligada à Google Agenda, nos dois sentidos.** O que é criado, alterado, concluído ou excluído no sistema vai na hora para a Google Agenda da Thamara. O que muda no Google (celular, Gmail) volta para o sistema ao abrir, a cada 5 minutos ou no botão **Sincronizar agora**. Eventos criados no Google entram com o tipo novo **Outro**.
  - **Solicitado por:** Thamara Santana (cliente) (pedido de 04/11/2026)
  - **Ramo:** `melhoria/F8-google-agenda`
  - **Ficha:** [docs/solicitacoes/F8-google-agenda.md](docs/solicitacoes/F8-google-agenda.md)

---

## [1.4.0] — 04/11/2026

### Adicionado

- **[F4] Botão Imprimir.** A Agenda (semana, mês inteiro ou a lista da tela), a ficha do processo, a ficha do cliente e a lista de processos agora podem ser impressas ou salvas em PDF. A folha sai em A4, com o timbre do escritório.
  - **Solicitado por:** Thamara Santana (cliente) (pedido de 04/11/2026); já sugerido por Pedro Nogueira na planilha de testes de 29/10
  - **Ramo:** `melhoria/F4-imprimir`
  - **Ficha:** [docs/solicitacoes/F4-imprimir.md](docs/solicitacoes/F4-imprimir.md)

---

## [1.3.3] — 04/11/2026

### Corrigido

- **[C4] Vários clientes por processo.** Um processo agora pode ter vários clientes (botão **"Adicionar outro cliente"** no formulário), e a ficha de cada cliente mostra todos os processos em que ele aparece. Os processos que já existiam são convertidos sozinhos, sem perder nada.
  - **Solicitado por:** Thamara Santana (cliente) (pedido de 04/11/2026)
  - **Ramo:** `correcao/C4-varios-clientes-por-processo`
  - **Ficha:** [docs/solicitacoes/C4-varios-clientes-por-processo.md](docs/solicitacoes/C4-varios-clientes-por-processo.md)

---

## [1.3.2] — 04/11/2026

### Corrigido

- **[F7] Notícias repetidas e nomes de sites padronizados.** Depois da v1.3.1, a mesma matéria às vezes aparecia duas vezes: uma vinda do feed do site e outra da busca do Google. Agora aparece uma vez só. Os nomes dos sites também ficaram padronizados ("Consultor Jurídico" → ConJur, "stf noticias" → STF).
  - **Solicitado por:** Thamara Santana (cliente) (ajuste do pedido F7, conferido no site publicado em 04/11/2026)
  - **Ramo:** `correcao/F7-noticias-repetidas`
  - **Ficha:** [docs/solicitacoes/F7-site-institucional.md](docs/solicitacoes/F7-site-institucional.md) (seção 8)

---

## [1.3.1] — 04/11/2026

### Corrigido

- **[F7] Mais notícias no site publicado.** O site do STJ não responde aos servidores da Vercel, que ficam fora do Brasil, e por isso o site no ar mostrava poucas notícias. Foram adicionadas buscas por área no **Google Notícias**, limitadas a sites jurídicos e oficiais de confiança (STJ, STF, TST, ConJur, Migalhas, IBDFAM, Agência Brasil, gov.br). O nome do site de origem aparece em cada notícia. Quando a lista de fontes muda, as notícias são buscadas na hora.
  - **Solicitado por:** Thamara Santana (cliente) (ajuste do pedido F7, conferido no site publicado em 04/11/2026)
  - **Ramo:** `correcao/F7-mais-fontes-de-noticias`
  - **Ficha:** [docs/solicitacoes/F7-site-institucional.md](docs/solicitacoes/F7-site-institucional.md) (seção 7)

---

## [1.3.0] — 04/11/2026

### Adicionado

- **[F7] Site institucional.** O endereço principal agora abre o site do escritório. O site tem:
  - apresentação, **Sobre mim** (com foto), **Áreas de atuação** (Família, Patrimônio e Sucessões com a Dra. Thamara, e as demais áreas com a equipe) e **Como funciona o atendimento**;
  - **Contato** com WhatsApp, Instagram, e-mail e mapa do Google;
  - aba **Notícias** com publicações do escritório e notícias jurídicas atualizadas automaticamente (STJ, ConJur e Agência Brasil), separadas por área;
  - menu **Publicações** no sistema, onde a advogada escreve os textos que aparecem no site.

  O sistema continua igual, agora em **/sistema** (botão "Área restrita"). Os endereços antigos redirecionam sozinhos.
  - **Solicitado por:** Thamara Santana (cliente) (pedido de 04/11/2026)
  - **Ramo:** `melhoria/F7-site-institucional`
  - **Ficha:** [docs/solicitacoes/F7-site-institucional.md](docs/solicitacoes/F7-site-institucional.md)

---

## [1.2.1] — 30/10/2026

### Corrigido

- **[C3] Senha forte.** O cadastro aceitava a senha "123456". Agora a senha exige **no mínimo 8 caracteres, com letras e números**, na tela e no servidor, no cadastro e no "Criar nova senha". Embaixo do campo aparece a lista das regras, com ✓ verde em cada uma cumprida. As contas antigas continuam entrando normalmente.
  - **Solicitado por:** Pedro Nogueira (teste 5 — teste de usuário de 30/10/2026)
  - **Ramo:** `correcao/C3-senha-forte`
  - **Ficha:** [docs/solicitacoes/C3-senha-forte.md](docs/solicitacoes/C3-senha-forte.md)

---

## [1.2.0] — 30/10/2026

### Adicionado

- **[F3] "Esqueci minha senha".** A tela de entrada ganhou o link **Esqueci minha senha**. O sistema envia por e-mail um link que vale 1 hora e é de uso único. Pelo link, a usuária cria uma nova senha e já entra no sistema.

  Segurança:
  - a resposta não revela quais e-mails têm conta;
  - o banco guarda só o hash do código;
  - há um limite de 3 pedidos a cada 15 minutos.

  O envio é pelo Gmail, com "senha de app" (variáveis `SMTP_USUARIO` e `SMTP_SENHA`).
  - **Solicitado por:** Thamara Santana (cliente 3 — teste de usuário de 30/10/2026)
  - **Ramo:** `melhoria/F3-esqueci-minha-senha`
  - **Ficha:** [docs/solicitacoes/F3-esqueci-minha-senha.md](docs/solicitacoes/F3-esqueci-minha-senha.md)

---

## [1.1.0] — 30/10/2026

### Adicionado

- **[F6] Cadastro individual de clientes com aviso de aniversário.** Há uma nova aba **Clientes** com:
  - pessoa física: nome, nacionalidade, estado civil, profissão, RG, CPF e nascimento;
  - pessoa jurídica: razão social, nome fantasia, CNPJ, inscrições, ramo e representante legal;
  - contato e endereço com CEP, que preenche o endereço automaticamente.

  Os aniversários dos próximos 7 dias aparecem na tela Início, no menu e na lista de clientes, com atalho para o WhatsApp. Os processos passam a se ligar ao cliente cadastrado.
  - **Solicitado por:** Thamara Santana (cliente 3 — teste de usuário de 30/10/2026)
  - **Ramo:** `melhoria/F6-cadastro-de-clientes`
  - **Ficha:** [docs/solicitacoes/F6-cadastro-de-clientes.md](docs/solicitacoes/F6-cadastro-de-clientes.md)

### Corrigido

- **[C2] Confirmar antes de sair.** O botão "Sair" desconectava na hora. Agora ele pergunta antes e avisa se houver um formulário aberto.
  - **Solicitado por:** Thamara Santana (cliente 3 — teste de usuário de 30/10/2026)
  - **Ramo:** `correcao/C2-confirmar-saida`
  - **Ficha:** [docs/solicitacoes/C2-confirmar-saida.md](docs/solicitacoes/C2-confirmar-saida.md)

---

## [1.0.1] — 29/10/2026

### Corrigido

- **[C1] Número do processo no padrão CNJ.** O campo aceitava qualquer texto (ex.: `123abc`).
  Agora a máscara `0000000-00.0000.0.00.0000` é aplicada enquanto se digita ou cola o número, e o sistema recusa números fora do padrão, tanto na tela quanto no servidor.
  - **Solicitado por:** Mariana Couto (teste de usuário de 29/10/2026)
  - **Ramo:** `correcao/C1-mascara-numero-processo` · **Pull Request:** #1
  - **Ficha:** [docs/solicitacoes/C1-mascara-numero-processo.md](docs/solicitacoes/C1-mascara-numero-processo.md)

---

## [1.0.0] — 29/10/2026

Primeira versão publicada em <https://thamara-santana-advocacia.vercel.app>.

- Login com e-mail e senha.
- Processos: cadastro, busca e ficha do processo.
- Compromissos: audiências, recursos, manifestações e despachos.
- Tela Início com o resumo do dia e a Agenda com calendário.
- Banco SQLite no computador e Turso na publicação.
- 81 testes unitários.
