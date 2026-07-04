# SAKURADIA

[German version](README.md)

SAKURADIA is a strategic tile-placement game for one player inspired by [CASCADIA](https://www.spiel-des-jahres.de/spiele/cascadia/).<br>
Many rules and features remain similar, but the player visually enters Japanese nature and interacts with animals such as pandas, koi, sika deer, cranes, and Japanese macaques.<br>
The player manages bamboo forests, ponds, cherry blossom meadows, grasslands and mountains.

For a complete understanding of the game flow, we recommend reading `GAME_RULES.md`.

## Current State

* The current state can be viewed on the `main` branch.
* The main menu includes:

  * Round amount slider (1–20 rounds, default set to 20)
  * Start button
  * Background image
* Tiles can be selected, placed, and rotated using keyboard or controller.
* Animals can be placed manually after placing tiles.
* Tiles and animals are displayed as complete Blender models.
* Animals are additionally represented with icons.
* Details about the game flow and information such as the score are fully visible in the UI.

## Playing SAKURADIA

### Start on Windows

```txt
Double-click start-dev.bat
```

### Start manually

```txt
1. Open the project folder in the terminal or in VS Code
2. Console: cd game
3. Console: npm install
4. Console: npm run dev
5. Open http://localhost:5173/ in the browser
```

## Controls

We recommend playing SAKURADIA with mouse and keyboard, because not all functions are currently available on controller.

### Mouse / Keyboard Controls

* WASD / arrow keys: select tile, move tile or animal token
* Space / Enter: confirm
* Q / E: rotate tile
* B: undo tile-animal selection (only if the selected animal cannot be placed)
* Y: skip animal token placement (only if the selected animal cannot be placed)
* RMB: move camera
* Mouse wheel: adjust zoom
* R: switch between perspective and orthographic camera<br>
(By switching between perspective and orthographic camera, players can keep a clear overview<br> of the game board when zooming, as icons are adjusted based on visual distance.)

### Controller Controls

* Left Stick: navigate
* LT / RT: select tile or rotate tile
* LB / RB: move camera left/right
* D-Pad left/right: navigate
* D-Pad up/down: adjust zoom
* Right Stick: rotate camera
* South Button: confirm
* East Button: undo tile-animal selection (only if the selected animal cannot be placed)
* North Button: skip animal token placement (only if the selected animal cannot be placed)
* West Button: switch between perspective and orthographic camera<br>
(By switching between perspective and orthographic camera, players can keep a clear overview<br> of the game board when zooming, as icons are adjusted based on visual distance.)

### Abbreviations Explained

* LMB: left mouse button
* RMB: right mouse button
* Left Stick: left analog stick on the controller
* Right Stick: right analog stick on the controller
* D-Pad: directional pad on the controller
* North Button: upper controller button, e.g. Y on Xbox or Triangle on PlayStation
* South Button: lower controller button, e.g. A on Xbox or X on PlayStation
* West Button: left controller button, e.g. X on Xbox or Square on PlayStation
* East Button: right controller button, e.g. B on Xbox or Circle on PlayStation
* LT: left trigger
* RT: right trigger
* LB: left shoulder button
* RB: right shoulder button
* WASD: keyboard keys W, A, S, D
* Q / E: keyboard keys Q and E
