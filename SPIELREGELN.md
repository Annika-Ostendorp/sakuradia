# SPIELREGELN

## Inhaltsverzeichnis
1. [Einleitung](#einleitung)
2. [Ziel des Spiels](#ziel-des-spiels)
3. [Spielmaterial](#spielmaterial)
4. [Spielaufbau](#spielaufbau)
5. [Spielablauf](#spielablauf)
6. [Hinweise zur digitalen Umsetzung](#hinweise-zur-digitalen-umsetzung)

## Einleitung
SAKURADIA ist ein von [CASCADIA](https://www.spiel-des-jahres.de/spiele/cascadia/)
inspiriertes strategisches Lege-Spiel für 1-4 Spieler. Viele der Regeln und Funktionen bleiben erhalten, jedoch tauchen die Spieler visuell in die japanische Natur ein und interagieren beispielsweise mit Tieren wie Panda, Koi, sowie Sika und finden sich als Verwalter von Bambuswäldern, Teichen und Kirschbaumwiesen wieder.

## Ziel des Spiels
Wer am Ende des Spiels am meisten Punkte hat - gewinnt.

## Spielmaterial
- 60x **Doppel-Tile** (Tile mit zwei Landschaften)
- 25x **Keystone-Tile** (Tile mit nur einer Landschaft)
- 05x **Starter-Tile** (2 Doppel-Tiles + 1 Keystone-Tile)
- 20x **Japanmakak-Token**
- 20x **Koi-Token**
- 20x **Kranich-Token**
- 20x **Panda-Token**
- 20x **Sika-Token**
- 25x **Nature-Token** (noch nicht implementiert)


## Spielaufbau
1. Jeder Spieler beginnt mit einem zufällig zugeteilten **Starter-Tile** (bestehend aus **2 Doppel-Tiles** und **1 Keystone-Tile**).
2. **Landschaft-Tiles** und **Tier-Tokens** werden vermischt.
3. Es werden 4 Landschaft-Tiles und 4 Tier-Tokens als **Hand** bereitgestellt, um 4 "Tile-Token"-Paare zu bilden.

## Spielablauf
Das Spiel verläuft in **Zügen** und **Runden**. Es werden üblicherweise **20 Runden** gespielt. *(Alternativ kann man spielen, bis der Nachzieh-Stapel leer ist.)*<br>
Eine **Runde** ist vorüber, wenn **jeder** Spieler **einmal** am **Zug** war. Jeder Zug besteht aus den folgenden Phasen:

1. **Auswahl:** Der aktive Spieler wählt ein Paar aus einem der 4 "Tile-Token"-Paare aus.

2. **Tile platzieren:** Der aktive Spieler legt das gewählte Landschafts-Tile an seine existierende Umgebung.<br>
    Dafür sind die Regeln:
    - Das Landschaft-Tile muss an ein bereits in der Umgebung vorhandenes Landschaft-Tile angrenzen, das heißt,<br>
    das Landschaft-Tile muss mindestens eine Seite eines anderen bereits platzierten Tiles oder des Start-Tiles berühren.<br>
    - Das Landschaft-Tile kann nicht auf ein anderes Landschaft-Tile gelegt werden, und es kann kein anderes Landschaft-Tile verschoben werden.

3. **Tier platzieren:** Der aktive Spieler legt das gewählte Tier-Token auf ein gültiges Landschaft-Tile.<br>
    Dafür sind die Regeln:
    - Auf dem Landschaft-Tile darf sich noch kein Tier-Token befinden.<br>
    - Auf dem Landschaft-Tile muss das passende Tier abgebildet sein (die Felder zeigen 1–3 Optionen an).<br>
    - Wenn ein Tier-Token nicht regelkonform platzieren werden kann, weil kein freies Landschaft-Tile dieses Tier aufnehmen kann,<br>
    oder wenn entscheiden wird, das Tier-Token nicht zu platzieren, wird das Tier-Token zurück ins "Deck" gelegt.
    - Das Tier-Token kann auf das Landschaft-Tile, das gerade platziert wurde, oder auf ein beliebiges anderes verfügbares Landschaft-Tile platziert werden.
    - Wenn ein Tier-Token auf ein Keystone-Tile platziert wird, bekommt der Spieler ein Nature-Token.
    - Wurde das Tier noch nicht platziert, kann die Auswahl rückgängig gemacht werden.

4. **Nachziehen:** Die **Hand** wird aufgefüllt.


## Hinweise zur digitalen Umsetzung
- Punkte werden automatisch gezählt und angezeigt.
- Punkteverteilung und Gewinner werden per Overlay angezeigt.

Viel Spaß beim Spielen!
