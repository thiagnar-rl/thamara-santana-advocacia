# ⚖️ Thamara Santana — Advocacia e Consultoria Jurídica

Site e sistema de gestão do escritório **Thamara Santana Advocacia e Consultoria Jurídica**:

- **Site público** (`/`): apresentação, sobre, áreas de atuação, notícias jurídicas diárias e contato com WhatsApp, Instagram e mapa.
- **Sistema** (`/sistema`, área restrita): organiza **processos, audiências, recursos, manifestações, despachos e clientes**, e é onde a advogada escreve as publicações do site.

- **Frontend:** Angular 20 · TypeScript · SCSS
- **Backend:** Node.js · Express 5 · TypeScript · SQLite
- **Login:** e-mail e senha (senha criptografada com bcrypt, sessão com JWT)
- **Integrações:** Google Agenda (sincronização nos dois sentidos) e Google Drive (documentos anexados)
- **Site publicado:** <https://thamara-santana-advocacia.vercel.app> (Vercel + banco Turso)
- **Versão atual:** 1.9.1 (05/11/2026) — histórico completo no [`CHANGELOG.md`](CHANGELOG.md)

### Quem é quem

| Papel | Pessoa |
| ----- | ------ |
| **Cliente** (dona do escritório e usuária do sistema) | **Thamara Santana**, advogada (OAB/SP 500.770) |
| **Desenvolvedor** (autor do código) | **Thiago Rinaldi Luna** |

As **solicitações de alteração** (correções e funcionalidades novas) foram feitas pela **cliente Thamara Santana**, durante o uso e os testes do sistema. Cada uma ganhou um código e uma ficha. A lista completa está em [`docs/solicitacoes/`](docs/solicitacoes/README.md). Na fase de testes de 29 e 30/10, algumas sugestões vieram também de voluntários (Mariana Couto, Pedro Nogueira e Juliana Prado). Os nomes deles ficam registrados nas fichas correspondentes.

### Resumo das solicitações atendidas

| Código | O que mudou | Versão |
| ------ | ----------- | ------ |
| C1 | Máscara e validação do número do processo (padrão CNJ) | 1.0.1 |
| C2 | Confirmação antes de sair do sistema | 1.1.0 |
| F6 | Cadastro de clientes (pessoa física e jurídica) com aviso de aniversário | 1.1.0 |
| F3 | "Esqueci minha senha", com link por e-mail | 1.2.0 |
| C3 | Senha forte (8 caracteres ou mais, com letras e números) | 1.2.1 |
| F7 | Site institucional com notícias jurídicas diárias; sistema em `/sistema` | 1.3.0 a 1.3.2 |
| C4 | Vários clientes por processo e vários processos por cliente | 1.3.3 |
| F4 | Botão Imprimir (agenda, fichas e lista de processos) | 1.4.0 |
| F8 | Agenda ligada à Google Agenda da Thamara, nos dois sentidos | 1.5.0 |
| F1 | Anexar documentos no Google Drive (clientes, processos e compromissos) | 1.6.0 |
| C5 | Site: áreas da Dra. Thamara (Família e Sucessões, Cível e Trabalhista) e fotos novas | 1.6.2 |
| F9 | Página Política de Privacidade (LGPD e Google) | 1.7.0 |
| F10 | Perguntas frequentes no site | 1.8.0 |
| F11 | Páginas por área, WhatsApp por assunto, imagem de compartilhamento e sitemap | 1.9.0 |

---

## 1. O que instalar antes (uma vez só)

1. **Node.js 24 LTS** (ou 22 LTS) — baixe em <https://nodejs.org> e instale com as opções padrão.
   > A versão precisa ser **22.13 ou maior**, pois usamos o SQLite que já vem dentro do Node.
2. **VS Code** — <https://code.visualstudio.com>

Para conferir, abra um terminal e digite:

```bash
node -v
```

