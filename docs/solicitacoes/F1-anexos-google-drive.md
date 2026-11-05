# F1 — Anexar documentos (clientes, processos e compromissos) no Google Drive

| Campo | Informação |
| ----- | ---------- |
| **Código** | F1 (o mesmo código reservado na planilha de testes de 29/10: "anexar documentos") |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente), pedido de 04/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor) |
| **Origem** | Pedido de 04/11/2026 |
| **Prioridade** | Alta |
| **Ramo no Git** | `melhoria/F1-anexos-google-drive` |
| **Versão** | 1.6.0 |
| **Status** | Publicada em 05/11/2026 (v1.6.0). Testado no site em 05/11: envio ao Drive, registro e lixeira ao excluir |

---

## 1. O pedido (como foi relatado)

> Botões de anexar documentos nos tipos de compromissos, bem como atribuídos ao cliente e também atribuídos ao processo.

Combinado com o solicitante: os arquivos ficam no **Google Drive da Thamara**, usando a mesma conexão Google do F8.

## 2. Como ficou

| Onde | Como anexar |
| ---- | ----------- |
| **Ficha do processo** | Quadro **Documentos**, abaixo das observações. Botão **Anexar**. |
| **Ficha do cliente** | Quadro **Documentos**, abaixo dos processos. Botão **Anexar**. |
| **Compromisso** | Abra o compromisso (editar). O quadro **Documentos** fica no fim do formulário. Num compromisso novo, salve primeiro. |

- Dá para escolher **vários arquivos de uma vez**. Cada um pode ter até **50 MB** (PDF, Word, fotos, planilhas, áudio etc.). Uma barra mostra o progresso do envio.
- Clicar no nome **abre o arquivo no Google Drive**.
- **Excluir** pede confirmação. O arquivo vai para a **lixeira do Drive**, onde pode ser recuperado por 30 dias.
- **Excluir o cliente, o processo ou o compromisso** também manda os documentos dele para a lixeira. Isso inclui os compromissos apagados no Google Agenda.
- **Na impressão** (F4), a ficha do processo e a do cliente trazem a lista "Documentos anexados".
- **Sem a conta Google conectada,** o quadro mostra o botão **Conectar Google**.

### Onde ficam no Drive
```
Meu Drive
└── Thamara Santana Advocacia
    ├── Clientes
    ├── Processos
    └── Compromissos
```
As pastas são criadas sozinhas no primeiro envio. Se alguém apagar uma pasta no Drive, ela é criada de novo.

## 3. Segurança

- Permissão `drive.file`: o sistema **só enxerga os arquivos que ele mesmo criou**. Os outros arquivos do Drive da Thamara continuam invisíveis para ele.
- O arquivo vai do navegador **direto para o Google Drive**. Ele não passa pela Vercel nem fica no banco do sistema. O banco guarda só o nome, o tamanho e o link.
- Antes de registrar um anexo, o servidor confere **no próprio Drive** que o arquivo foi criado pelo sistema, para aquela usuária e para aquele registro.
- Os arquivos continuam **privados** no Drive da Thamara. Ninguém mais tem acesso pelo link.

## 4. Como funciona por dentro

Envio em 3 passos:
1. O sistema pede ao servidor para abrir o envio.
2. O navegador manda o arquivo ao Drive.
3. O servidor registra o anexo.

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `backend/src/config/database.ts` | Model | Tabelas `anexos` e `google_pastas` (criadas sozinhas) |
| `backend/src/utils/drive.ts` | Utilitário | Chamadas ao Google Drive (pastas, envio, lixeira) |
| `backend/src/models/anexo.model.ts` | Model | Regras dos anexos |
| `backend/src/views/anexo.view.ts` | View | JSON público (sem o id interno do Drive) |
| `backend/src/controllers/anexos.controller.ts`, `routes/anexos.routes.ts` | Controller | Rotas `/api/anexos` |
| `controllers/clientes|processos|compromissos.controller.ts`, `models/agenda-google.model.ts` | Controller/Model | Levam os anexos junto ao excluir |
| `frontend/src/app/shared/anexos/*` | View + Controller | Quadro **Documentos** |
| `frontend/src/app/core/logica/anexos.logica.ts` | Model (tela) | Tamanho, tipo e validação |
| `pages/processo-detalhe/*`, `pages/cliente-detalhe/*`, `shared/compromisso-modal/*` | View | Quadro nas três telas |
| `core/logica/impressao.logica.ts` | Model (tela) | Lista de anexos na impressão |

Pesquise `[F1]` no VS Code (**Ctrl + Shift + F**).

| Rota | O que faz |
| ---- | --------- |
| `GET /api/anexos?tipo=processo&id=5` | Lista |
| `POST /api/anexos/envio` | Abre o envio no Drive (devolve o endereço) |
| `POST /api/anexos` | Registra o arquivo enviado |
| `DELETE /api/anexos/:id` | Manda para a lixeira do Drive |

## 5. Configuração

Nada além do F8: a permissão do Drive já é pedida ao conectar o Google. A **Google Drive API** precisa estar ativada no Google Cloud (passo 2 da ficha F8).

## 6. Testes

| Antes (v1.5.0) | Depois |
| -------------- | ------ |
| 184 testes (134 backend + 50 frontend) | **196 testes (142 backend + 54 frontend)**, todos passando |

- **`backend/tests/anexos.test.ts`** usa um "Google Drive de mentira". Ele confere:
  - a criação e a reutilização das pastas;
  - a pasta apagada no Drive sendo recriada;
  - o envio com a origem do site;
  - o aviso "conecte o Google";
  - o limite de 50 MB;
  - o bloqueio de registro de outra usuária e de arquivo que o sistema não criou;
  - a lixeira ao excluir;
  - a exclusão em cascata (processo → compromissos → anexos).
- **`frontend/tests/anexos.logica.test.ts`:** tamanho legível, tipo do arquivo, validação e a lista de anexos na impressão.

### Teste manual (com o Google conectado)
1. Na ficha de um processo, clique em **Anexar** e escolha um PDF. A barra de progresso aparece, e depois o documento aparece na lista.
2. Clique no nome. O arquivo abre no Google Drive, na pasta "Thamara Santana Advocacia/Processos".
3. Imprima a ficha. A lista "Documentos anexados" aparece no fim.
4. Exclua o documento e confira que ele está na lixeira do Drive.
5. Repita na ficha de um cliente e num compromisso (editar).

## 7. Como desfazer

No GitHub, abra o merge de `melhoria/F1-anexos-google-drive` e use **Revert**. Ou rode `git revert -m 1 <código-do-merge>` e depois `git push`. Os arquivos que já foram anexados continuam no Drive.
