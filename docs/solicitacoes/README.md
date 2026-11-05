# Solicitações de correção e melhoria

Cada pedido de cliente/usuário recebe um código e uma ficha nesta pasta.

- **C** = correção de algo que não funcionou.
- **F** = funcionalidade nova.

| Código | Data do pedido | Solicitado por | Descrição | Ramo no Git | Status |
| ------ | -------------- | -------------- | --------- | ----------- | ------ |
| [C1](C1-mascara-numero-processo.md) | 29/10/2026 | Mariana Couto | Máscara e validação do número do processo no padrão CNJ | `correcao/C1-mascara-numero-processo` | Publicada em 29/10/2026 (PR #1, v1.0.1) |
| [C2](C2-confirmar-saida.md) | 30/10/2026 | Thamara Santana (cliente 3) — já apontado por Juliana Prado na planilha de 29/10 | Confirmar antes de sair do sistema | `correcao/C2-confirmar-saida` | Publicada em 30/10/2026 (v1.1.0) |
| [C3](C3-senha-forte.md) | 30/10/2026 | Pedro Nogueira (teste 5) | Exigir senha forte no cadastro: mín. 8 caracteres, com letras e números | `correcao/C3-senha-forte` | Publicada em 30/10/2026 (v1.2.1) |
| [C4](C4-varios-clientes-por-processo.md) | 04/11/2026 | Thiago Rinaldi Luna | Processo com vários clientes, e cliente com vários processos | `correcao/C4-varios-clientes-por-processo` | Pronta para publicar (v1.3.3) |
| [F1](F1-anexos-google-drive.md) | 04/11/2026 | Thiago Rinaldi Luna — já listado na planilha de 29/10 | Anexar documentos (clientes, processos e compromissos) no Google Drive da Thamara | `melhoria/F1-anexos-google-drive` | Pronta para publicar (v1.6.0) |
| [F3](F3-esqueci-minha-senha.md) | 30/10/2026 | Thamara Santana (cliente 3) — já listado na planilha de 29/10 | "Esqueci minha senha": recuperação de acesso por link no e-mail | `melhoria/F3-esqueci-minha-senha` | Publicada em 30/10/2026 (v1.2.0) — envio por Gmail configurado e testado |
| [F4](F4-imprimir.md) | 04/11/2026 | Thiago Rinaldi Luna — já sugerido por Pedro Nogueira na planilha de 29/10 | Botão Imprimir na agenda, fichas de processo e cliente e lista de processos | `melhoria/F4-imprimir` | Pronta para publicar (v1.4.0) |
| [F6](F6-cadastro-de-clientes.md) | 30/10/2026 | Thamara Santana (cliente 3) | Cadastro individual de clientes (PF/PJ) com aviso de aniversário, integrado aos processos | `melhoria/F6-cadastro-de-clientes` | Publicada em 30/10/2026 (v1.1.0) |
| [F7](F7-site-institucional.md) | 04/11/2026 | Thiago Rinaldi Luna | Site institucional (landing page) com Sobre, Atuação, Notícias diárias, Contato e redes sociais; sistema em `/sistema` | `melhoria/F7-site-institucional` | Publicada em 04/11/2026 (v1.3.0); ajustes nas notícias na v1.3.1 e v1.3.2 |
| [F8](F8-google-agenda.md) | 04/11/2026 | Thiago Rinaldi Luna | Agenda do sistema ligada à Google Agenda da Thamara, nos dois sentidos (tipo novo "Outro") | `melhoria/F8-google-agenda` | Pronta para publicar (v1.5.0) |

> F2 e F5 são sugestões da planilha de testes de 29/10 (lembretes e tela de perfil), ainda não pedidas formalmente. A F1 (anexos) foi pedida em 04/11. A F3 ("esqueci minha senha") foi pedida por Thamara Santana em 30/10.

## Como registrar um novo pedido

1. Escolha o próximo código livre (ex.: `C4` ou `F8`).
2. Copie uma ficha existente com o nome `C4-descricao-curta.md` e preencha.
3. Acrescente uma linha na tabela acima e um item no [`CHANGELOG.md`](../../CHANGELOG.md).
4. Crie o ramo `correcao/C4-descricao-curta` (ou `melhoria/F…` para funcionalidades novas).
5. No código e nos testes, marque os trechos alterados com `[C4]`.
