# GAME RULES

[German version](SPIELREGELN.md)

## Table of Contents

1. [Introduction](#introduction)
2. [Goal of the Game](#goal-of-the-game)
3. [Game Material](#game-material)
4. [Game Setup](#game-setup)
5. [Game Flow](#game-flow)
6. [Scoring](#scoring)
7. [Notes on the Digital Implementation](#notes-on-the-digital-implementation)

## Introduction

SAKURADIA is a strategic tile-placement game for one player inspired by [CASCADIA](https://www.spiel-des-jahres.de/spiele/cascadia/).<br>
Many rules and features remain similar, but the player visually enters Japanese nature and interacts with animals such as pandas, koi, sika deer, cranes, and Japanese macaques.<br>
The player manages bamboo forests, ponds, cherry blossom meadows, and other landscapes.

## Goal of the Game

Reach the highest possible score and compare yourself with your friends!

## Game Material

* 60x **Double Tile** (tile with two landscapes)
* 25x **Keystone Tile** (tile with only one landscape)
* 5x **Starter Tile** (2 double tiles + 1 keystone tile)
* 20x **Japanese Macaque Tokens**
* 20x **Koi Tokens**
* 20x **Crane Tokens**
* 20x **Panda Tokens**
* 20x **Sika Tokens**

## Game Setup

1. The player starts with a randomly assigned **Starter Tile** consisting of **2 Double Tiles** and **1 Keystone Tile**.
2. **Landscape Tiles** and **Animal Tokens** are shuffled.
3. 4 Landscape Tiles and 4 Animal Tokens are prepared as the **hand**, forming 4 "Tile-Token" pairs.

## Game Flow

The game is played in **rounds**. Usually, **20 rounds** are played. *(Alternatively, the game can be played until the draw pile is empty.)*<br>
A **round** consists of the following phases:

1. **Selection:** The player chooses one pair from the 4 "Tile-Token" pairs.

2. **Place Tile:** The player places the selected Landscape Tile next to their existing environment.<br>
   The rules are:

   * The Landscape Tile must be adjacent to a Landscape Tile that is already part of the environment, meaning<br>
     the Landscape Tile must touch at least one side of another already placed tile or the Starter Tile.<br>
   * The Landscape Tile cannot be placed on top of another Landscape Tile, and no other Landscape Tile may be moved.

3. **Place Animal:** The player places the selected Animal Token on a valid Landscape Tile.<br>
   The rules are:

   * There must not already be an Animal Token on the Landscape Tile.
   * The matching animal must be shown on the Landscape Tile. The fields show 1–3 possible animals.
   * The Animal Token can be placed on the Landscape Tile that was just placed or on any other available Landscape Tile.
   * If there is no free space for the animal, the selection must either be undone or the Animal Token placement must be skipped.
   * If the Animal Token placement is skipped, the token is returned to the "deck". The round still counts.

4. **Draw:** The **hand** is refilled.

## Scoring

### The Largest Landscapes

The largest connected area of each landscape type scores points equal to the number of connected tiles.

### Scoring Cards

The 5 different animal types are scored in 5 different ways:

### Japanese Macaque

Each Japanese macaque scores points depending on the number of different animal types adjacent to it.<br>
A single adjacent Japanese macaque also counts as its own animal type.

| Amount |  1  |  2  |  3  |  4  |  5  |
| :----: | :-: | :-: | :-: | :-: | :-: |
| Points |  1  |  2  |  3  |  4  |  5  |

### Crane

Each crane that is not adjacent to another crane is added to the total count.

| Amount |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8+ |
| :----: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Points |  2  |  5  |  8  |  11 |  14 |  18 |  22 |  26 |

### Koi

Each koi line scores points based on the length of the line.<br>
A line is defined as a group of adjacent koi, where each koi is adjacent to no more than two other koi.<br>
A group of three koi in a "triangle" shape can count as a line.<br>
No additional koi may be adjacent to a koi line.

| Amount |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
| :----: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Points |  2  |  4  |  7  |  11 |  15 |  20 |  26 |

### Panda

Each group of three pandas scores 10 points. Every group must consist of exactly three pandas.<br>
Each panda in the group must be adjacent to at least one other panda in the same group.<br>
No additional pandas may be adjacent to the group.

### Sika

Each straight line of sika scores points depending on the length of the line.<br>
The lines do not have to be horizontal. A straight line has no bend.<br>
Two lines of sika can be placed next to each other, but each sika only counts for one single line.

| Amount |  1  |  2  |  3  |  4  |
| :----: | :-: | :-: | :-: | :-: |
| Points |  2  |  5  |  9  |  13 |

## Notes on the Digital Implementation

Points are counted automatically and shown in an overlay.

# Have fun playing!