Deve aparecer algo como `v24.x.x` ou `v22.x.x`.

---

## 2. Como rodar o projeto

1. Abra o **VS Code** → `Arquivo > Abrir Pasta...` → escolha a pasta **Projeto Advocacia**.
   > Em outro computador, baixe o projeto do GitHub primeiro:
   > `git clone https://github.com/thiagnar-rl/thamara-santana-advocacia.git`
2. Abra o terminal do VS Code: menu `Terminal > Novo Terminal`.
3. Instale as dependências (só na primeira vez — demora alguns minutos):

   ```bash
   npm run instalar
   ```

4. Ligue o sistema:

   ```bash
   npm run dev
   ```

5. O navegador abre sozinho em **<http://localhost:4200>**. Clique em **Criar conta** e pronto!

Para desligar, clique no terminal e aperte `Ctrl + C`.

> Nas próximas vezes, basta o passo 4 (`npm run dev`).

---

## 3. O que o site e o sistema fazem

### Site público ([F7])

| Página | Conteúdo |
| ------ | -------- |
| **Início** (`/`) | Apresentação, **Sobre mim**, **Áreas de atuação** (Dra. Thamara: Família e Sucessões, Cível e Trabalhista; equipe: Previdenciário e Criminal), **Como funciona o atendimento**, **Perguntas frequentes** ([F10]), as 3 notícias mais recentes e **Contato** com mapa. |
| **Notícias** (`/noticias`) | Publicações do escritório e notícias jurídicas do dia (STJ, ConJur e Agência Brasil), com filtro por área. |
| **Publicação** (`/noticias/:id`) | Texto completo de uma publicação do escritório. |
| **Área** (`/atuacao/:area`) | [F11] Uma página por área (familia-e-sucessoes, trabalhista, civel, criminal e previdenciario), com especialidades, perguntas e WhatsApp com o assunto. |
| **Política de Privacidade** (`/privacidade`) | [F9] Como o site e o sistema tratam dados pessoais (LGPD) e o uso do Google Agenda e Drive. O texto fica em `frontend/src/app/site/privacidade/politica.ts`. |

Os textos, telefones e endereços do site ficam todos em **`frontend/src/app/site/conteudo.ts`**. As fontes de notícias e as palavras de cada área ficam em **`backend/src/config/site.ts`**. O mapa do site para o Google fica em **`frontend/public/sitemap.xml`** ([F11]), e o arquivo `frontend/public/google284361ef5ba884ef.html` é a verificação do Google Search Console (não apague); ao trocar de endereço (domínio próprio), atualize-o junto com o `robots.txt` e as tags `og:image` do `index.html`.

### Sistema (`/sistema`)

| Tela          | Para que serve                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Entrar / Criar conta** | Login com e-mail e senha, com o link **Esqueci minha senha**, que envia por e-mail um link para criar uma nova senha. Senhas novas precisam ter **8 caracteres ou mais, com letras e números**. |
| **Início**    | Resumo do dia: compromissos de hoje, próximos 7 dias, atrasados e pendências por tipo.            |
| **Agenda**    | Calendário do mês com pontinhos coloridos + lista com filtros (próximos, atrasados, concluídos).  |
| **Processos** | Cadastro de processos (número no padrão CNJ com máscara automática, **um ou mais clientes**, parte contrária, vara, área, situação, observações). |
| **Processo**  | Ficha do processo com todos os compromissos ligados a ele e os **documentos anexados** ([F1]). |
| **Clientes**  | Cadastro de pessoas físicas e jurídicas (documentos, representante legal, contatos e endereço com busca por CEP), ficha com os processos do cliente, **documentos anexados** ([F1]) e **aviso de aniversário**. |
| **Imprimir** ([F4]) | Botão na Agenda (semana, mês ou lista), nas fichas de processo e cliente e na lista de processos. Para PDF, use "Salvar como PDF" na janela de impressão. |
| **Publicações** | Textos da advogada para a aba Notícias do site: publicar ou deixar como rascunho. |
| **Google Agenda** ([F8]) | Quadro no menu lateral. O que muda no sistema vai na hora para a Google Agenda. O que muda no Google volta ao abrir o sistema, a cada 5 minutos e no botão **Sincronizar agora**. |
| **Documentos** ([F1]) | Botão **Anexar** nas fichas de processo e cliente e no formulário do compromisso. Os arquivos (até 50 MB cada) ficam no Google Drive da Thamara, na pasta "Thamara Santana Advocacia". |

