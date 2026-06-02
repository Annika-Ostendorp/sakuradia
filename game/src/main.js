import MenuScene from './scenes/MenuScene.js';

/**
 * Anwendungseinstiegspunkt: Wartet auf `DOMContentLoaded` und initialisiert
 * die `MenuScene`. Kleine Datei; die echte Logik lebt in den Scene-Modulen.
 */
window.addEventListener('DOMContentLoaded', () => {
	// Menü-Szene erstellen — startet die UI/Anwendungslogik
	new MenuScene();
});

