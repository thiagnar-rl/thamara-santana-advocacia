# Solicitações de correção e melhoria

Cada pedido de cliente/usuário recebe um código e uma ficha nesta pasta.

- **C** = correção de algo que não funcionou.
- **F** = funcionalidade nova.

| Código | Data do pedido | Solicitado por | Descrição | Ramo no Git | Status |
| ------ | -------------- | -------------- | --------- | ----------- | ------ |
| [C1](C1-mascara-numero-processo.md) | 29/10/2026 | Mariana Couto | Máscara e validação do número do processo no padrão CNJ | `correcao/C1-mascara-numero-processo` | Publicada em 29/10/2026 (PR #1, v1.0.1) |
| [C2](C2-confirmar-saida.md) | 30/10/2026 | Thamara Santana (cliente 3) — já apontado por Juliana Prado na planilha de 29/10 | Confirmar antes de sair do sistema | `correcao/C2-confirmar-saida` | Implementada — aguardando merge e publicação |
| C3 | 29/10/2026 | Pedro Nogueira | Exigir senha mais forte no cadastro | — | Pendente |

## Como registrar um novo pedido

1. Escolha o próximo código livre (ex.: `C4`).
2. Copie uma ficha existente com o nome `C4-descricao-curta.md` e preencha.
3. Acrescente uma linha na tabela acima e um item no [`CHANGELOG.md`](../../CHANGELOG.md).
4. Crie o ramo `correcao/C4-descricao-curta` (ou `melhoria/F…` para funcionalidades novas).
5. No código e nos testes, marque os trechos alterados com `[C4]`.