Cada compromisso tem um **tipo** com cor própria:

- 🟣 **Audiência** · 🟠 **Recurso** · 🟢 **Manifestação** · 🌸 **Despacho** · ⚪ **Outro** (eventos criados direto na Google Agenda, [F8])

Clique no quadradinho ao lado de um compromisso para marcá-lo como **concluído**.

Os aniversários de clientes dos próximos 7 dias aparecem na tela **Início**, com atalho para mandar parabéns pelo WhatsApp. Para sair do sistema, clique no ícone de saída ao lado do seu nome: o sistema pede confirmação antes.

---

## 4. Arquitetura MVC e estrutura das pastas

O projeto segue o padrão **MVC (Model-View-Controller)**:

| Camada | Backend | Frontend | Para que serve |
| ------ | ------- | -------- | -------------- |
| **Model** | `src/models/*.model.ts` | `core/models.ts`, `core/logica/`, serviços | Dados, regras de negócio e acesso ao banco/API |
| **View** | `src/views/*.view.ts` (JSON) | arquivos `.html` e `.scss` | O que é mostrado (JSON da API / telas) |
| **Controller** | `src/controllers/*.controller.ts` | componentes `.ts` | Recebe a ação, chama o Model e entrega à View |

```
Projeto Advocacia/
├── package.json              ← comandos "instalar", "dev", "test" e "deploy"
├── CHANGELOG.md              ← histórico de versões e de cada alteração
├── vercel.json               ← configuração da publicação na Vercel (site + API)
├── .vercelignore             ← o que NÃO é enviado para a Vercel
├── .gitignore                ← o que NÃO é enviado para o GitHub
├── docs/                     ← documentação do projeto (Word)
│   └── solicitacoes/         ← uma ficha por pedido de correção/melhoria (quem pediu, o que mudou)
├── backend/                  ← API (Node + Express + SQLite)
│   ├── .env.example          ← modelo das variáveis de ambiente
│   ├── data/                 ← banco local + segredo do login (criado sozinho, fora do Git)
│   │                            NÃO apague: é onde ficam os dados quando o sistema roda no computador
│   ├── src/
│   │   ├── server.ts         ← liga o servidor
│   │   ├── app.ts            ← monta o Express (middlewares + rotas)
│   │   ├── config/           ← variáveis de ambiente e banco (tabelas)
│   │   ├── models/           ← MODEL: usuário, cliente, processo, compromisso, painel, publicações,
│   │   │                        conta Google, sincronização da agenda e anexos
│   │   ├── views/            ← VIEW: formato do JSON devolvido
│   │   ├── controllers/      ← CONTROLLER: recebe as requisições
│   │   ├── routes/           ← liga cada URL ao seu controller
│   │   ├── middlewares/      ← login obrigatório e tratamento de erros
│   │   └── utils/            ← datas, validações, token, cifra, e-mail, notícias (RSS),
│   │                            Google (login, Agenda e Drive)
│   └── tests/                ← testes unitários do backend
└── frontend/                 ← site (Angular)
    ├── public/marca/         ← logo dourada, monograma e foto do login
    ├── src/
    │   ├── styles.scss       ← cores, fontes e estilos globais
    │   └── app/
    │       ├── core/         ← MODEL: modelos, serviços e logica/ (regras de tela)
    │       ├── layout/       ← menu lateral (com o quadro do Google Agenda)
    │       ├── site/         ← site público (início, notícias, conteúdo dos textos)
    │       ├── shared/       ← componentes reutilizáveis
    │       └── pages/        ← telas (.ts = controller, .html/.scss = view)
    └── tests/                ← testes unitários do frontend
```

