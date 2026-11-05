# F8 — Agenda do sistema ligada à Google Agenda (nos dois sentidos)

| Campo | Informação |
| ----- | ---------- |
| **Código** | F8 |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente), pedido de 04/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor) |
| **Origem** | Pedido de 04/11/2026 |
| **Prioridade** | Alta |
| **Ramo no Git** | `melhoria/F8-google-agenda` |
| **Versão** | 1.5.0 |
| **Status** | Publicada em 05/11/2026 (v1.5.0). Google Cloud configurado e conta da Thamara conectada; testado no site em 05/11 (envio, recebimento e exclusão) |

---

## 1. O pedido (como foi relatado)

> Vincule a agenda do site com a agenda da conta Google… e vice-versa.

Combinado com o solicitante:
- A conta ligada é a **Google Agenda da Thamara**.
- Eventos criados direto no Google entram no sistema com o tipo novo **"Outro"**.

## 2. Como ficou

| Onde a mudança é feita | O que acontece |
| ---------------------- | -------------- |
| **No sistema**: criar, editar, concluir ou excluir um compromisso | O evento é criado, alterado ou apagado na Google Agenda **na hora**. |
| **No Google** (celular, Gmail, agenda do computador) | O sistema traz a mudança **ao abrir**, **a cada 5 minutos** com a tela aberta e **ao voltar para a aba**. Também há o botão **Sincronizar agora**. |

- **Título no Google:** "[Audiência] Audiência de conciliação". Quando concluído, aparece "✓ " na frente. Assim dá para ver o tipo no celular, e o tipo volta certo para o sistema.
- **Sem hora:** vira evento de dia inteiro. **Com hora:** evento de 1 hora.
- **Descrição do evento:** a descrição do compromisso e o número do processo com o(s) cliente(s).
- **Evento criado no Google:** entra como **Outro**. Se o título começar com "[Recurso]", "[Audiência]" etc., entra com esse tipo.
- **Eventos sincronizados:** de 30 dias atrás até 1 ano à frente.
- **Ao conectar:** os compromissos **pendentes de hoje em diante** são enviados para o Google.
- **Excluir um processo** também apaga do Google os eventos dos compromissos dele.
- **Desconectar:** os eventos que já estão no Google continuam lá, e os compromissos continuam no sistema.
- **No menu lateral:** o quadro "Google Agenda" com o e-mail conectado e os botões **Sincronizar agora** e **Desconectar**. Antes de conectar, aparece **Conectar Google Agenda**. Se o Google recusar o acesso, aparece **Reconectar o Google**.

## 3. Segurança

- O sistema guarda só a "chave de renovação" do Google, **cifrada** (AES-256-GCM, com chave derivada do `JWT_SECRET`). O acesso de curta duração (1 hora) fica só na memória do servidor.
- **Permissões pedidas ao Google:**
  - o e-mail da conta;
  - **criar, ver e editar eventos** da agenda;
  - no F1 (anexos): **só os arquivos que o próprio sistema criar** no Drive. O sistema não vê os outros arquivos da Thamara.
- O link de volta do Google leva um código assinado, válido por 10 minutos, que diz qual usuária pediu a conexão.
- A chave secreta do Google fica **só na Vercel**, nunca no GitHub.

## 4. Como funciona por dentro

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `backend/src/config/database.ts` | Model | Tipo `outro`, colunas `google_event_id` e `google_atualizado_em`, tabela `google_contas` (migração automática) |
| `backend/src/utils/google.ts` | Utilitário | Login do Google e chamadas às APIs (sem biblioteca nova) |
| `backend/src/utils/agenda-google.ts` | Utilitário | Converte compromisso ↔ evento do Google |
| `backend/src/utils/cripto.ts`, `utils/token.ts` | Utilitário | Cifra da chave e código assinado do retorno |
| `backend/src/models/google.model.ts` | Model | Conta Google conectada |
| `backend/src/models/agenda-google.model.ts` | Model | Envia e recebe as mudanças |
| `backend/src/controllers/google.controller.ts`, `routes/google.routes.ts` | Controller | Rotas `/api/google` |
| `backend/src/controllers/compromissos.controller.ts`, `processos.controller.ts` | Controller | Avisam o Google ao criar, alterar e excluir |
| `frontend/src/app/core/google.service.ts`, `core/logica/google.logica.ts` | Serviço | Sincronização automática e textos |
| `frontend/src/app/layout/shell.*` | View | Quadro "Google Agenda" no menu |
| `models.ts`, `rotulos.ts`, `painel.logica.ts`, `styles.scss` | Model/View | Tipo "Outro" (cinza) |

