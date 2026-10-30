# C2 — Confirmar antes de sair do sistema

| Campo | Informação |
| ----- | ---------- |
| **Código** | C2 |
| **Tipo** | Correção |
| **Solicitado por** | Thamara Santana (cliente 3 na ordem de testes) |
| **Origem** | Teste de usuário de 30/10/2026. O mesmo problema já tinha aparecido na planilha de testes de 29/10, apontado por Juliana Prado |
| **Prioridade** | Alta |
| **Ramo no Git** | `correcao/C2-confirmar-saida` |
| **Versão** | 1.1.0 |
| **Status** | Publicada em 30/10/2026 — merge `eab86ab`, versão v1.1.0 |

---

## 1. O pedido (como foi relatado)

> **Testou e não funcionou:** o botão "Sair" desconecta na hora, sem perguntar. Ela clicou sem querer e perdeu um compromisso que estava preenchendo.
> **O que corrigir:** pedir confirmação antes de sair.

## 2. Causa

O botão **Sair**, no menu lateral (no celular, na barra inferior), chamava direto a função que apaga a sessão. Não havia nenhuma pergunta antes.

## 3. Solução

| Ação | Resultado |
| ---- | --------- |
| Clicar em **Sair** | Abre a janela **"Sair do sistema?"** com os botões **Cancelar** e **Sair** |
| Clicar em **Cancelar**, apertar **Esc** ou clicar fora da janela | Continua no sistema, sem perder nada |
| Clicar em **Sair** na janela | Sai e volta para a tela de entrada |
| Clicar em Sair com um formulário aberto | A janela avisa em amarelo: *"Há um formulário aberto. O que não foi salvo será perdido."* |

A janela usa o mesmo visual das confirmações de exclusão. A diferença é o tom neutro (dourado), sem o vermelho de "perigo", porque sair não apaga dados.

## 4. Arquivos alterados

Pesquise `[C2]` no VS Code (**Ctrl + Shift + F**) para ver cada trecho.

| Arquivo | Camada (MVC) | O que mudou |
| ------- | ------------ | ----------- |
| `frontend/src/app/core/logica/sessao.logica.ts` | Model (novo) | `perguntaSaida()`: texto da pergunta e aviso de formulário aberto |
| `frontend/src/app/core/confirmacao.service.ts` | Model (serviço) | Confirmações aceitam `icone` e `tom` (`perigo` ou `neutro`), sem mudar as confirmações existentes |
| `frontend/src/app/shared/confirmacao/confirmacao.ts` | View | Ícone e cor conforme o tom |
| `frontend/src/app/core/edicao.service.ts` | Model (serviço) | `formularioAberto()`: diz se há algum formulário aberto |
| `frontend/src/app/layout/shell.ts` / `shell.html` | Controller / View | O botão Sair chama `sair()`, que pergunta antes |
| `frontend/tests/sessao.logica.test.ts` | Teste (novo) | +2 testes |
| `README.md`, `CHANGELOG.md`, `docs/solicitacoes/*` | Documentação | Registro do pedido |

## 5. Testes

- Testes automáticos: **+2** (`[C2] perguntaSaida() ...`).
- **Teste manual:**
  1. Entre no sistema e clique em **Sair**. A janela de confirmação deve aparecer.
  2. Clique em **Cancelar**. Você deve continuar no sistema.
  3. Clique em **Sair** de novo e confirme. Deve voltar para a tela de entrada.

## 6. Como desfazer

No GitHub, abra o merge do ramo `correcao/C2-confirmar-saida` e use **Revert**. Ou, no terminal, rode `git revert -m 1 <código-do-merge>` seguido de `git push` e `npm run deploy`.
