# Histórico de alterações

Todas as mudanças do sistema **Thamara Santana Advocacia e Consultoria Jurídica** ficam registradas aqui.
Cada item traz o **código do pedido**, **quem pediu** e o link para a ficha completa em [`docs/solicitacoes/`](docs/solicitacoes/README.md).

Numeração de versões: `MAIOR.MENOR.CORREÇÃO`. Por exemplo, `1.0.1` é uma correção na versão `1.0`.

---

## [1.2.1] — em preparação

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
