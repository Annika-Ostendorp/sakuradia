# SAKURADIA
SAKURADIA ist ein von [CASCADIA](https://www.spiel-des-jahres.de/spiele/cascadia/)
inspiriertes strategisches Lege-Spiel für 1-4 Spieler. Viele der
Regeln und Funktionen bleiben erhalten, jedoch tauchen die Spieler visuell in
die japanische Natur ein und interagieren beispielsweise mit Tieren wie Panda,
Koi, sowie Sika und finden sich als Verwalter von Bambuswäldern, Teichen und
Kirschbaumwiesen wieder.

## Aktueller Stand
- Der aktuelle Stand ist im dev-main-branch einsehbar
- Das Hauptmenü beinhaltet
    - Einen Rundenanzahl-Slider (1-20 Runden, Standard auf 85)
    - Spieler-Anzahl-Slider (1-4, Standard auf 1)
    - Start-Button
    - Hintergrundbild (KI-Platzhalter)
- Tiles können mit Tastatur oder Controller ausgewählt, platziert und gedreht werden
- Tiles werden als Blender Modelle aus Sprint 2 dargestellt
- Tiere können nach Platzierung der Tiles manuell platziert werden
- Tiere werden visuell als farb-codierter Text dargestellt
    - Grün: Aktuelle Position
    - Blau: Wählbare Position
    - Gelb: Bereits besetze Position
    - Rot: Unbesetze, aber invalide Position (Tier darf nicht platziert werden)
- Hand besteht teilweise noch aus Text-Platzhaltern
- Details zum Spielablauf und Informationen wie Punktestand sind aktuell nur in der Konsole (F12) einsehbar

## Manuell starten
```txt
1. Projektordner im Terminal oder in VS Code öffnen
2. Konsole: cd game
3. Konsole: npm install
4. Konsole: npm run dev
5. Öffne http://localhost:5173/ (in deinem Browser)
```

## Controller-Steuerung
- Left-Stick / D-Pad: Navigieren
- Right-Stick: Kamera drehen
- Button-Süd: Bestätigen
- Button-West: Kamera zurücksetzen
- Button-Ost: Tile Auswahl rückgängig machen
- LT+RT: Tile wählen, Tile drehen
- LB+RB: Kamera nach links/rechts bewegen

## Maus/Tastatur-Steuerung
- WASD / Pfeiltasten: Tile wählen, Tile bewegen
- Space / Enter: Bestätigen
- Q+E: Tile drehen
- B: Tile Auswahl rückgängig machen
- LMB: Kamera drehen
- RMB: Kamera schieben
- Mausrad: Zoom einstellen
- R: Kamera zurücksetzen

## Abkürzungen erklärt
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