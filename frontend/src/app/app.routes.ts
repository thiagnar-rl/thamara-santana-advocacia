import { Routes } from '@angular/router';
import { exigeLogin, somenteVisitante } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
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
    ],
  },
  { path: '**', redirectTo: '' },
];
