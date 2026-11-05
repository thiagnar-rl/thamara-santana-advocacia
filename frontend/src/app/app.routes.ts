import { Routes } from '@angular/router';
import { exigeLogin, somenteVisitante } from './core/guards';
import { Shell } from './layout/shell';
import { SiteLayout } from './site/site-layout';

/**
 * ROTAS
 * [F7] Site institucional — solicitado por Thamara Santana (cliente) (04/11/2026):
 * - O endereço principal ("/") passa a abrir o site do escritório (público).
 * - O sistema de agenda e processos continua igual, agora em "/sistema".
 * - Os endereços antigos (/entrar, /processos...) redirecionam para os novos.
 */

/** Telas do sistema (área restrita). */
const sistema: Routes = [
  {
    path: 'entrar',
    canActivate: [somenteVisitante],
    title: 'Entrar · Thamara Santana',
    data: { modo: 'entrar' },
    loadComponent: () => import('./pages/acesso/acesso').then((m) => m.AcessoPage),
  },
  {
    path: 'cadastro',
    canActivate: [somenteVisitante],
    title: 'Criar conta · Thamara Santana',
    data: { modo: 'cadastro' },
    loadComponent: () => import('./pages/acesso/acesso').then((m) => m.AcessoPage),
  },
  // [F3] Esqueci minha senha — solicitado por Thamara Santana (30/10/2026)
  {
    path: 'recuperar-senha',
    canActivate: [somenteVisitante],
    title: 'Esqueci minha senha · Thamara Santana',
    data: { modo: 'recuperar' },
    loadComponent: () => import('./pages/recuperar-senha/recuperar-senha').then((m) => m.RecuperarSenhaPage),
  },
  {
    // Aberta pelo link do e-mail (funciona mesmo se alguém já estiver logado no navegador)
    path: 'redefinir-senha',
    title: 'Criar nova senha · Thamara Santana',
    data: { modo: 'redefinir' },
    loadComponent: () => import('./pages/recuperar-senha/recuperar-senha').then((m) => m.RecuperarSenhaPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [exigeLogin],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Início · Thamara Santana',
        loadComponent: () => import('./pages/painel/painel').then((m) => m.PainelPage),
      },
      {
        path: 'agenda',
        title: 'Agenda · Thamara Santana',
        loadComponent: () => import('./pages/agenda/agenda').then((m) => m.AgendaPage),
      },
      {
        path: 'processos',
        title: 'Processos · Thamara Santana',
        loadComponent: () => import('./pages/processos/processos').then((m) => m.ProcessosPage),
      },
      {
        path: 'processos/:id',
        title: 'Processo · Thamara Santana',
        loadComponent: () =>
          import('./pages/processo-detalhe/processo-detalhe').then((m) => m.ProcessoDetalhePage),
      },
      // [F6] Clientes — solicitado por Thamara Santana (30/10/2026)
      {
        path: 'clientes',
        title: 'Clientes · Thamara Santana',
        loadComponent: () => import('./pages/clientes/clientes').then((m) => m.ClientesPage),
      },
      {
        path: 'clientes/:id',
        title: 'Cliente · Thamara Santana',
        loadComponent: () =>
          import('./pages/cliente-detalhe/cliente-detalhe').then((m) => m.ClienteDetalhePage),
      },
      // [F7] Publicações que aparecem na aba Notícias do site
      {
        path: 'publicacoes',
        title: 'Publicações · Thamara Santana',
        loadComponent: () => import('./pages/publicacoes/publicacoes').then((m) => m.PublicacoesPage),
      },
    ],
  },
];

export const routes: Routes = [
  // [F7] Site público
  {
    path: '',
    component: SiteLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Thamara Santana · Advocacia e Consultoria Jurídica · Guarujá/SP',
        loadComponent: () => import('./site/inicio/inicio').then((m) => m.InicioSite),
      },
      {
        path: 'noticias',
        title: 'Notícias e atualizações · Thamara Santana Advocacia',
        loadComponent: () => import('./site/noticias/noticias').then((m) => m.NoticiasSite),
      },
      {
        path: 'noticias/:id',
        title: 'Publicação · Thamara Santana Advocacia',
        loadComponent: () => import('./site/artigo/artigo').then((m) => m.ArtigoSite),
      },
    ],
  },

  // Sistema (área restrita)
  { path: 'sistema', children: sistema },

  // [F7] Endereços antigos do sistema → novos (favoritos e links de e-mail continuam funcionando)
  { path: 'entrar', redirectTo: 'sistema/entrar' },
  { path: 'cadastro', redirectTo: 'sistema/cadastro' },
  { path: 'recuperar-senha', redirectTo: 'sistema/recuperar-senha' },
  { path: 'redefinir-senha', redirectTo: 'sistema/redefinir-senha' },
  { path: 'inicio', redirectTo: 'sistema/inicio' },
  { path: 'agenda', redirectTo: 'sistema/agenda' },
  { path: 'processos', redirectTo: 'sistema/processos' },
  { path: 'processos/:id', redirectTo: 'sistema/processos/:id' },
  { path: 'clientes', redirectTo: 'sistema/clientes' },
  { path: 'clientes/:id', redirectTo: 'sistema/clientes/:id' },

  { path: '**', redirectTo: '' },
];
