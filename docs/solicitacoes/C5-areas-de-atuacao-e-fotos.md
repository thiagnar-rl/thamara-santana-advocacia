# C5 — Site: áreas de atuação da Dra. Thamara e fotos novas

| Campo | Informação |
| ----- | ---------- |
| **Código** | C5 |
| **Tipo** | Correção / atualização de conteúdo do site |
| **Solicitado por** | Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor) |
| **Origem** | Mensagens da cliente (04/11/2026, 22h01 e 22h03) com a lista de especialidades, e duas fotos novas |
| **Prioridade** | Alta |
| **Ramo no Git** | `correcao/C5-areas-de-atuacao-e-fotos` |
| **Versão** | 1.6.2 |
| **Status** | Publicada em 05/11/2026 (v1.6.2). Conferida no site no computador e no celular |

---

## 1. O pedido

1. Na "Atuação da Dra. Thamara", colocar **Família e Sucessões** e também **Trabalhista**.
2. Trocar a foto da Thamara pelas **duas fotos novas**.
3. Onde estiver escrito "Família, Patrimônio e Sucessões", deixar só **"Família e Sucessões"**.
4. Incluir as especialidades enviadas pela cliente, de forma bem escrita e bonita:
   > Divórcio consensual litigioso, reconhecimento de paternidade, ação de alimentos (pensão) fixação, revisão e exoneração, cumprimento de sentença alimentos rito de penhora e prisão, inventário e partilha.
   >
   > Parte cível, usucapião, adjudicação compulsória, ação de indenização dano moral e material, obrigação de fazer, direito do consumidor dentre outros, contratos em geral (locação, compra e venda etc).
   >
   > Ações trabalhistas: reclamatória trabalhista pelo reclamante empregado e defesa pelo reclamado (empregador).

## 2. Como ficou

**Atuação da Dra. Thamara.** Virou um cartão em destaque, com 3 colunas. No celular, as colunas ficam uma embaixo da outra.

| Família e Sucessões | Cível | Trabalhista |
| ------------------- | ----- | ----------- |
| Divórcio consensual e litigioso | Usucapião | Reclamação trabalhista em favor do empregado (reclamante) |
| Reconhecimento de paternidade | Adjudicação compulsória | Defesa do empregador (reclamado) |
| Ação de alimentos (pensão): fixação, revisão e exoneração | Indenização por dano moral e material | |
| Cumprimento de sentença de alimentos, pelo rito da penhora ou da prisão | Obrigação de fazer | |
| Inventário e partilha de bens | Direito do consumidor | |
| | Contratos em geral: locação, compra e venda e outros | |

**Equipe do escritório.** Ficaram **Previdenciário** e **Criminal**, lado a lado. Trabalhista passou para a Dra. Thamara. Consumidor passou a fazer parte do Cível dela, para o mesmo assunto não aparecer duas vezes.

**Fotos.** Na seção "Sobre mim" está a foto nova da Thamara (no escritório, com blazer rosa). A segunda foto, com a estátua da Justiça e o cartão do escritório, aparece sobreposta no canto. As duas foram recortadas e otimizadas (JPG + WebP). A foto pequena dos artigos também foi atualizada.

**Textos.**
- "Família, Patrimônio e Sucessões" virou **"Família e Sucessões"** no site, nos filtros de notícias, na tela Publicações e na descrição do site para o Google e o WhatsApp.
- A apresentação passou a citar as três áreas: "Decisões sobre família e sucessões, tomadas com clareza" e "Orientação jurídica em Família e Sucessões, Cível e Trabalhista…".
- O "Sobre mim" foi reescrito para as novas áreas. Saíram as menções a holding e patrimônio.

## 3. Arquivos

Pesquise `[C5]` no VS Code (**Ctrl + Shift + F**).

| Arquivo | O que mudou |
| ------- | ----------- |
| `frontend/src/app/site/conteudo.ts` | Textos do "Sobre", `AREAS_THAMARA` (3 áreas) e `AREAS_EQUIPE` |
| `frontend/src/app/site/inicio/inicio.html`, `.ts` e `.scss` | Cartão com as 3 especialidades, equipe em 2 colunas e a segunda foto |
| `frontend/public/site/thamara.jpg` / `.webp` | Foto nova (720 × 900) |
| `frontend/public/site/escritorio.jpg` / `.webp` | Foto do detalhe do escritório (500 × 400) |
| `frontend/src/index.html` | Descrição do site |
| `frontend/src/app/site/noticias/noticias.ts`, `pages/publicacoes/publicacoes.ts`, `backend/src/config/site.ts` | Nome da área "Família e Sucessões" |
| `frontend/tests/site.logica.test.ts`, `backend/tests/noticias.test.ts` | Testes atualizados |

## 4. Testes

Continuam 196 testes, todos passando. O teste de conteúdo do site agora confere as 3 áreas da Dra. Thamara, as especialidades principais e a equipe (Previdenciário e Criminal).

## 5. Como desfazer

No GitHub, abra o merge do ramo `correcao/C5-areas-de-atuacao-e-fotos` e use **Revert**.
