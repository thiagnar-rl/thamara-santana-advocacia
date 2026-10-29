import './config/env'; // precisa ser o primeiro import
import { criarApp } from './app';

const PORTA = Number(process.env.PORT) || 3000;

criarApp().listen(PORTA, () => {
  console.log(`\n  ⚖️  API Thamara Santana Advocacia rodando em http://localhost:${PORTA}\n`);
});
