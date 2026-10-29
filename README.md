# ⚖️ Thamara Santana — Advocacia e Consultoria Jurídica

Sistema de gestão do escritório **Thamara Santana Advocacia e Consultoria Jurídica**, simples e elegante, para organizar **processos, audiências, recursos, manifestações e despachos**.

- **Frontend:** Angular 20 · TypeScript · SCSS
- **Backend:** Node.js · Express 5 · TypeScript · SQLite
- **Login:** e-mail e senha (senha criptografada com bcrypt, sessão com JWT)
- **Site publicado:** <https://thamara-santana-advocacia.vercel.app> (Vercel + banco Turso)

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

## 3. O que o sistema faz

| Tela          | Para que serve                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Entrar / Criar conta** | Login com e-mail e senha.                                                              |
| **Início**    | Resumo do dia: compromissos de hoje, próximos 7 dias, atrasados e pendências por tipo.            |
| **Agenda**    | Calendário do mês com pontinhos coloridos + lista com filtros (próximos, atrasados, concluídos).  |
| **Processos** | Cadastro de processos (número no padrão CNJ com máscara automática, cliente, parte contrária, vara, área, situação, observações). |
| **Processo**  | Ficha do processo com todos os compromissos ligados a ele.                                        |

Cada compromisso tem um **tipo** com cor própria:

- 🟣 **Audiência** · 🟠 **Recurso** · 🟢 **Manifestação** · 🌸 **Despacho**

Clique no quadradinho ao lado de um compromisso para marcá-lo como **concluído**.

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
│   ├── src/
│   │   ├── server.ts         ← liga o servidor
│   │   ├── app.ts            ← monta o Express (middlewares + rotas)
│   │   ├── config/           ← variáveis de ambiente e banco (tabelas)
│   │   ├── models/           ← MODEL: usuário, processo, compromisso, painel
│   │   ├── views/            ← VIEW: formato do JSON devolvido
│   │   ├── controllers/      ← CONTROLLER: recebe as requisições
│   │   ├── routes/           ← liga cada URL ao seu controller
│   │   ├── middlewares/      ← login obrigatório e tratamento de erros
│   │   └── utils/            ← datas, validações e token
│   └── tests/                ← testes unitários do backend
└── frontend/                 ← site (Angular)
    ├── public/marca/         ← logo dourada, monograma e foto do login
    ├── src/
    │   ├── styles.scss       ← cores, fontes e estilos globais
    │   └── app/
    │       ├── core/         ← MODEL: modelos, serviços e logica/ (regras de tela)
    │       ├── layout/       ← menu lateral
    │       ├── shared/       ← componentes reutilizáveis
    │       └── pages/        ← telas (.ts = controller, .html/.scss = view)
    └── tests/                ← testes unitários do frontend
```

### Rotas da API

| Método | Rota                              | Descrição                         |
| ------ | --------------------------------- | --------------------------------- |
| POST   | `/api/auth/registrar`             | Criar conta                       |
| POST   | `/api/auth/login`                 | Entrar                            |
| GET    | `/api/dashboard`                  | Dados da tela inicial             |
| GET    | `/api/processos`                  | Listar (`?busca=` `?status=`)     |
| GET    | `/api/processos/:id`              | Processo + compromissos           |
| POST / PUT / DELETE | `/api/processos[/:id]` | Criar / editar / excluir          |
| GET    | `/api/compromissos`               | Listar (`?tipo=` `?status=` `?de=` `?ate=` `?periodo=atrasados`) |
| POST / PUT / DELETE | `/api/compromissos[/:id]` | Criar / editar / excluir       |
| PATCH  | `/api/compromissos/:id/status`    | Marcar concluído / pendente       |

---

## 5. Testes unitários

São **88 testes** (67 no backend e 21 no frontend), feitos com o executor de testes que já vem no Node.js (`node:test`). Os testes do backend usam um banco **em memória**, então não mexem nos seus dados reais.

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

**5. Publicar a versão final:**

```bash
npm run deploy
```

A Vercel mostra o endereço do site (algo como `https://thamara-santana-advocacia.vercel.app`).
Abra, clique em **Criar conta** e cadastre a conta da advogada.

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

Cada pedido é feito num **ramo próprio** (ex.: `correcao/C1-mascara-numero-processo`) e a mensagem do commit cita o código e quem pediu.

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
