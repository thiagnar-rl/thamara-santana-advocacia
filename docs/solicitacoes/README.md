# Solicitações de correção e melhoria

Cada pedido de cliente/usuário recebe um código e uma ficha nesta pasta.

- **C** = correção de algo que não funcionou.
- **F** = funcionalidade nova.

| Código | Data do pedido | Solicitado por | Descrição | Ramo no Git | Status |
| ------ | -------------- | -------------- | --------- | ----------- | ------ |
| [C1](C1-mascara-numero-processo.md) | 29/10/2026 | Mariana Couto | Máscara e validação do número do processo no padrão CNJ | `correcao/C1-mascara-numero-processo` | Implementada — aguardando merge e publicação |
| C2 | 29/10/2026 | Juliana Prado | Confirmar antes de sair do sistema | — | Pendente |
| C3 | 29/10/2026 | Pedro Nogueira | Exigir senha mais forte no cadastro | — | Pendente |

## Como registrar um novo pedido

1. Escolha o próximo código livre (ex.: `C4`).
2. Copie uma ficha existente com o nome `C4-descricao-curta.md` e preencha.
3. Acrescente uma linha na tabela acima e um item no [`CHANGELOG.md`](../../CHANGELOG.md).
4. Crie o ramo `correcao/C4-descricao-curta` (ou `melhoria/F…` para funcionalidades novas).
5. No código e nos testes, marque os trechos alterados com `[C4]`.
