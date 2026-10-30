# F3 — "Esqueci minha senha" (recuperação de acesso por e-mail)

| Campo | Informação |
| ----- | ---------- |
| **Código** | F3 (o mesmo código já reservado para esta funcionalidade na planilha de testes de 29/10) |
| **Tipo** | Funcionalidade nova, relatada como correção ("testou e não funcionou") |
| **Solicitado por** | Thamara Santana (cliente 3 na ordem de testes) |
| **Origem** | Teste de usuário de 30/10/2026. Já tinha sido apontado como "não testado" na planilha de 29/10 (Juliana Prado) |
| **Prioridade** | Alta (sem isso, quem esquece a senha perde o acesso) |
| **Ramo no Git** | `melhoria/F3-esqueci-minha-senha` |
| **Versão** | 1.2.0 |
| **Status** | Publicada em 30/10/2026 (v1.2.0). Envio por Gmail configurado na Vercel e testado no site em 30/10/2026 |

---

## 1. O pedido (como foi relatado)

> **Testou e não funcionou:** "Esqueci minha senha" na tela de entrada não existe. Ela não conseguiu testar a recuperação de acesso.

## 2. Como ficou para a usuária

| Passo | Tela | O que acontece |
| ----- | ---- | -------------- |
| 1 | **Entrar** | Abaixo do campo Senha, há o link **"Esqueci minha senha"**. Se o e-mail já foi digitado, ele vai junto para a próxima tela |
| 2 | **Esqueci minha senha** | A usuária informa o e-mail e clica em **Enviar link** |
| 3 | **Confira seu e-mail** | Aparece a mensagem *"Se este e-mail estiver cadastrado, você vai receber em instantes um link…"*, com dicas (o link vale 1 hora, conferir o spam) e o botão **Enviar de novo** |
| 4 | **E-mail** | Assunto *"Criar nova senha — Thamara Santana Advocacia"*, no visual do escritório, com o botão **Criar nova senha** |
| 5 | **Criar nova senha** | Abre pelo link. A usuária digita a nova senha duas vezes (com o botão de mostrar) e clica em **Salvar nova senha e entrar** |
| 6 | **Início** | A usuária já entra no sistema com o aviso *"Senha alterada! Você já está no sistema."* |

Quando o link é usado de novo, passou de 1 hora ou está incompleto, a tela explica e oferece **Pedir novo link**.

## 3. Segurança

- **Não revela quem tem conta.** A resposta da tela é sempre a mesma, exista ou não o e-mail.
- **No banco fica só o hash (SHA-256) do código.** Quem tiver acesso ao banco não consegue usar os links.
- **O link vale 60 minutos e só pode ser usado uma vez.** Ao trocar a senha, os outros links pendentes da usuária deixam de valer.
- **No máximo 3 pedidos a cada 15 minutos por conta**, para evitar que alguém encha a caixa de e-mail da usuária.
- **O endereço do link vem da configuração do servidor** (`APP_URL`, ou o endereço oficial da Vercel), nunca da requisição. Assim, ninguém consegue fazer o e-mail apontar para outro site.
- A senha nova segue a mesma regra do cadastro: mínimo de 6 caracteres. A C3, ainda pendente, vai deixar essa regra mais forte.

## 4. Configuração do envio de e-mail (uma vez só)

O sistema envia o e-mail por uma conta **Gmail**, usando uma **"senha de app"**. Essa senha é diferente da senha normal da conta e serve só para isso.

| Variável | O que colocar |
| -------- | ------------- |
| `SMTP_USUARIO` | O e-mail Gmail que vai enviar (ex.: o e-mail do escritório) |
| `SMTP_SENHA` | A senha de app de 16 letras gerada em <https://myaccount.google.com/apppasswords>. Exige a verificação em duas etapas ativa |
| `APP_URL` (opcional) | `https://thamara-santana-advocacia.vercel.app` |

