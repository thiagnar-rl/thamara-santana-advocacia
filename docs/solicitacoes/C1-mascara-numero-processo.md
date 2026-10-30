# C1 — Máscara e validação do número do processo (padrão CNJ)

| Campo | Informação |
| ----- | ---------- |
| **Código** | C1 |
| **Tipo** | Correção |
| **Solicitado por** | Mariana Couto (cliente, advogada) |
| **Origem** | Teste de usuário de 29/10/2026 |
| **Prioridade** | Média |
| **Ramo no Git** | `correcao/C1-mascara-numero-processo` |
| **Versão** | 1.0.1 |
| **Status** | Publicada em 29/10/2026 |
| **Pull Request** | [#1](https://github.com/thiagnar-rl/thamara-santana-advocacia/pull/1) — commit `2d9d323`, merge `03302e5` |

---

## 1. O pedido (como foi relatado)

> **Testou e não funcionou:** o campo "Número do processo" aceita qualquer texto (ex.: "123abc").
> **O que corrigir:** aplicar a máscara do padrão CNJ (`0000000-00.0000.0.00.0000`) enquanto digita e recusar números fora do formato.

## 2. Causa

- **Tela:** o campo só tinha um *placeholder* com o formato. Nada impedia digitar letras ou um número incompleto.
- **Servidor:** a regra conferia apenas se o número não estava vazio e se tinha até 40 caracteres.

## 3. Solução

### 3.1 Comportamento novo, visto pela usuária

| Ação na tela "Novo processo" / "Editar processo" | Resultado |
| ------------------------------------------------ | --------- |
| Digitar `10023456720268260100` | O campo mostra `1002345-67.2026.8.26.0100` enquanto digita |
| Colar `1002345-67.2026.8.26.0100` | Mantém igual |
| Colar `1002345.67-2026 8 26 0100` | Corrige para `1002345-67.2026.8.26.0100` |
| Digitar letras (`123abc`) | As letras são ignoradas e ficam só `123` |
| Digitar mais de 20 números | O campo para no 20º dígito |
| Salvar com número incompleto | Mensagem em vermelho: *"Número do processo incompleto ou inválido. Use o padrão CNJ: 0000000-00.0000.0.00.0000 (20 dígitos)."* |

Abaixo do campo aparece a ajuda: *"Padrão CNJ: digite só os números, a pontuação é automática."*

### 3.2 Regra no servidor (proteção dupla)

Mesmo que alguém envie dados sem passar pela tela, a API:

- aceita o número já formatado no padrão CNJ;
- aceita só os 20 dígitos, com ou sem pontos, traços e espaços, e grava já formatado;
- recusa qualquer outra coisa com erro **400**: *"Número do processo inválido. Use o padrão CNJ: 0000000-00.0000.0.00.0000 (20 dígitos)."*

### 3.3 O que **não** muda

- **Banco de dados:** não há mudança de tabelas. Nenhuma migração é necessária.
- **Processos já cadastrados** com número fora do padrão continuam aparecendo normalmente. Só ao **editar** um deles o sistema pede o número correto antes de salvar.

## 4. Arquivos alterados

Pesquise `[C1]` no VS Code (**Ctrl + Shift + F**) para ver cada trecho.

| Arquivo | Camada (MVC) | O que mudou |
| ------- | ------------ | ----------- |
| `backend/src/utils/validacao.ts` | Model (regra) | Novas funções `FORMATO_CNJ`, `formatarNumeroCNJ()` e `normalizarNumeroCNJ()` |
| `backend/src/models/processo.model.ts` | Model | `validar()` exige o padrão CNJ e grava o número formatado; nova constante `MENSAGEM_NUMERO_INVALIDO` |
| `frontend/src/app/core/logica/formularios.logica.ts` | Model (tela) | Novas funções `formatarNumeroCNJ()` (máscara) e `numeroCNJValido()`; `validarProcesso()` recusa número fora do padrão |
| `frontend/src/app/shared/processo-modal/processo-modal.ts` | Controller | Novo método `digitarNumero()`, que aplica a máscara a cada tecla |
| `frontend/src/app/shared/processo-modal/processo-modal.html` | View | Campo com máscara, teclado numérico no celular, limite de 25 caracteres e texto de ajuda |
| `frontend/src/styles.scss` | View | Estilo `.ajuda` (texto pequeno abaixo do campo) |
| `backend/tests/utils.test.ts` | Teste | +1 teste: `normalizarNumeroCNJ()` |
| `backend/tests/processo.model.test.ts` | Teste | +2 testes: recusa e aceitação de números; exemplos antigos trocados por números CNJ |
| `backend/tests/processos.controller.test.ts` | Teste | +1 teste: API devolve 400 para `123abc`; exemplos trocados por números CNJ |
| `backend/tests/banco-turso.test.ts` | Teste | Exemplo trocado por número CNJ |
| `frontend/tests/formularios.logica.test.ts` | Teste | +3 testes: validação, máscara e número completo |
| `README.md`, `CHANGELOG.md`, `docs/solicitacoes/*` | Documentação | Registro do pedido e rastreabilidade |

## 5. Testes

| Antes | Depois |
| ----- | ------ |
| 81 testes (63 backend + 18 frontend) | **88 testes (67 backend + 21 frontend)**, todos passando |

Os testes novos têm `[C1]` no nome. No resultado do `npm test`, aparecem como:

```
✔ [C1] normalizarNumeroCNJ() aceita só números no padrão CNJ (sugestão: Mariana Couto)
✔ [C1] criar() devolve 400 para número fora do padrão CNJ (sugestão: Mariana Couto)
✔ [C1] formatarNumeroCNJ() aplica a máscara enquanto digita
...
```

### Teste manual (no computador)

1. Rode `npm run dev` e abra <http://localhost:4200>.
2. Vá em **Processos → Novo processo**.
3. No campo **Número do processo**, digite `10023456720268260100`. Deve aparecer `1002345-67.2026.8.26.0100`.
4. Apague tudo e digite `123abc`. Deve ficar só `123`.
5. Preencha o cliente e clique em **Salvar**. Deve aparecer a mensagem de número incompleto, com o campo em vermelho.
6. Complete o número e salve. O processo deve ser cadastrado.

---

## 6. Passo a passo no Git (manual, sem coautoria)

> Os arquivos já estão alterados na pasta do projeto, mas **ainda não foram registrados** no Git.
> Faça os passos abaixo no terminal do VS Code, **um comando por vez**, dentro de `C:\Users\Thiago\Desktop\Projeto Advocacia`.

### Passo 1 — Conferir onde você está

```
git status
```

O esperado é `On branch main`, seguido da lista de arquivos alterados (*modified*) e novos (*untracked*): `CHANGELOG.md` e `docs/solicitacoes/`.

### Passo 2 — Criar o ramo da correção

```
git switch -c correcao/C1-mascara-numero-processo
```

O esperado é `Switched to a new branch 'correcao/C1-mascara-numero-processo'`. As alterações ainda não registradas vêm junto para o ramo novo. O canto inferior esquerdo do VS Code passa a mostrar o nome do ramo.

### Passo 3 — Testar

```
npm test
npm run build --prefix frontend
```

O esperado:

- `npm test` mostra `pass 67` e `fail 0` no backend, e `pass 21` e `fail 0` no frontend;
- o build termina sem **ERROR**.

Depois faça o **teste manual** da seção 5.

### Passo 4 — Separar e conferir os arquivos

```
git add .
git status
```

Na lista devem aparecer **só** estes arquivos:

- os arquivos de código e de teste da seção 4;
- `README.md` e `CHANGELOG.md`;
- `docs/solicitacoes/README.md` e `docs/solicitacoes/C1-mascara-numero-processo.md`.

Não podem aparecer `node_modules`, `backend/data` nem `.env`.

### Passo 5 — Registrar (commit) citando o pedido e quem pediu

Cada `-m` vira um parágrafo da mensagem:

```
git commit -m "Corrige C1: aplica mascara CNJ no numero do processo" -m "Solicitado por: Mariana Couto (teste de usuario de 29/10/2026)." -m "Detalhes: docs/solicitacoes/C1-mascara-numero-processo.md"
```

O esperado é `[correcao/C1-mascara-numero-processo xxxxxxx] Corrige C1: ...` seguido de `N files changed`.

> **Sem coautoria:** a mensagem contém só o que você digitou acima. Não acrescente nenhuma linha `Co-authored-by`.

### Passo 6 — Enviar o ramo ao GitHub

```
git push -u origin correcao/C1-mascara-numero-processo
```

O esperado é `* [new branch]  correcao/C1-mascara-numero-processo -> correcao/C1-mascara-numero-processo`.

### Passo 7 — Juntar no `main` pelo GitHub (Pull Request)

1. Abra <https://github.com/thiagnar-rl/thamara-santana-advocacia>.
2. Na faixa amarela, clique em **Compare & pull request**. Se a faixa não aparecer: **Pull requests → New pull request**, com *base:* `main` e *compare:* `correcao/C1-mascara-numero-processo`.
3. **Título:** `C1 — Máscara CNJ no número do processo (Mariana Couto)`
4. **Descrição:** copie o modelo abaixo.

   ```
   Pedido: C1 — solicitado por Mariana Couto (teste de usuário de 29/10/2026)
   Problema: o campo "Número do processo" aceitava qualquer texto (ex.: 123abc).
   Solução: máscara CNJ 0000000-00.0000.0.00.0000 na tela + validação no servidor.
   Testes: 88 passando (7 novos marcados com [C1]).
   Ficha completa: docs/solicitacoes/C1-mascara-numero-processo.md
   ```

5. Clique em **Create pull request**. Na aba **Files changed**, revise as alterações.
6. Na setinha ao lado do botão verde, escolha **Create a merge commit**.
7. Clique em **Merge pull request** e depois em **Confirm merge**. Na caixa de mensagem, **não** acrescente linhas `Co-authored-by`.
8. Clique em **Delete branch**.

### Passo 8 — Atualizar o `main` no computador

```
git switch main
git pull
git branch -d correcao/C1-mascara-numero-processo
```

### Passo 9 — Publicar o site

```
npm run deploy
```

Abra <https://thamara-santana-advocacia.vercel.app>, aperte **Ctrl + F5** e repita o teste manual da seção 5.

### Passo 10 — Marcar a versão (opcional)

```
git tag -a v1.0.1 -m "Versao 1.0.1 - C1 mascara CNJ (Mariana Couto)"
git push origin v1.0.1
```

### Passo 11 — Conferir ausência de coautoria

```
git log -3 --format="%h  %an  %s"
git log --format=%B | findstr /i "co-authored"
```

O primeiro comando mostra só o seu nome como autor. O segundo **não mostra nada**.

### Passo 12 — Atualizar o status deste pedido

Na tabela de [`docs/solicitacoes/README.md`](README.md) e no topo desta ficha, troque o status para **"Publicada em DD/MM/AAAA"**. Depois registre com:

```
git add .
git commit -m "Atualiza status do C1 para publicado"
git push
```

---

## 7. Como desfazer, se necessário

- **Antes do merge:** rode `git switch main` e depois `git branch -D correcao/C1-mascara-numero-processo`, e apague o ramo no GitHub.
- **Depois do merge e da publicação:** no GitHub, abra o Pull Request do C1 e clique em **Revert**, ou rode no terminal `git revert -m 1 <código-do-merge>` seguido de `git push`. Depois rode `npm run deploy`.
