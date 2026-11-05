# F10 — Perguntas frequentes no site

| Campo | Informação |
| ----- | ---------- |
| **Código** | F10 |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor) |
| **Origem** | Sugestões de melhoria do site (05/11/2026) |
| **Prioridade** | Média |
| **Ramo no Git** | `melhoria/F10-perguntas-frequentes` |
| **Versão** | 1.8.0 |
| **Status** | Publicada em 05/11/2026 (v1.8.0). Conferida no site pelo solicitante |

---

## 1. O pedido

> Perguntas frequentes, com 6 a 8 dúvidas comuns sobre divórcio, pensão, inventário e outros assuntos de alta curiosidade e relevância.

## 2. Como ficou

A página inicial ganhou a seção **"Perguntas frequentes"**, entre "Como funciona" e "Notícias". O menu do site ganhou o item **Dúvidas**.

- No computador, o título e o botão **"Tirar uma dúvida"** (WhatsApp) ficam à esquerda e acompanham a rolagem. As perguntas ficam à direita.
- **Filtros por área** acima da lista: Todas, Família, Trabalhista, Criminal, Sucessões e Cível.
- Cada pergunta abre e fecha com um clique (sanfona). A primeira já vem aberta.
- **Ordem por relevância**, a pedido da cliente: as dúvidas mais procuradas aparecem primeiro.

| # | Área | Pergunta | Base citada |
| - | ---- | -------- | ----------- |
| 1 | Família | Como é definido o valor da pensão alimentícia? | Art. 1.694 do Código Civil |
| 2 | Família | O que acontece se a pensão não for paga? | Rito da prisão (3 últimas parcelas) e rito da penhora |
| 3 | Família | Preciso de advogado para me divorciar? Dá para fazer em cartório? | Resolução CNJ 35/2007, alterada pela 571/2024 |
| 4 | Trabalhista | Fui demitido por justa causa. Quais direitos eu perco? | Art. 482 da CLT |
| 5 | Trabalhista | Trabalho sem carteira assinada. Tenho direitos? | Art. 3º da CLT |
| 6 | Sucessões | O inventário é obrigatório? Existe prazo para abrir? | Art. 611 do CPC; multa do ITCMD em SP |
| 7 | Família | A pensão acaba automaticamente quando o filho faz 18 anos? | Súmula 358 do STJ |
| 8 | Trabalhista | Qual é o prazo para entrar com uma ação trabalhista? | Art. 7º, XXIX, da Constituição |
| 9 | Trabalhista | Faço hora extra e não recebo. O que posso fazer? | Art. 7º, XVI, da Constituição |
| 10 | Criminal | Alguém da minha família foi preso em flagrante. O que acontece agora? | Audiência de custódia, art. 310 do CPP |
| 11 | Criminal | Como pedir medida protetiva pela Lei Maria da Penha? | Art. 18 da Lei 11.340/2006; telefones 190 e 180 |
| 12 | Criminal | Fui intimado para depor na delegacia. Preciso ir com advogado? | Art. 5º, LXIII, da Constituição (direito ao silêncio) |
| 13 | Trabalhista | Posso fazer um acordo com a empresa para sair do emprego? | Art. 484-A da CLT |
| 14 | Cível | Moro há muitos anos num imóvel sem escritura. Posso regularizar por usucapião? | Usucapião judicial ou em cartório |
| 15 | Família | Como funciona o reconhecimento de paternidade? | Cartório ou investigação com DNA |
| 16 | Criminal | O que é o acordo de não persecução penal (ANPP)? | Art. 28-A do CPP |

A ordem é uma estimativa das dúvidas mais comuns em escritórios de família, trabalhista e criminal. Para mudar a ordem, basta mudar a posição da pergunta na lista.

**Cuidados com a publicidade da OAB (Provimento 205/2021):**
- Os textos são informativos e gerais, sem promessa de resultado.
- A introdução avisa que cada caso tem particularidades.
- Um teste automático confere que nenhum texto promete resultado.

> Como a Thamara é advogada, vale ela revisar as respostas. Para mudar, incluir, tirar ou reordenar uma pergunta, edite a lista `PERGUNTAS` em `frontend/src/app/site/conteudo.ts`.

## 3. Arquivos

| Arquivo | O que mudou |
| ------- | ----------- |
| `frontend/src/app/site/conteudo.ts` | Listas `PERGUNTAS` (16, em ordem de relevância) e `AREAS_PERGUNTAS` (filtros) |
| `frontend/src/app/site/inicio/inicio.html`, `.ts` e `.scss` | Seção de dúvidas. A seção de Notícias passou a ter fundo marfim, para alternar com as dúvidas |
| `frontend/src/app/site/site-layout.ts` | Item **Dúvidas** no menu |
| `frontend/tests/site.logica.test.ts` | Testes das perguntas |

## 4. Testes

| Antes (v1.7.0) | Depois |
| -------------- | ------ |
| 199 testes | **201 testes (142 backend + 59 frontend)** |

O teste novo confere:
- que há 16 perguntas, sem repetição, de todas as áreas;
- que os temas pedidos estão cobertos (pensão, justa causa, hora extra, audiência de custódia, Maria da Penha, ANPP e outros);
- que nenhum texto promete resultado.

## 5. Como desfazer

No GitHub, abra o merge de `melhoria/F10-perguntas-frequentes` e use **Revert**.