- **Na Vercel:** em *Settings → Environment Variables*, cadastre as variáveis e rode `npm run deploy`. Enquanto não estiverem configuradas, a tela mostra *"O envio de e-mails ainda não foi configurado no servidor…"*, sem quebrar nada.
- **No computador:** sem configuração, nada é enviado e o e-mail, com o link, aparece no terminal da API. Assim dá para testar o fluxo inteiro localmente.

## 5. Banco de dados

A nova tabela `recuperacoes_senha` (`usuario_id`, `token_hash`, `criado_em`, `expira_em` e `usado_em`) é criada sozinha na primeira vez que o sistema roda. Nada do que já existe é alterado.

## 6. Arquivos

Pesquise `[F3]` no VS Code (**Ctrl + Shift + F**) para ver cada trecho.

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `backend/src/config/database.ts` | Model (banco) | Tabela `recuperacoes_senha` |
| `backend/src/models/recuperacao.model.ts` | Model (**novo**) | Cria o código, valida (validade, uso único), aplica o limite de pedidos e troca a senha |
| `backend/src/utils/email.ts` | Model (**novo**) | Envio pelo Gmail (nodemailer); modo terminal no computador; endereço do site |
| `backend/src/views/recuperacao.view.ts` | View (**novo**) | E-mail (texto e HTML no visual do escritório) e mensagens da tela |
| `backend/src/controllers/auth.controller.ts` | Controller | `esqueciSenha()` e `redefinirSenha()` |
| `backend/src/routes/auth.routes.ts` | Rotas | `POST /api/auth/esqueci-senha` e `POST /api/auth/redefinir-senha` |
| `backend/package.json` | Dependência | `nodemailer` (envio de e-mail) e `@types/nodemailer` |
| `backend/.env.example` | Configuração | Variáveis de e-mail explicadas |
| `frontend/src/app/pages/recuperar-senha/*` | Controller + View (**novo**) | Telas "Esqueci minha senha", "Confira seu e-mail" e "Criar nova senha" |
| `frontend/src/app/pages/acesso/*` | View | Link "Esqueci minha senha" na tela de entrada |
| `frontend/src/app/app.routes.ts` | Rotas | `/recuperar-senha` e `/redefinir-senha` |
| `frontend/src/app/core/auth.service.ts` | Model (serviço) | Chamadas à API |
| `frontend/src/app/core/logica/formularios.logica.ts` | Model | `validarEmail()` e `validarNovaSenha()` |

## 7. Testes

| Antes (v1.1.0) | Depois |
| -------------- | ------ |
| 116 testes (86 backend + 30 frontend) | **126 testes (94 backend + 32 frontend)**, todos passando |

Testes novos, todos com `[F3]` no nome:

- `backend/tests/recuperacao.test.ts`:
  - guarda só o hash;
  - validade de 60 minutos;
  - limite de 3 pedidos;
  - uso único e invalidação dos outros links;
  - e-mail com o link correto;
  - resposta neutra para e-mail inexistente;
  - aviso quando o e-mail não está configurado;
  - troca de senha com entrada automática.
- `frontend/tests/formularios.logica.test.ts`: `validarEmail()` e `validarNovaSenha()`.

### Teste manual

1. **No computador:** rode `npm run dev`.
   - Na tela de entrada, clique em **Esqueci minha senha** e informe o e-mail da conta.
   - No terminal da API aparece o e-mail com o link. Abra o link, crie a nova senha e confira se você entra direto.
2. **No site**, depois de configurar o Gmail: faça o mesmo caminho e confira se o e-mail chega, inclusive olhando a caixa de spam.
3. Abra o mesmo link de novo. Deve aparecer *"Este link é inválido ou já expirou…"* com o botão **Pedir novo link**.

## 8. Como desfazer

No GitHub, abra o merge do ramo `melhoria/F3-esqueci-minha-senha` e use **Revert**. Ou, no terminal, rode `git revert -m 1 <código-do-merge>` seguido de `git push` e `npm run deploy`.
