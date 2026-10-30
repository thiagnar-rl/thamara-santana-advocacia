# Solicitações de correção e melhoria

Cada pedido de cliente/usuário recebe um código e uma ficha nesta pasta.

- **C** = correção de algo que não funcionou.
- **F** = funcionalidade nova.

| Código | Data do pedido | Solicitado por | Descrição | Ramo no Git | Status |
| ------ | -------------- | -------------- | --------- | ----------- | ------ |
| [C1](C1-mascara-numero-processo.md) | 29/10/2026 | Mariana Couto | Máscara e validação do número do processo no padrão CNJ | `correcao/C1-mascara-numero-processo` | Publicada em 29/10/2026 (PR #1, v1.0.1) |
| [C2](C2-confirmar-saida.md) | 30/10/2026 | Thamara Santana (cliente 3) — já apontado por Juliana Prado na planilha de 29/10 | Confirmar antes de sair do sistema | `correcao/C2-confirmar-saida` | Publicada em 30/10/2026 (v1.1.0) |
| [C3](C3-senha-forte.md) | 30/10/2026 | Pedro Nogueira (teste 5) | Exigir senha forte no cadastro: mín. 8 caracteres, com letras e números | `correcao/C3-senha-forte` | Implementada — aguardando merge e publicação |
| [F3](F3-esqueci-minha-senha.md) | 30/10/2026 | Thamara Santana (cliente 3) — já listado na planilha de 29/10 | "Esqueci minha senha": recuperação de acesso por link no e-mail | `melhoria/F3-esqueci-minha-senha` | Publicada em 30/10/2026 (v1.2.0) — envio por Gmail configurado e testado |
| [F6](F6-cadastro-de-clientes.md) | 30/10/2026 | Thamara Santana (cliente 3) | Cadastro individual de clientes (PF/PJ) com aviso de aniversário, integrado aos processos | `melhoria/F6-cadastro-de-clientes` | Publicada em 30/10/2026 (v1.1.0) |

> F1, F2, F4 e F5 são sugestões da planilha de testes de 29/10 (anexos, lembretes, exportar PDF e tela de perfil), ainda não pedidas formalmente. A F3 ("esqueci minha senha") foi pedida por Thamara Santana em 30/10.

## Como registrar um novo pedido

1. Escolha o próximo código livre (ex.: `C4`).
2. Copie uma ficha existente com o nome `C4-descricao-curta.md` e preencha.
3. Acrescente uma linha na tabela acima e um item no [`CHANGELOG.md`](../../CHANGELOG.md).
4. Crie o ramo `correcao/C4-descricao-curta` (ou `melhoria/F…` para funcionalidades novas).
5. No código e nos testes, marque os trechos alterados com `[C4]`.
