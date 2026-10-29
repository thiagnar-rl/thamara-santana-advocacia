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
    ],
  },
  { path: '**', redirectTo: '' },
];
