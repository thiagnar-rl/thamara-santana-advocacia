import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Avisos } from './shared/avisos/avisos';
import { Impressao } from './shared/impressao/impressao';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Avisos, Impressao],
  template: `
    <router-outlet />
    <app-avisos />
    <!-- [F4] Folha de impressão (só aparece no papel) -->
    <app-impressao />
  `,
})
export class App {}
