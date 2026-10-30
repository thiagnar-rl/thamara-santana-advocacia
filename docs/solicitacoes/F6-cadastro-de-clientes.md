# F6 — Cadastro individual de clientes com aviso de aniversário

| Campo | Informação |
| ----- | ---------- |
| **Código** | F6 |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente 3 na ordem de testes) |
| **Origem** | Teste de usuário de 30/10/2026 |
| **Prioridade** | Alta |
| **Ramo no Git** | `melhoria/F6-cadastro-de-clientes` |
| **Versão** | 1.1.0 |
| **Status** | Implementada — aguardando merge e publicação |

---

## 1. O pedido (como foi relatado)

> Criar uma aba de **cadastro individual de clientes** com **aviso de aniversário**, contendo:
>
> **1. Dados de identificação pessoal ou corporativa**
> - *Pessoa física:* nome completo, nacionalidade, estado civil, profissão, RG, CPF e data de nascimento.
> - *Pessoa jurídica:* razão social (ou nome fantasia), CNPJ, inscrição estadual/municipal, ramo de atuação e dados do representante legal.
>
> **2. Dados de contato e localização**
> - Endereço completo (residencial ou sede da empresa, com CEP).
> - Telefone fixo, celular e WhatsApp.
> - E-mail principal para comunicações oficiais e notificações.
>
> Integrar de forma coesa com o que já existe, para que seja fluido, didático e não confuso.

## 2. Como ficou para a usuária

### 2.1 Nova aba "Clientes" no menu
O menu ficou assim: **Início · Agenda · Processos · Clientes**.

- **Lista de clientes:**
  - busca por nome, CPF/CNPJ (com ou sem pontuação), e-mail ou cidade;
  - filtro **Todos / Pessoa física / Pessoa jurídica**.
- **Cada cartão** mostra:
  - as iniciais, ou um ícone de prédio para empresas;
  - o documento;
  - o celular, o e-mail e a cidade;
  - quantos processos o cliente tem.
- **Ficha do cliente** (clicando no cartão):
  - **1. Dados pessoais / da empresa**, incluindo o representante legal;
  - **2. Contato e localização**, com links que abrem o telefone, o WhatsApp, o e-mail e o mapa;
  - **Processos** do cliente, com o botão **Novo processo**, que já vem com o cliente preenchido.

### 2.2 Formulário em duas partes, numeradas como no pedido

| Parte | Pessoa física | Pessoa jurídica |
| ----- | ------------- | --------------- |
| Escolha do tipo | Botão **Pessoa física** | Botão **Pessoa jurídica** |
| **1. Identificação** | Nome completo, CPF, RG, data de nascimento, nacionalidade, estado civil (lista) e profissão | Razão social, nome fantasia, CNPJ, inscrição estadual, inscrição municipal e ramo de atuação. **Representante legal:** nome, CPF, cargo e data de nascimento |
| **2. Contato e localização** | Celular, WhatsApp (com o atalho "usar o celular"), telefone fixo, e-mail principal e endereço residencial | Os mesmos campos, com o endereço da sede |

Facilidades do formulário:

- **Máscaras automáticas:** CPF `000.000.000-00`, CNPJ `00.000.000/0000-00`, CEP `00000-000` e telefones `(00) 00000-0000`.
- **Busca pelo CEP:** ao completar o CEP, rua, bairro, cidade e UF são preenchidos sozinhos, pelo serviço público ViaCEP. Se não houver internet, a usuária preenche à mão.
- **Conferência de documentos:** CPF e CNPJ têm os dígitos verificadores conferidos, e o sistema não aceita o mesmo CPF ou CNPJ duas vezes.
- **Troca de tipo:** ao trocar de PF para PJ, o que já foi digitado em contato e endereço é mantido.

### 2.3 Aviso de aniversário

Datas usadas no aviso:

- **pessoa física:** a data de nascimento do cliente;
- **pessoa jurídica:** a data de nascimento do representante legal.

O aviso aparece em quatro lugares:

| Onde | O que mostra |
| ---- | ------------ |
| **Início** (tela inicial) | Cartão **"Aniversários"** com os próximos 7 dias ("Hoje", "Amanhã", "em 3 dias") e o botão do WhatsApp com uma mensagem de parabéns pronta |
| **Menu "Clientes"** | Bolinha dourada com o número de aniversariantes **de hoje** |
| **Tela Clientes** | Faixa no topo ("Hoje é aniversário de…" ou "Aniversários nos próximos 7 dias"), com atalho para o WhatsApp |
| **Cartão e ficha do cliente** | Etiqueta "Aniversário hoje / em X dias", com a idade |

Quem nasceu em 29/02 é lembrado em 28/02 nos anos que não são bissextos.

### 2.4 Integração com os processos

- **Formulário de processo:** o campo **Cliente** sugere os clientes cadastrados enquanto se digita.
  - Escolhendo um da lista, aparece **"✓ Cliente cadastrado"** e o processo fica ligado ao cadastro.
  - Se o nome não estiver cadastrado, aparece **"Sem cadastro. Cadastrar cliente"**. O cadastro abre por cima, já com o nome, e ao salvar o cliente fica selecionado no processo, sem perder o que foi digitado.
- **Ficha do processo:** tem o atalho **"Ver ficha do cliente"**.
- **Nome do cliente alterado no cadastro:** o nome é atualizado também nos processos ligados a ele.
- **Cliente excluído:** os processos **não** são apagados, apenas deixam de estar ligados ao cadastro. A janela de confirmação avisa isso.
- **Processos antigos**, cadastrados antes desta versão:
  - continuam funcionando normalmente;
  - ao editar um deles, se já existir um cliente com o mesmo nome, ele é ligado sozinho.

