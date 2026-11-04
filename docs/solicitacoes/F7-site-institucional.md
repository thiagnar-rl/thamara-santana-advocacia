# F7 — Site institucional (landing page) com o sistema como ferramenta

| Campo | Informação |
| ----- | ---------- |
| **Código** | F7 |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thiago Rinaldi Luna (desenvolvedor e responsável pelo projeto) |
| **Origem** | Pedido de 04/11/2026, com timbre, logo, foto e dados de contato enviados por ele |
| **Prioridade** | Alta |
| **Ramo no Git** | `melhoria/F7-site-institucional` |
| **Versão** | 1.3.0, com ajuste na 1.3.1 |
| **Status** | Publicada em 04/11/2026 (v1.3.0). Ajuste das fontes de notícias na v1.3.1 |

---

## 1. O pedido (como foi relatado)

> Escalar o projeto e transformá-lo em uma **landing page moderna**. O que já foi desenvolvido fica como **uma das ferramentas dentro do site**.
> No site: uma aba **só de notícias e atualizações diárias**, **sobre mim**, **contatos** e **links para as redes sociais** (Instagram e WhatsApp).

Decisões tomadas com o solicitante:

- **Notícias:** automáticas (fontes jurídicas, todos os dias) **e** textos escritos pela própria advogada no sistema.
- **Endereço:** o site abre na página inicial e o sistema passa para `/sistema`, com o botão **Área restrita** no topo do site.
- **Domínio próprio:** a sugestão é `thamarasantana.adv.br` (registro.br, exclusivo para advogados). Ver a seção 6.
- **Sobre mim:** texto enviado pela Dra. Thamara, reescrito em tom mais profissional. As demais áreas aparecem como atendidas pela **equipe do escritório**, "para que não pareça que eu faça de tudo".

Dados enviados: Thamara de Oliveira Santana do Carmo, OAB/SP 500.770. Áreas: Família, Previdenciário, Trabalhista, Consumidor e Criminal. WhatsApp +55 13 99183-5059, Instagram @thamarasantana.adv, e-mail thamarasantana.adv@gmail.com. Endereço: Rua Montenegro, 587, sala 4, Vila Maia, Guarujá/SP, CEP 11410-040. Atendimento em Santos, São Vicente e Praia Grande, e online.

## 2. O que foi feito

### 2.1 Site público (sem login)

| Endereço | Conteúdo |
| -------- | -------- |
| `/` | Página inicial com as seções: **Apresentação**, **Sobre mim** (com foto), **Áreas de atuação** (Família em destaque + equipe), **Como funciona o atendimento**, **Notícias** (as 3 mais recentes) e **Contato** (WhatsApp, Instagram, e-mail e **mapa do Google** com o botão "Como chegar"). |
| `/noticias` | Aba **Notícias**: publicações do escritório e notícias jurídicas do dia, com filtro por área. |
| `/noticias/:id` | Página de uma publicação do escritório (texto completo). |

O site tem ainda topo com menu (que vira menu "sanduíche" no celular), rodapé com contatos e o número da OAB, e um **botão do WhatsApp** fixo no canto da tela.

### 2.2 Notícias automáticas

- O servidor busca os feeds RSS de **STJ, ConJur e Agência Brasil (Justiça)**. A lista fica em `backend/src/config/site.ts`. CNJ e Migalhas foram testados no teste local e ficaram de fora: o CNJ não oferece mais feed e o da Migalhas dá erro 404.
- As datas do STJ vêm em português ("Qua, nov 4 2026 17:11:00"); o sistema entende esse formato e usa o horário de Brasília.
- Cada notícia recebe a **área de atuação** a que pertence. As que não têm relação com nenhuma área do escritório **não aparecem**.
- A busca acontece quando alguém abre o site e a última busca tem mais de **3 horas**. Cada fonte tem no máximo 5 segundos para responder; se uma fonte cair, o site mostra as notícias que já tinha.
- O site mostra só o **título e o resumo**, com link para a notícia completa no site de origem.
- Para conferir se as fontes estão respondendo, abra `/api/publico/noticias/fontes`.

### 2.3 Publicações da advogada (dentro do sistema)

- O sistema ganhou o menu **Publicações** (no celular aparece como **Notícias**).
- Nele a advogada escreve título, área, resumo (opcional) e texto, e escolhe entre **Publicar no site** e **Rascunho**.
- **Segurança:** só aparecem no site os textos das contas autorizadas.
  - Se a variável `SITE_AUTORES` estiver configurada na Vercel (e-mails separados por vírgula), valem os e-mails dela.
  - Sem a variável, vale a **conta mais antiga** do sistema.
  - Assim, se alguém criar uma conta, não consegue publicar no site do escritório.

### 2.4 Sistema em `/sistema`

- Todas as telas do sistema passaram para `/sistema/...` (`/sistema/entrar`, `/sistema/processos`...).
- **Os endereços antigos continuam funcionando:** `/entrar`, `/processos/12` e o link do e-mail "Esqueci minha senha" redirecionam sozinhos.
- O menu lateral ganhou **Ver o site**.
- O `robots.txt` pede ao Google que não mostre o `/sistema`.

### 2.5 Publicidade da advocacia (OAB)

O texto segue o Provimento 205/2021 da OAB:
- é informativo e sóbrio;
- mostra o nome e a OAB/SP 500.770;
- não promete resultado;
- não mostra preços;
- não usa o título "especialista".

O aviso "conteúdo informativo, não substitui a orientação jurídica individualizada" aparece no rodapé, nas notícias e nas publicações.

## 3. Arquivos

Pesquise `[F7]` no VS Code (**Ctrl + Shift + F**).