Pesquise `[F8]` no VS Code (**Ctrl + Shift + F**).

Se o Google estiver fora do ar, o compromisso é salvo no sistema do mesmo jeito. O erro aparece no quadro do menu, e o envio é refeito na próxima sincronização.

## 5. Configuração no Google Cloud (uma vez só — feita pelo Thiago, com a conta da Thamara)

1. Acesse <https://console.cloud.google.com> com a conta **thamarasantana.adv@gmail.com**. Crie um projeto chamado **Thamara Advocacia**.
2. Em **APIs e serviços → Biblioteca**, ative a **Google Calendar API** e a **Google Drive API**.
3. Em **APIs e serviços → Tela de consentimento OAuth** (ou "Google Auth Platform"):
   - Tipo **Externo**.
   - Nome do app: "Thamara Santana Advocacia"; e-mail de suporte: o da Thamara.
   - Em **Público-alvo**, clique em **Publicar app**, para colocar o app **Em produção**. Em "Teste", o acesso expira a cada 7 dias.
4. Em **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**.
   - **URIs de redirecionamento autorizados:** `https://thamara-santana-advocacia.vercel.app/api/google/retorno`
   - Copie o **ID do cliente** e a **Chave secreta do cliente**.
5. Na **Vercel**, no projeto `thamara-santana-advocacia`, abra **Settings → Environment Variables** e crie as variáveis abaixo. O valor vai sempre no campo **Value**.
   - `GOOGLE_CLIENT_ID` = o ID do cliente
   - `GOOGLE_CLIENT_SECRET` = a chave secreta
6. Faça **Redeploy**. Depois entre no sistema com a conta da Thamara e clique em **Conectar Google Agenda**.
   - O Google pode mostrar "O Google não verificou este app". Isso é normal para apps próprios. Clique em **Avançado → Acessar Thamara Santana Advocacia (não seguro)** e autorize.

## 6. Testes

| Antes (v1.4.0) | Depois |
| -------------- | ------ |
| 164 testes (118 backend + 46 frontend) | **184 testes (134 backend + 50 frontend)**, todos passando |

- **`backend/tests/google.test.ts`** usa um "Google de mentira", sem internet. Ele confere:
  - a conversão compromisso ↔ evento (fuso de Brasília, dia inteiro, "✓" de concluído e tipo no título);
  - a cifra da chave;
  - o login e o retorno, inclusive o código adulterado;
  - o envio ao criar, editar e excluir;
  - a chegada de eventos novos, alterados e apagados no Google;
  - o intervalo mínimo entre sincronizações;
  - o aviso de "reconectar" quando o Google recusa o acesso;
  - o "Desconectar".
- **`frontend/tests/google.logica.test.ts`:** textos do quadro, resumo da sincronização e o tipo "Outro" no gráfico do Início.

### Teste manual (depois da seção 5)
1. Clique em **Conectar Google Agenda**, escolha a conta da Thamara e autorize. O aviso "Google Agenda conectada!" aparece.
2. Crie um compromisso amanhã às 14h. Confira que ele aparece na Google Agenda do celular como "[Audiência] …".
3. No celular, crie um evento "Reunião com cliente". Clique em **Sincronizar agora** e confira que ele aparece na Agenda como **Outro**.
4. Mude o horário no celular e sincronize. O horário muda no sistema. Apague o evento no celular e sincronize. Ele some do sistema.

## 7. Como desfazer

- **Só desligar:** clique em **Desconectar** no menu, ou apague as variáveis `GOOGLE_CLIENT_*` na Vercel.
- **Tirar a funcionalidade do código:** no GitHub, abra o merge de `melhoria/F8-google-agenda` e use **Revert**. Ou rode `git revert -m 1 <código-do-merge>` e depois `git push`.
- As colunas novas do banco não atrapalham as versões anteriores.
