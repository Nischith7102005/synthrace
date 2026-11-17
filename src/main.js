// main.js - Entry Point for Synthrace
import './styles/main.css';
import { Game } from './game.js';

function dismissBootScreen() {
  const boot = document.getElementById('boot-screen');
  if (!boot) return;
  boot.classList.add('boot-done');
  setTimeout(() => boot.remove(), 700);
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    window.__SYNTHRACE__ = game;
    // Engine is running and the first frame is queued — fade out the boot splash
    dismissBootScreen();
  } catch (err) {
    // Surface boot failures instead of leaving a silent black screen
    if (window.__bootError) {
      window.__bootError(err && err.message ? err.message : String(err));
    }
    console.error('Synthrace boot failed:', err);
  }
});