## 3. Banco de dados

A mudança é aplicada sozinha, tanto no banco local quanto no Turso, na primeira vez que o sistema é aberto depois da atualização:

- **nova tabela `clientes`**, com todos os campos acima, ligada à usuária;
- **CPF e CNPJ não se repetem** para a mesma usuária, por índices únicos parciais;
- **nova coluna `processos.cliente_id`**, que é o vínculo com o cliente e é opcional.

**Nada é apagado nem alterado nos dados existentes.**

## 4. Arquivos

Pesquise `[F6]` no VS Code (**Ctrl + Shift + F**) para ver cada trecho.

### Backend (API)

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `src/config/database.ts` | Model (banco) | Tabela `clientes`, índices e migração de `processos.cliente_id` |
| `src/utils/documentos.ts` | Model (regras, **novo**) | CPF, CNPJ, CEP, telefone, UF, estado civil e cálculo do próximo aniversário |
| `src/models/cliente.model.ts` | Model (**novo**) | Validação, listagem com busca, CRUD, documento repetido e aniversariantes |
| `src/models/processo.model.ts` | Model | Campo `cliente_id` e `listarDoCliente()` |
| `src/views/cliente.view.ts` | View (**novo**) | JSON do cliente, sem `usuario_id` e com o aniversário calculado |
| `src/views/processo.view.ts` | View | Inclui `cliente_id` |
| `src/controllers/clientes.controller.ts` | Controller (**novo**) | `GET/POST/PUT/DELETE /api/clientes` e `GET /api/clientes/aniversariantes` |
| `src/controllers/processos.controller.ts` | Controller | Confere se o cliente é da usuária e usa o nome do cadastro |
| `src/routes/clientes.routes.ts`, `src/routes/index.ts` | Rotas | `/api/clientes`, com login obrigatório |

### Frontend (site)

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `core/models.ts` | Model | Tipos `Cliente`, `ClienteForm`, `ClienteDetalhe` e `Aniversario` |
| `core/logica/clientes.logica.ts` | Model (**novo**) | Máscaras, validações, textos do aniversário, links de WhatsApp e mapa |
| `core/api.service.ts` | Model (serviço) | Chamadas à API de clientes |
| `core/edicao.service.ts` | Model (serviço) | Abre, edita e exclui clientes; "Novo processo" com cliente |
| `shared/cliente-modal/*` | Controller + View (**novo**) | Formulário de cliente |
| `pages/clientes/*` | Controller + View (**novo**) | Lista de clientes e faixa de aniversários |
| `pages/cliente-detalhe/*` | Controller + View (**novo**) | Ficha do cliente |
| `app.routes.ts` | Rotas | `/clientes` e `/clientes/:id` |
| `layout/shell.*` | Controller + View | Item "Clientes" no menu e bolinha de aniversário |
| `pages/painel/*` | Controller + View | Cartão "Aniversários" na tela Início |
| `shared/processo-modal/*` | Controller + View | Sugestões de clientes e "Cadastrar cliente" |
| `pages/processo-detalhe/*` | View | Atalho "Ver ficha do cliente" |
| `shared/icone/icone.ts`, `styles.scss` | View | Novos ícones (clientes, bolo, telefone, WhatsApp, e-mail, prédio, documento) e estilos |

## 5. Testes

| Antes (v1.0.1 + C2) | Depois |
| ------------------- | ------ |
| 90 testes (67 backend + 23 frontend) | **116 testes (86 backend + 30 frontend)**, todos passando |

Testes novos, todos com `[F6]` no nome:

- `backend/tests/documentos.test.ts`: CPF, CNPJ, CEP, telefone e aniversário (virada do ano e 29/02).
- `backend/tests/cliente.model.test.ts`:
  - validação de PF e PJ;
  - isolamento entre usuárias;
  - busca e documento repetido;
  - nome sincronizado nos processos;
  - exclusão sem apagar processos;
  - aniversariantes.
- `backend/tests/clientes.controller.test.ts`: respostas da API (201, 400, 404 e 409), aniversariantes e vínculo processo → cliente.
- `frontend/tests/clientes.logica.test.ts`: máscaras, validações, aniversário, WhatsApp, endereço e busca por nome.

### Teste manual

1. Em **Clientes → Novo cliente**, cadastre uma pessoa física:
   - digite o CPF e o celular só com números e confira as máscaras;
   - digite um CEP e confira se o endereço se completa;
   - coloque a data de nascimento de **hoje**.
2. Salve. Confira:
   - a ficha do cliente abre;
   - em **Início**, aparece o cartão "Aniversários" com **Hoje**;
   - no menu **Clientes**, aparece a bolinha dourada.
3. Na ficha do cliente, clique em **Novo processo**. O cliente já vem preenchido, com "✓ Cliente cadastrado".
4. Em **Processos → Novo processo**, digite um nome novo e clique em **Cadastrar cliente**. Salve o cliente e confira se ele fica selecionado no processo.
5. Cadastre uma **pessoa jurídica** com o CNPJ e o representante legal.

## 6. Como desfazer

No GitHub, abra o merge do ramo `melhoria/F6-cadastro-de-clientes` e use **Revert**. Ou, no terminal, rode `git revert -m 1 <código-do-merge>` seguido de `git push` e `npm run deploy`.

A tabela `clientes` continua no banco, sem atrapalhar. Os processos voltam a usar só o nome digitado.
