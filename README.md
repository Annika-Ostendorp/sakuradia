# SAKURADIA

[English version](README_EN.md)

SAKURADIA ist ein von [CASCADIA](https://www.spiel-des-jahres.de/spiele/cascadia/)
inspiriertes strategisches Lege-Spiel für einen Spieler.<br>
Viele Regeln und Funktionen bleiben erhalten, jedoch taucht der Spielende visuell in die japanische Natur ein und interagiert mit Tieren wie Panda, Koi, Sika, Kranich und Japanmakak.<br>
Dabei verwaltet er Bambuswälder, Teiche, Kirschbaumwiesen und weitere Landschaften.

Für ein vollständiges Verständnis des Spielflusses empfehlen wir das Lesen der `SPIELREGELN.md`.

## Aktueller Stand

- Der aktuelle Stand ist im `main`-Branch einsehbar.
- Das Hauptmenü beinhaltet:
  - Rundenanzahl-Slider (1–20 Runden, Standard auf 20)
  - Start-Button
  - Hintergrundbild
- Tiles können mit Tastatur oder Controller ausgewählt, platziert und gedreht werden.
- Tiere können nach Platzierung der Tiles manuell platziert werden.
- Tiles und Tiere werden als vollständige Blender-Modelle dargestellt.
- Tiere werden zusätzlich mithilfe von Icons dargestellt.
- Details zum Spielablauf und Informationen wie der Punktestand sind vollständig in der UI einsehbar.
- Mithilfe des Wechsels zwischen perspektivischer und orthografischer Kamera, sowie dem Zoomen und der Distanzberechnung für visuelle Icons, können Spielende die Übersicht über das Spielfeld behalten.

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
5. Öffne http://localhost:5173/ im Browser
```

## Steuerung

Wir empfehlen das Spielen von SAKURADIA mit Maus und Tastatur, da in der aktuellen Implementierung nicht alle Funktionen am Controller möglich sind.

### Maus/Tastatur-Steuerung

- WASD / Pfeiltasten: Tile wählen, Tile oder Tier-Token bewegen
- Space / Enter: bestätigen
- Q / E: Tile drehen
- B: Tile-Tier-Auswahl rückgängig machen (nur, wenn das gewählte Tier nicht platziert werden kann)
- Y: Tier-Token-Platzierung überspringen (nur, wenn das gewählte Tier nicht platziert werden kann)
- RMB: Kamera schieben
- Mausrad: Zoom einstellen
- R: zwischen perspektivischer und orthografischer Kamera wechseln

### Controller-Steuerung

- Left-Stick: navigieren
- D-Pad links/rechts: navigieren
- D-Pad oben/unten: Zoom einstellen
- Right-Stick: Kamera drehen
- Button-Süd: bestätigen
- Button-West: zwischen perspektivischer und orthografischer Kamera wechseln
- Button-Ost: Tile-Tier-Auswahl rückgängig machen (nur, wenn das gewählte Tier nicht platziert werden kann)
- Button-Nord: Tier-Token-Platzierung überspringen (nur, wenn das gewählte Tier nicht platziert werden kann)
- LT / RT: Tile wählen oder Tile drehen
- LB / RB: Kamera nach links/rechts bewegen

### Abkürzungen erklärt

- LMB: linke Maustaste
- RMB: rechte Maustaste
- Left-Stick: linker Analog-Stick am Controller
- Right-Stick: rechter Analog-Stick am Controller
- D-Pad: Steuerkreuz am Controller
- Button-Nord: oberer Controller-Button, z. B. Y auf Xbox oder Dreieck auf PlayStation
- Button-Süd: unterer Controller-Button, z. B. A auf Xbox oder X auf PlayStation
- Button-West: linker Controller-Button, z. B. X auf Xbox oder Quadrat auf PlayStation
- Button-Ost: rechter Controller-Button, z. B. B auf Xbox oder Kreis auf PlayStation
- LT: linker Trigger
- RT: rechter Trigger
- LB: linker Schulterbutton
- RB: rechter Schulterbutton
- WASD: Tastaturtasten W, A, S, D
- Q / E: Tastaturtasten Q und E
