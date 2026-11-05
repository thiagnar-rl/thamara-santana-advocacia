# F4 — Botão Imprimir (agenda, processo, cliente e lista de processos)

| Campo | Informação |
| ----- | ---------- |
| **Código** | F4 (o mesmo código reservado na planilha de testes de 29/10: "imprimir ou exportar a agenda da semana em PDF", apontado por Pedro Nogueira) |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente), pedido de 04/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor); já sugerido por Pedro Nogueira (teste 5) |
| **Origem** | Pedido de 04/11/2026 |
| **Prioridade** | Média |
| **Ramo no Git** | `melhoria/F4-imprimir` |
| **Versão** | 1.4.0 |
| **Status** | Publicada em 05/11/2026 (v1.4.0) |

---

## 1. O pedido (como foi relatado)

> Quero também um botão de imprimir.

Combinado com o solicitante: o botão aparece em **todas** estas telas: Agenda (semana ou mês), ficha do processo, ficha do cliente e lista de processos.

## 2. Como ficou

| Tela | O que imprime |
| ---- | ------------- |
| **Agenda** | O botão **Imprimir** abre um menu com 3 opções: **Semana** (domingo a sábado da semana atual ou do dia selecionado), **Mês inteiro** (o mês do calendário) ou **Lista desta tela** (com os filtros aplicados). |
| **Ficha do processo** | Número, clientes, parte contrária, vara, área, situação, observações e todos os compromissos. |
| **Ficha do cliente** | Identificação (pessoa física ou jurídica), representante legal, contato e endereço, observações e processos. |
| **Lista de processos** | Tabela com os processos do filtro e da busca aplicados na tela. |

- A folha sai em **A4**, com o **timbre do escritório**: monograma, "Thamara Santana · Advocacia e Consultoria Jurídica · OAB/SP 500.770".
- No rodapé aparecem a data e a hora da impressão e o aviso "documento de uso interno, com dados sigilosos de clientes".
- Campos vazios não aparecem no papel.
- **Para salvar em PDF:** na janela de impressão, escolha **"Salvar como PDF"** em "Destino".

## 3. Como funciona por dentro

- Cada tela monta um "documento" (título e seções) com as funções puras de `core/logica/impressao.logica.ts`.
- O componente `<app-impressao>` desenha esse documento. Ele fica escondido na tela e só aparece na impressão.
- Durante a impressão, o resto da página é escondido pelo bloco `@media print` do `styles.scss`. Um Ctrl + P comum continua imprimindo a página normal.
- Não mexe no servidor nem no banco de dados.

## 4. Arquivos

Pesquise `[F4]` no VS Code (**Ctrl + Shift + F**).

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `frontend/src/app/core/logica/impressao.logica.ts` | Model (tela) | Monta os documentos de impressão |
| `frontend/src/app/core/impressao.service.ts` | Serviço | Abre a janela de impressão |
| `frontend/src/app/shared/impressao/impressao.ts` | View | Folha A4 com o timbre |
| `frontend/src/app/app.ts`, `frontend/src/styles.scss` | View | Folha na raiz e regras de impressão |
| `pages/agenda/*`, `pages/processo-detalhe/*`, `pages/cliente-detalhe/*`, `pages/processos/*` | View + Controller | Botões **Imprimir** |
| `shared/icone/icone.ts` | View | Ícone de impressora |

## 5. Testes

| Antes (v1.3.3) | Depois |
| -------------- | ------ |
| 159 testes (118 backend + 41 frontend) | **164 testes (118 backend + 46 frontend)**, todos passando |

Teste novo: `frontend/tests/impressao.logica.test.ts`. Ele confere:
- as datas, a semana de domingo a sábado e o mês;
- a ordem e a situação dos compromissos;
- vários clientes no mesmo processo;
- pessoa física e pessoa jurídica;
- o filtro aplicado na lista de processos.

### Teste manual
1. Na **Agenda**, clique em **Imprimir → Semana**. A janela de impressão abre só com a tabela da semana e o timbre.
2. Em "Destino", escolha **Salvar como PDF** e confira o arquivo.
3. Repita o teste na ficha de um processo, na ficha de um cliente e na lista de processos.

## 6. Como desfazer

No GitHub, abra o merge do ramo `melhoria/F4-imprimir` e use **Revert**. Ou rode `git revert -m 1 <código-do-merge>` e depois `git push`.