### Rotas da API

| Método | Rota                              | Descrição                         |
| ------ | --------------------------------- | --------------------------------- |
| POST   | `/api/auth/registrar`             | Criar conta                       |
| POST   | `/api/auth/login`                 | Entrar                            |
| POST   | `/api/auth/esqueci-senha`         | Envia o link de nova senha por e-mail |
| POST   | `/api/auth/redefinir-senha`       | Cria a nova senha com o código do link |
| GET    | `/api/dashboard`                  | Dados da tela inicial             |
| GET    | `/api/processos`                  | Listar (`?busca=` `?status=`)     |
| GET    | `/api/processos/:id`              | Processo + compromissos           |
| POST / PUT / DELETE | `/api/processos[/:id]` | Criar / editar / excluir          |
| GET    | `/api/compromissos`               | Listar (`?tipo=` `?status=` `?de=` `?ate=` `?periodo=atrasados`) |
| POST / PUT / DELETE | `/api/compromissos[/:id]` | Criar / editar / excluir       |
| PATCH  | `/api/compromissos/:id/status`    | Marcar concluído / pendente       |
| GET    | `/api/clientes`                   | Listar (`?busca=` `?tipo=fisica\|juridica`) |
| GET    | `/api/clientes/aniversariantes`   | Aniversários de hoje até `?dias=` (padrão 7) |
| GET    | `/api/clientes/:id`               | Cliente + processos dele          |
| POST / PUT / DELETE | `/api/clientes[/:id]` | Criar / editar / excluir          |
| GET / POST / PUT / DELETE | `/api/publicacoes[/:id]` | Publicações do site (com login) |
| GET    | `/api/publico/noticias`           | **Público:** publicações + notícias do dia (`?area=`) |
| GET    | `/api/publico/publicacoes/:id`    | **Público:** uma publicação do escritório |
| GET    | `/api/publico/noticias/fontes`    | **Público:** situação de cada fonte na última busca |
| GET    | `/api/google`                     | [F8] Situação da conexão com o Google Agenda |
| GET    | `/api/google/conectar`            | [F8] Endereço da página de autorização do Google |
| GET    | `/api/google/retorno`             | [F8] **Público:** volta do login do Google |
| POST   | `/api/google/sincronizar`         | [F8] Traz as mudanças do Google Agenda (`?forcar=1`) |
| DELETE | `/api/google`                     | [F8] Desconecta o Google |
| GET    | `/api/anexos?tipo=&id=`           | [F1] Documentos anexados de um cliente, processo ou compromisso |
| POST   | `/api/anexos/envio`               | [F1] Abre o envio do arquivo no Google Drive |
| POST / DELETE | `/api/anexos[/:id]`        | [F1] Registra / exclui (lixeira do Drive) |

---

## 5. Testes unitários

São **204 testes** (142 no backend e 62 no frontend), feitos com o executor de testes que já vem no Node.js (`node:test`). Os testes do backend usam um banco **em memória**, então não mexem nos seus dados reais.

```bash
npm test                                   # roda todos os testes
npm test --prefix backend                  # só o backend
npm test --prefix frontend                 # só o frontend
npm run test:cobertura --prefix backend    # backend + relatório de cobertura
```

Se tudo estiver certo, o final da saída mostra `# fail 0`.

Para conferir se o site compila sem erros (o mesmo que a Vercel faz ao publicar):

```bash
npm run build --prefix frontend
```

---

## 6. Publicar na internet (Vercel + Turso, gratuito)

