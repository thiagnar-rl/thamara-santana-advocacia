# F11 — Páginas por área, WhatsApp por assunto, imagem de compartilhamento e sitemap

| Campo | Informação |
| ----- | ---------- |
| **Código** | F11 |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor) |
| **Origem** | Sugestões de melhoria do site (05/11/2026). O domínio próprio ficou pendente, por decisão do solicitante |
| **Prioridade** | Média |
| **Ramo no Git** | `melhoria/F11-paginas-por-area` |
| **Versão** | 1.9.0 |
| **Status** | Pronta para publicar |

---

## 1. O que entrou

### Páginas por área (`/atuacao/...`)

| Endereço | Área |
| -------- | ---- |
| `/atuacao/familia-e-sucessoes` | Família e Sucessões (Dra. Thamara) |
| `/atuacao/trabalhista` | Trabalhista (Dra. Thamara) |
| `/atuacao/civel` | Cível (Dra. Thamara) |
| `/atuacao/criminal` | Criminal (equipe) |
| `/atuacao/previdenciario` | Previdenciário (equipe) |

Cada página tem:
- topo escuro com o nome da área e o botão **"Falar sobre …"** no WhatsApp;
- texto de apresentação;
- quadro **"Como podemos ajudar"** com as especialidades;
- perguntas frequentes daquela área;
- atalhos para as outras áreas.

O título da aba e a descrição para o Google mudam em cada página, por exemplo "Trabalhista · Advocacia em Guarujá/SP · Thamara Santana". Isso ajuda nas buscas por área e cidade.

Na página inicial:
- cada coluna da "Atuação da Dra. Thamara" ganhou os links **"Saiba mais"** e **"Conversar"**;
- os cartões da equipe ficaram clicáveis.

### WhatsApp com mensagem por assunto

O WhatsApp já abre com a mensagem pronta, de acordo com o ponto de partida:

| De onde o visitante clica | Mensagem que abre |
| ------------------------- | ----------------- |
| Uma área | "Olá, Dra. Thamara! Vim pelo site e gostaria de falar sobre Trabalhista." |
| Uma pergunta frequente (link **"Falar sobre isso no WhatsApp"**) | "Olá, Dra. Thamara! Vim pelo site e tenho uma dúvida: Fui demitido por justa causa…" |

### Imagem de compartilhamento nova

A imagem `site/compartilhar.jpg` (1200 × 630) é a que aparece quando o link do site é enviado no WhatsApp, Instagram ou Facebook. Ela agora tem o logo, as áreas (Família e Sucessões · Cível · Trabalhista), Guarujá/SP, a OAB e a foto nova da Thamara.

O endereço da imagem passou a ser completo (`https://…`), como o WhatsApp exige.

> O WhatsApp guarda a imagem antiga por alguns dias. Para ver a nova na hora, mande o link com algo no final, por exemplo `https://thamara-santana-advocacia.vercel.app/?v=2`.

### Sitemap

- `frontend/public/sitemap.xml`: lista das páginas públicas para o Google. A área restrita (`/sistema`) fica de fora.
- O `robots.txt` passou a indicar o sitemap.

## 2. Depois de publicar: Google Search Console (5 minutos, com a conta da Thamara)

1. Abra <https://search.google.com/search-console> e clique em **Adicionar propriedade**.
2. Escolha **Prefixo do URL** e digite `https://thamara-santana-advocacia.vercel.app`.
3. Na verificação, escolha **Tag HTML** e copie só o código que aparece em `content="…"`. Mande esse código para o Claude, que coloca no site. É um código público, não é senha.
4. Depois de verificado, vá em **Sitemaps** e envie `sitemap.xml`.

Quando houver domínio próprio, troque o endereço no `sitemap.xml`, no `robots.txt` e nas tags `og:image` do `index.html`.

## 3. Arquivos

| Arquivo | O que mudou |
| ------- | ----------- |
| `frontend/src/app/site/area/area.ts`, `.html` e `.scss` | Página da área (novo) |
| `frontend/src/app/site/conteudo.ts` | `slug`, `apresentacao` e `areasPerguntas` em cada área; itens de Previdenciário e Criminal; `TODAS_AS_AREAS` |
| `frontend/src/app/core/logica/site.logica.ts` | `mensagemWhatsAppArea`, `mensagemWhatsAppPergunta` e `areaPorSlug` |
| `frontend/src/app/site/inicio/*` | Links "Saiba mais", "Conversar", cartões da equipe clicáveis e WhatsApp nas perguntas |
| `frontend/src/app/app.routes.ts` | Rota `atuacao/:slug` |
| `frontend/public/site/compartilhar.jpg` | Imagem de compartilhamento nova |
| `frontend/public/sitemap.xml`, `frontend/public/robots.txt` | Sitemap |
| `frontend/src/index.html` | Imagem com endereço completo, tamanho e texto alternativo |
| `frontend/tests/site.logica.test.ts` | Testes |

## 4. Testes

| Antes (v1.8.0) | Depois |
| -------------- | ------ |
| 201 testes | **204 testes (142 backend + 62 frontend)** |

Os testes novos conferem:
- que cada área tem endereço único e está no sitemap, e que o sitemap não inclui `/sistema`;
- que as perguntas de cada página existem;
- as mensagens prontas do WhatsApp.

## 5. Como desfazer

No GitHub, abra o merge de `melhoria/F11-paginas-por-area` e use **Revert**.
