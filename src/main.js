// main.js - Entry Point for Synthrace
import './styles/main.css';
import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.__SYNTHRACE__ = game;
});
