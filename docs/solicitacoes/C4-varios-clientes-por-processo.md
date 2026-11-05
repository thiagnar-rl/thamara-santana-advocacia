# C4 — Vários clientes por processo (e vários processos por cliente)

| Campo | Informação |
| ----- | ---------- |
| **Código** | C4 |
| **Tipo** | Correção |
| **Solicitado por** | Thiago Rinaldi Luna (responsável pelo projeto) |
| **Origem** | Pedido de 04/11/2026 |
| **Prioridade** | Alta |
| **Ramo no Git** | `correcao/C4-varios-clientes-por-processo` |
| **Versão** | 1.3.3 |
| **Status** | Pronta para publicar |

---

## 1. O pedido (como foi relatado)

> Quando cadastro um processo, ele só pode ser vinculado a um cliente. Porém, às vezes um mesmo cliente tem mais de um processo vinculado a ele, e isso precisa ser corrigido. E às vezes, em um mesmo processo, existe mais de um cliente atribuído; isso também precisa ser permitido.

## 2. Causa

O processo guardava **um único cliente**, em duas colunas da tabela `processos`: `cliente` (o nome) e `cliente_id` (o vínculo com o cadastro). Não havia como ligar o mesmo processo a dois clientes.

## 3. Solução

### 3.1 Na tela
- No formulário do processo, o campo **Cliente** ganhou o botão **"+ Adicionar outro cliente"**.
- Cada linha funciona como antes: sugere os clientes cadastrados, marca "Cliente cadastrado" ou oferece "Cadastrar cliente". Para tirar um cliente do processo, use o **×** da linha.
- Na ficha do processo aparecem **todos os clientes**. Os cadastrados têm link para a ficha de cada um.
- Na ficha do cliente aparecem **todos os processos em que ele está**, inclusive os que ele divide com outras pessoas.
- A busca de processos encontra o processo por qualquer um dos clientes.

### 3.2 No banco de dados
- **Tabela nova `processo_clientes`:** liga processo e cliente. Cada linha diz que um cliente pertence a um processo, então um processo pode ter muitos clientes e um cliente pode ter muitos processos.
- **Coluna nova `processos.clientes_nomes`:** guarda a lista completa, inclusive os nomes sem cadastro.
- A coluna `cliente` passa a ser o **resumo** usado nas listas (ex.: "Maria Souza; João Lima e mais 2", até 150 caracteres).
- **Os processos que já existem são convertidos sozinhos** quando o servidor liga. O cliente de cada um vira o primeiro da lista. Nada é apagado.
- Quando o cliente muda de nome no cadastro, o nome muda em todos os processos dele.
- Quando o cliente é excluído, os processos continuam com o nome dele, só sem o vínculo.

### 3.3 Na API
- `POST/PUT /api/processos` passa a aceitar `clientes: [{ nome, cliente_id }]` (até 30). O formato antigo (`cliente` e `cliente_id`) continua funcionando.
- Linhas vazias e clientes repetidos são ignorados.
- Um cliente de outra conta é recusado com o erro 400 "Cliente não encontrado.".

## 4. Arquivos

Pesquise `[C4]` no VS Code (**Ctrl + Shift + F**).

| Arquivo | Camada (MVC) | O que mudou |
| ------- | ------------ | ----------- |
| `backend/src/config/database.ts` | Model (banco) | Tabela `processo_clientes`, coluna `clientes_nomes` e conversão dos processos antigos |
| `backend/src/models/processo.model.ts` | Model | Lista de clientes, resumo, vínculos, renomear e desvincular cliente |
| `backend/src/models/cliente.model.ts` | Model | Total de processos pela tabela de ligação; renomear e excluir atualizam os processos |
| `backend/src/controllers/processos.controller.ts` | Controller | Confere cada cliente da lista |
| `backend/src/views/processo.view.ts` | View | Campo `clientes` no JSON |
| `frontend/src/app/core/models.ts`, `core/logica/formularios.logica.ts` | Model (tela) | Tipo `ClienteDoProcesso`, `clientesPreenchidos()` e validação |
| `frontend/src/app/shared/processo-modal/*` | View + Controller | Várias linhas de cliente no formulário |
| `frontend/src/app/pages/processo-detalhe/*` | View | Todos os clientes na ficha do processo |

## 5. Testes

| Antes (v1.3.2) | Depois |
| -------------- | ------ |
| 151 testes (111 backend + 40 frontend) | **159 testes (118 backend + 41 frontend)**, todos passando |

Testes novos `[C4]`:
- `backend/tests/processo-clientes.test.ts`:
  - vários clientes no mesmo processo;
  - o mesmo cliente em vários processos;
  - editar o processo, renomear e excluir o cliente;
  - cliente de outra conta e formato antigo;
  - resumo de 150 caracteres;
  - conversão dos processos antigos.
- `backend/tests/views.test.ts` e `frontend/tests/formularios.logica.test.ts`.

### Teste manual
1. Abra um processo existente e clique em **Editar**. O cliente dele deve aparecer na primeira linha.
2. Clique em **Adicionar outro cliente**, escolha mais um e salve. Os dois devem aparecer na ficha do processo.
3. Abra a ficha de um desses clientes. O processo deve aparecer na lista de processos dele.

## 6. Como desfazer

No GitHub, abra o merge do ramo `correcao/C4-varios-clientes-por-processo` e use **Revert**. Ou rode `git revert -m 1 <código-do-merge>` e depois `git push`. A tabela e a coluna novas podem ficar no banco, porque a versão anterior simplesmente não as usa.
