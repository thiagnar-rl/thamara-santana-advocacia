# C3 — Exigir senha forte no cadastro

| Campo | Informação |
| ----- | ---------- |
| **Código** | C3 (o mesmo código já reservado para esta correção na planilha de testes de 29/10) |
| **Tipo** | Correção |
| **Solicitado por** | Pedro Nogueira (teste 5 na ordem de testes) |
| **Origem** | Teste de usuário de 30/10/2026 |
| **Prioridade** | Média (segurança) |
| **Ramo no Git** | `correcao/C3-senha-forte` |
| **Versão** | 1.2.1 |
| **Status** | Implementada — aguardando merge e publicação |

---

## 1. O pedido (como foi relatado)

> **Testou e não funcionou:** criou uma conta com a senha "123456" e o sistema aceitou.
> **O que corrigir:** exigir no mínimo 8 caracteres, com letras e números, no cadastro.

## 2. Causa

A regra de senha, tanto na tela quanto no servidor, conferia apenas o tamanho mínimo, que era de **6 caracteres**. Não exigia letras nem números.

## 3. Solução

### 3.1 Nova regra, a mesma na tela e no servidor

A senha precisa ter:
- **8 caracteres ou mais**;
- **pelo menos uma letra** (letras acentuadas também contam);
- **pelo menos um número**.

| Senha digitada | Resultado |
| -------------- | --------- |
| `123456` | ✖ *"A senha precisa ter pelo menos 8 caracteres, com letras e números."* |
| `12345678` | ✖ *"A senha precisa ter pelo menos uma letra."* |
| `abcdefgh` | ✖ *"A senha precisa ter pelo menos um número."* |
| `Pedro2026` | ✔ Aceita |

### 3.2 Na tela

- Em **Criar conta** e em **Criar nova senha** (do "Esqueci minha senha"), aparece embaixo do campo a lista das 3 regras. Cada uma fica **verde com ✓** quando é cumprida, enquanto a pessoa digita.
- O texto de exemplo do campo passou a ser *"Mínimo de 8, com letras e números"*.

### 3.3 No servidor

A API recusa senha fraca com erro **400**, mesmo que alguém tente enviar os dados sem passar pela tela.

### 3.4 O que **não** muda

- **Contas que já existem** continuam entrando com a senha atual. A regra vale para **criar conta** e para **trocar a senha**.
- Para atualizar uma senha antiga, use **"Esqueci minha senha"**: a nova senha já segue a regra forte.
- O banco de dados não muda.

## 4. Arquivos alterados

Pesquise `[C3]` no VS Code (**Ctrl + Shift + F**) para ver cada trecho.

| Arquivo | Camada (MVC) | O que mudou |
| ------- | ------------ | ----------- |
| `backend/src/utils/validacao.ts` | Model (regra) | `SENHA_MINIMA = 8` e `problemaNaSenha()` |
| `backend/src/models/usuario.model.ts` | Model | O cadastro usa a regra forte |
| `backend/src/models/recuperacao.model.ts` | Model | "Criar nova senha" ([F3]) usa a mesma regra |
| `frontend/src/app/core/logica/formularios.logica.ts` | Model (tela) | `problemaNaSenha()` e `requisitosSenha()` (lista com ✓) |
| `frontend/src/app/pages/acesso/*` | Controller + View | Lista de regras no Criar conta e novo texto de exemplo |
| `frontend/src/app/pages/recuperar-senha/*` | Controller + View | Lista de regras no Criar nova senha |
| Testes (`backend/tests/utils.test.ts`, `auth.controller.test.ts`, `usuario.model.test.ts`, `recuperacao.test.ts`, `frontend/tests/formularios.logica.test.ts`) | Teste | Testes novos `[C3]` e mensagens antigas atualizadas |
| `README.md`, `CHANGELOG.md`, `docs/solicitacoes/*` | Documentação | Registro do pedido |

## 5. Testes

| Antes (v1.2.0) | Depois |
| -------------- | ------ |
| 126 testes (94 backend + 32 frontend) | **130 testes (96 backend + 34 frontend)**, todos passando |

### Teste manual

1. **No site, sem estar logado**, abra **Criar conta**. Se o cadastro estiver fechado (`PERMITIR_CADASTRO=false`), teste pelo "Esqueci minha senha".
2. Digite `123456`. As regras "8 caracteres" e "letra" ficam em cinza, e ao enviar aparece o erro.
3. Digite `Pedro2026`. As 3 regras ficam verdes ✓.

## 6. Como desfazer

No GitHub, abra o merge do ramo `correcao/C3-senha-forte` e use **Revert**. Ou, no terminal, rode `git revert -m 1 <código-do-merge>` seguido de `git push` e `npm run deploy`.
