# SAKURADIA
SAKURADIA ist ein von [CASCADIA](https://www.spiel-des-jahres.de/spiele/cascadia/)
inspiriertes strategisches Lege-Spiel für einen Spieler.<br>
Viele Regeln und Funktionen bleiben erhalten, jedoch taucht der Spielende visuell in die japanische Natur ein und interagiert mit Tieren wie Panda, Koi, Sika, Kranich und Japanmakak.<br>
Dabei verwaltet er Bambuswälder, Teiche, Kirschbaumwiesen und weitere Landschaften.

Wir empfehlen das Lesen der SPIELREGELN.md für das vollständige Verstehen des Spielflusses.

## Aktueller Stand
- Der aktuelle Stand ist im main-branch einsehbar
- Das Hauptmenü beinhaltet
    - Einen Rundenanzahl-Slider (1-20 Runden, Standard auf 20)
    - Start-Button
    - Hintergrundbild
- Tiles können mit Tastatur oder Controller ausgewählt, platziert und gedreht werden
- Tiles werden als Blender Modelle aus Sprint 3 dargestellt
- Tiere können nach Platzierung der Tiles manuell platziert werden
- Tiere werden sowohl mithilfe von Icons, aber nach Platzierung auch als 3D Modell in der Umgebung dargestellt
- Details zum Spielablauf und Informationen wie Punktestand sind in der UI vollständig einsehbar

## SAKURADIA spielen
### Auf Windows starten
```txt
Doppelklick auf start-dev.bat
```


### Manuell starten
```txt
1. Projektordner im Terminal oder in VS Code öffnen
2. Konsole: cd game
3. Konsole: npm install
4. Konsole: npm run dev
5. Öffne http://localhost:5173/ (in deinem Browser)
```

## Steuerung
Wir empfehlen das Spielen von SAKURADIA mit Maus und Tastatur, da in der aktuellen Implementation nicht alle Funktionen am Controller möglich sind.

### Maus/Tastatur-Steuerung
- WASD / Pfeiltasten: Tile wählen, Tile bewegen
- Space / Enter: Bestätigen
- Q+E: Tile drehen
- B: Tile Auswahl rückgängig machen
- LMB: Kamera drehen
- RMB: Kamera schieben
- Mausrad: Zoom einstellen
- R: Kamera zwischen perspektiv- und orthographisch wechseln

### Controller-Steuerung
- Left-Stick / D-Pad: Navigieren
- Right-Stick: Kamera drehen
- Button-Süd: Bestätigen
- Button-West: Kamera zwischen perspektiv- und orthographisch wechseln
- Button-Ost: Tile Auswahl rückgängig machen
- LT+RT: Tile wählen, Tile drehen
- LB+RB: Kamera nach links/rechts bewegen

### Abkürzungen erklärt
- LMB: Linke Maustaste
- RMB: Rechte Maustaste
- Left-Stick: Linker Analog-Stick am Controller
- Right-Stick: Rechter Analog-Stick am Controller
- D-Pad: Steuerkreuz am Controller
- Button-Süd: Unterer Controller-Button, z. B. A auf Xbox oder X auf PlayStation
- Button-West: Linker Controller-Button, z. B. X auf Xbox oder Quadrat auf PlayStation
- Button-Ost: Rechter Controller-Button, z. B. B auf Xbox oder Kreis auf PlayStation
- LT: Linker Trigger
- RT: Rechter Trigger
- LB: Linker Schulterbutton
- RB: Rechter Schulterbutton
- WASD: Tastaturtasten W, A, S, D
- Q/E: Tastaturtasten Q, E