| Arquivo | Camada (MVC) | O que é |
| ------- | ------------ | ------- |
| `backend/src/config/site.ts` | Configuração | Áreas de atuação, palavras de cada área e fontes de notícias |
| `backend/src/config/database.ts` | Model (banco) | Tabelas `publicacoes`, `noticias_externas` e `site_metadados` |
| `backend/src/utils/rss.ts` | Model (regra) | Leitura de feeds RSS/Atom, sem biblioteca externa |
| `backend/src/models/noticia.model.ts` | Model | Busca, classificação por área e cache das notícias |
| `backend/src/models/publicacao.model.ts` | Model | Publicações da advogada e quem pode publicar no site |
| `backend/src/views/site.view.ts` | View | Formato JSON público (sem `usuario_id`) |
| `backend/src/controllers/site.controller.ts` | Controller | Rotas públicas `/api/publico/...` |
| `backend/src/controllers/publicacoes.controller.ts` | Controller | Rotas `/api/publicacoes` (com login) |
| `backend/src/routes/publico.routes.ts`, `publicacoes.routes.ts`, `index.ts` | Rotas | Ligação das rotas novas |
| `backend/src/controllers/auth.controller.ts` | Controller | O link do e-mail agora aponta para `/sistema/redefinir-senha` |
| `frontend/src/app/site/conteudo.ts` | Conteúdo | **Todos os textos e contatos do site, num lugar só** |
| `frontend/src/app/site/site-layout.*` | View | Topo, rodapé e botão do WhatsApp |
| `frontend/src/app/site/inicio/*` | View + Controller | Página inicial |
| `frontend/src/app/site/noticias/*` | View + Controller | Aba Notícias |
| `frontend/src/app/site/artigo/*` | View + Controller | Página de uma publicação |
| `frontend/src/app/pages/publicacoes/*` | View + Controller | Tela Publicações do sistema |
| `frontend/src/app/core/logica/site.logica.ts` | Model (tela) | Links de WhatsApp/Instagram/Mapa, datas e parágrafos |
| `frontend/src/app/app.routes.ts` | Rotas | Site em `/`, sistema em `/sistema` e redirecionamentos |
| `frontend/src/estilos/_site.scss` | Estilo | Visual compartilhado do site |
| `frontend/src/index.html`, `frontend/public/robots.txt`, `frontend/public/site/*` | Site | Descrição para Google/WhatsApp, fotos otimizadas e imagem de compartilhamento |
| Telas do sistema (links internos) | View | Links trocados de `/processos` para `/sistema/processos` etc. |

## 4. Testes

| Antes (v1.2.1) | Depois |
| -------------- | ------ |
| 130 testes (96 backend + 34 frontend) | **149 testes (109 backend + 40 frontend)**, todos passando |

Testes novos `[F7]`:
- `backend/tests/rss.test.ts`: leitura de RSS e Atom, HTML no resumo, links perigosos e codificação ISO-8859-1.
- `backend/tests/noticias.test.ts`: classificação por área (sem confundir "empresa" com "presa" ou "sucesso" com "sucessão"), intervalo de 3 horas, fonte fora do ar e rotas públicas.
- `backend/tests/publicacoes.test.ts`: validação, contas autorizadas, rascunho que não aparece no site e data da primeira publicação.
- `frontend/tests/site.logica.test.ts`: links, datas no horário de Brasília, parágrafos e dados de contato.

### Teste manual (depois de publicar)

1. Abra o site e confira as seções. Clique em **WhatsApp**, **Instagram**, **e-mail** e **Como chegar**.
2. Abra **Notícias** e teste os filtros por área.
3. Clique em **Área restrita**, entre no sistema e crie uma publicação em **Publicações**. Ela deve aparecer em **Notícias** no site.
4. Abra o endereço antigo `/entrar`: ele deve ir sozinho para `/sistema/entrar`.

## 5. Como desfazer

No GitHub, abra o merge do ramo `melhoria/F7-site-institucional` e use **Revert**. Ou, no terminal, rode `git revert -m 1 <código-do-merge>`, depois `git push` e `npm run deploy`. As tabelas novas podem ficar no banco, porque não atrapalham nada.

## 6. Domínio próprio (opcional)

1. No **registro.br**, compre `thamarasantana.adv.br` no CPF da Dra. Thamara. O `.adv.br` exige inscrição na OAB e custa cerca de R$ 40 por ano.
2. Na Vercel, abra **Settings → Domains → Add** e digite o domínio. A Vercel mostra os registros de DNS que devem ser criados no registro.br.
3. Na Vercel, ajuste `APP_URL=https://thamarasantana.adv.br` e faça um **Redeploy**, para que o link do e-mail "Esqueci minha senha" use o domínio novo.

## 7. Ajuste depois de publicar (v1.3.1)

**Problema visto no site publicado:** o STJ respondeu no teste local, mas na Vercel deu tempo esgotado. Os servidores da Vercel ficam fora do Brasil e o site do STJ não responde a eles. Com isso, o site no ar mostrava só 4 notícias, que vinham do ConJur e da Agência Brasil.

**Correção:**
- Entraram buscas por área no **Google Notícias** (Família, Previdenciário, Trabalhista, Consumidor e Criminal). Elas consideram só os últimos 3 dias e só sites jurídicos e oficiais de confiança: STJ, STF, TST, CNJ, ConJur, Migalhas, IBDFAM, JOTA, Agência Brasil e gov.br.
- Cada notícia mostra o **site de origem** (ex.: "IBDFAM", "Migalhas") e o link leva à matéria original.
- O feed direto do STJ continua na lista. Quando ele responder, entra também.
- Quando a lista de fontes muda, o site busca as notícias na hora, sem esperar as 3 horas.
- **Ramo:** `correcao/F7-mais-fontes-de-noticias`. **Testes:** 150 (110 backend + 40 frontend).
