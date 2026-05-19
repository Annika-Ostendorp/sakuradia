import '../styles/global.css';
import '../ui/styles/menuBackground.css';
import { getGameConfig, updateGameConfig } from '../states/gameConfigState.js';
import { createMainMenu } from '../ui/components/createMainMenu.js';
import GameScene from './GameScene.js';

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
