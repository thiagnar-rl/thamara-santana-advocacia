# F9 — Página "Política de Privacidade" no site

| Campo | Informação |
| ----- | ---------- |
| **Código** | F9 |
| **Tipo** | Funcionalidade nova |
| **Solicitado por** | Thamara Santana (cliente), pedido de 05/11/2026 — repassado por Thiago Rinaldi Luna (desenvolvedor) |
| **Origem** | Pendência da configuração do Google (F8): a tela de autorização do Google pede um link de Política de Privacidade |
| **Prioridade** | Média |
| **Ramo no Git** | `melhoria/F9-politica-de-privacidade` |
| **Versão** | 1.7.0 |
| **Status** | Pronta para publicar |

---

## 1. O pedido

Criar uma página de Política de Privacidade de verdade no site. Antes, o link cadastrado no Google Cloud apontava para a página inicial.

## 2. Como ficou

Endereço: **https://thamara-santana-advocacia.vercel.app/privacidade**

A página tem o mesmo visual das publicações do site, um índice clicável e 9 seções:

1. Quem é responsável pelos dados (a advogada, OAB, endereço e e-mail)
2. Visitantes do site (sem formulários, sem rastreamento; contato por WhatsApp, Instagram e e-mail)
3. Serviços de terceiros (Vercel, Google Maps, Google Fonts e links de notícias)
4. Clientes do escritório (dados cadastrados, bases legais da LGPD e sigilo profissional)
5. **Integração com Google Agenda e Google Drive** (o que o sistema acessa e o uso limitado exigido pelo Google)
6. Segurança (HTTPS, senha com bcrypt, autorização do Google cifrada)
7. Por quanto tempo os dados são guardados
8. Direitos do titular (art. 18 da LGPD)
9. Alterações da política

O rodapé do site ganhou o link **Política de Privacidade**, na coluna Navegação e na linha de direitos autorais.

> O texto foi escrito com base no funcionamento real do site e do sistema. Como a Thamara é advogada, vale ela ler e ajustar o que quiser. O texto fica todo em `frontend/src/app/site/privacidade/politica.ts`.

## 3. Depois de publicar (uma vez só)

Trocar o link no Google Cloud:
1. Entre em console.cloud.google.com, no projeto **Thamara Advocacia**.
2. Abra **Google Auth Platform**, depois **Branding**.
3. Em **Link da Política de Privacidade**, troque o endereço por `https://thamara-santana-advocacia.vercel.app/privacidade` e clique em **Salvar**.

## 4. Arquivos

| Arquivo | O que é |
| ------- | ------- |
| `frontend/src/app/site/privacidade/politica.ts` | Texto da política (edite aqui) |
| `frontend/src/app/site/privacidade/privacidade.ts`, `.html` e `.scss` | A página |
| `frontend/src/app/app.routes.ts` | Rota `/privacidade` |
| `frontend/src/app/site/site-layout.html` e `.scss` | Links no rodapé |
| `frontend/tests/privacidade.test.ts` | Testes |

## 5. Testes

| Antes (v1.6.2) | Depois |
| -------------- | ------ |
| 196 testes (142 backend + 54 frontend) | **199 testes (142 backend + 57 frontend)** |

O teste novo confere:
- as seções obrigatórias e as âncoras sem repetição;
- a OAB e o e-mail de contato;
- os pontos exigidos pelo Google: uso limitado, nada de publicidade e o link para retirar a permissão.

## 6. Como desfazer

No GitHub, abra o merge de `melhoria/F9-politica-de-privacidade` e use **Revert**. Antes, volte o link do Google Cloud para a página inicial.