Na Vercel o site e a API ficam no mesmo endereço. O banco de dados fica no **Turso**
(gratuito e compatível com SQLite), porque a Vercel não guarda arquivos de forma permanente.
No seu computador nada muda: continua usando o arquivo `backend/data/agenda.db`.

**1. Criar o banco no Turso**
1. Acesse <https://turso.tech>, clique em **Sign up** e entre com sua conta GitHub ou Google.
2. Crie um banco (**Create Database**) com o nome `thamara-agenda`, na região mais próxima do Brasil.
3. Na página do banco, copie a **URL** (começa com `libsql://`) e crie um **Token** (botão *Create Token*). Guarde os dois.

**2. Gerar o segredo do login** (no terminal do VS Code):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copie o texto que aparecer.

**3. Publicar na Vercel** (no terminal do VS Code, dentro da pasta do projeto):

```bash
npx vercel login
npx vercel
```

Responda: *Set up and deploy?* **Y** · escolha a sua conta · *Create a new project* ·
*Project name:* `thamara-santana-advocacia` · *In which directory?* **./**.
Quando aparecer **Multiple services were detected** (frontend Angular + backend Express), confirme com **Yes** —
o arquivo `vercel.json` já traz essa configuração.

**4. Cadastrar as variáveis** no site da Vercel: abra o projeto → **Settings → Environment Variables** e adicione:

| Nome | Valor |
| ---- | ----- |
| `TURSO_DATABASE_URL` | a URL `libsql://...` do passo 1 |
| `TURSO_AUTH_TOKEN` | o token do passo 1 |
| `JWT_SECRET` | o texto gerado no passo 2 |
| `PERMITIR_CADASTRO` | `true` |
| `SMTP_USUARIO` | e-mail Gmail que envia o link do "Esqueci minha senha" |
| `SMTP_SENHA` | **senha de app** do Gmail (16 letras), criada em <https://myaccount.google.com/apppasswords>. Não é a senha normal |
| `SITE_AUTORES` | *(opcional, [F7])* e-mail(s) das contas que podem publicar na aba Notícias do site. Sem ela, vale a conta mais antiga |
| `GOOGLE_CLIENT_ID` | *([F8])* "ID do cliente" criado no Google Cloud (Google Agenda e Drive) |
| `GOOGLE_CLIENT_SECRET` | *([F8])* "Chave secreta do cliente" do Google Cloud. Só na Vercel, nunca no GitHub |

> Situação atual do site publicado: cadastro **fechado** (`PERMITIR_CADASTRO=false`), Gmail configurado e Google conectado à conta da Thamara.

**Configurar o Google (Agenda e Drive):** o passo a passo completo, com o projeto no Google Cloud, a tela de consentimento "Em produção" e o ID do cliente, está na [ficha F8, seção 5](docs/solicitacoes/F8-google-agenda.md). O endereço de retorno cadastrado no Google é `https://thamara-santana-advocacia.vercel.app/api/google/retorno`.

**5. Publicar a versão final:**

```bash
npm run deploy
```

A Vercel mostra o endereço do site (algo como `https://thamara-santana-advocacia.vercel.app`).
Abra o site, clique em **Área restrita → Criar conta** e cadastre a conta da advogada.

**6. Fechar o cadastro (importante):** como o site fica na internet, troque `PERMITIR_CADASTRO`
para `false` nas variáveis da Vercel e rode `npm run deploy` de novo. Assim ninguém mais consegue criar conta.

> Sempre que alterar o código, basta rodar `npm run deploy` para atualizar o site.

**Conferir se está funcionando:** abra <https://thamara-santana-advocacia.vercel.app/api/saude> —
deve aparecer `{"ok":true}`.

---

## 7. Enviar alterações para o GitHub

O projeto já está pronto para o Git: o `.gitignore` impede que subam o `node_modules`,
o banco local (`backend/data`), arquivos `.env` e a pasta `.vercel`. Para salvar uma alteração:

```bash
git add .
git status        # confira a lista antes de confirmar
git commit -m "Descreva aqui o que mudou"
git push
```

> Nunca coloque o token do Turso nem o `JWT_SECRET` em arquivos do projeto — eles ficam só nas variáveis da Vercel.

### Rastreabilidade das alterações

Todo pedido de correção ou melhoria recebe um **código** (C1, C2… para correções; F1, F2… para funcionalidades novas) e é registrado em três lugares:

1. **Ficha do pedido** em [`docs/solicitacoes/`](docs/solicitacoes/README.md): quem pediu, o problema, a solução, os arquivos alterados, os testes e os passos do Git.
2. **[`CHANGELOG.md`](CHANGELOG.md)**: resumo por versão.
3. **Código e testes**: comentários e nomes de testes com a marca `[C1]`, `[C2]`… — basta pesquisar o código (Ctrl + Shift + F no VS Code) para achar tudo o que um pedido alterou.

Cada pedido é feito num **ramo próprio** (ex.: `correcao/C1-mascara-numero-processo`) e a mensagem do commit cita o código e quem pediu. Depois de testado, o ramo é juntado ao `main` (merge) e a versão ganha uma **tag** (`v1.6.0`, por exemplo).

### Scripts de publicação (`publicar-*.local.cmd`)

Para facilitar, cada pedido pode vir com um script `publicar-XX.local.cmd`, que roda com dois cliques no Windows. Ele faz tudo na ordem:
1. cria o ramo;
2. roda os testes;
3. compila o site;
4. faz o commit;
5. envia ao GitHub;
6. junta no `main`;
7. publica na Vercel;
8. marca a versão.

Se algo falhar, ele para e mostra o erro. Esses scripts são **descartáveis**: valem para um pedido só e não vão para o GitHub (`*.local.cmd` está no `.gitignore`). Depois de usados, podem ser apagados.

---

## 8. Dicas e problemas comuns

- **Personalizar cores:** edite as variáveis no topo de `frontend/src/styles.scss`.
- **Logo e imagens da marca:** ficam em `frontend/public/marca/` (monograma, logo completa e foto de fundo do login). Para trocar, substitua os arquivos mantendo os mesmos nomes.
- **Fazer backup dos dados:** no computador, copie a pasta `backend/data` (o arquivo `agenda.db` guarda tudo).
  No site publicado, os dados ficam no **Turso** (painel em <https://app.turso.tech>).
- **Ver o banco de dados:** instale a extensão _SQLite Viewer_ no VS Code e abra `backend/data/agenda.db`.
- **"Não foi possível conectar ao servidor"**: a API não está rodando. Use `npm run dev` (liga os dois juntos).
- **Erro `node:sqlite` não encontrado:** atualize o Node.js para a versão 22.13+ ou 24 LTS.
- **Porta 4200 ou 3000 ocupada:** feche outros terminais que estejam rodando o projeto.
- **Site publicado mostra "Algo deu errado":** abra `/api/saude` no endereço do site. Se não aparecer `{"ok":true}`,
  veja o erro em Vercel → projeto → **Logs** e confira as 4 variáveis em **Settings → Environment Variables**.
- Rodar só a API: `npm run api` · Rodar só o site: `npm run web`.
- **Google Agenda não sincroniza / quadro mostra "Reconectar o Google":** a autorização foi retirada ou expirou. Clique em **Reconectar o Google** no menu e autorize de novo, com todas as caixinhas marcadas.
- **Quadro do Google não aparece no menu:** falta `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` na Vercel (ou falta o Redeploy depois de cadastrar). No celular, o quadro fica escondido de propósito.
- **Pastas que podem ser apagadas sem medo** (são recriadas sozinhas): `node_modules/` (volta com `npm run instalar`), `frontend/dist/` e `frontend/.angular/` (voltam ao compilar).
