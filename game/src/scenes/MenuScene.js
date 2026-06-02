import '../styles/global.css';
import '../ui/styles/menuBackground.css';
import { getGameConfig, updateGameConfig } from '../states/gameConfigState.js';
import { createMainMenu } from '../ui/components/createMainMenu.js';
import GameScene from './GameScene.js';

/**
 * Verantwortlich für das Anzeigen und Verwalten des Hauptmenüs. Lädt die
 * aktuelle `gameConfig` aus dem State, übergibt Änderungen an `updateGameConfig`
 * und startet `GameScene` beim Klick auf "Start".
 *
 * UI-Verhalten:
 * - Beim Starten des Spiels wird das Menü verborgen (CSS-Klasse + aria-hidden)
 *   und `GameScene` instanziiert.
 */
export default class MenuScene {
    constructor() {
        this.canvas = document.querySelector('#game-canvas');
        this.menuRoot = document.querySelector('#menu-root');

        if (!this.canvas || !this.menuRoot) {
            throw new Error('App shell is missing required DOM nodes.');
        }

        this.isGameStarted = false;
        this.gameConfig = getGameConfig();
        this.gameScene = null;

        this.mainMenu = createMainMenu({
            initialConfig: this.gameConfig,
            onConfigChange: (config) => {
                updateGameConfig(config);
            },
            onStart: (config) => {
                this.startGame(config);
            },
        });

        this.menuRoot.append(this.mainMenu);
    }

    // Startet das Spiel: verhindert mehrfaches Starten, updated den globalen
    // State, blendet das Menu aus und erzeugt die `GameScene`.
    startGame(config) {
        if (this.isGameStarted) {
            return;
        }

        const nextConfig = updateGameConfig({
            ...config,
            gameStarted: true,
        });

        this.isGameStarted = true;
        this.menuRoot.classList.add('menu-root--hidden');
        this.menuRoot.setAttribute('aria-hidden', 'true');

        this.gameScene = new GameScene(nextConfig);
    }
}
