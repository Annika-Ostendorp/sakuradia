import { Landscape } from "./Landscape.js";
import { Animal } from "./Animal.js";
import { TileData, StarterTileData } from "../gameplay/Tile.js";

/**
 * Sammlung hartkodierter Kachel- und Starterdaten, die zum Befüllen von
 * Decks, zum schnellen Prototyping oder für Tests genutzt werden.
 *
 * Die Klasse liefert einfache Accessor-Methoden, die Kopien bzw. aufgefaltete
 * Listen zurückgeben, sodass Aufrufer die Daten nicht direkt mutieren.
 */
export default class Library {
  /**
   * Rückwärtskompatibler Zugriff: Liefert eine flache Liste aller `TileData`
   * Instanzen, wobei Einträge entsprechend ihrem `count`-Feld mehrfach
   * dupliziert werden (für Deck-Erzeugung).
   * @returns {Array<TileData>}
   */
  getTileDataList() {
    var list = [];
    // Jedes TileData mit seiner angegebenen Anzahl in die Liste einfügen
    for (var tileData of this.getAllTiles())
      for (var i = 0; i < tileData.count; i++) list.push(tileData);

    return list;
  }

  /**
   * Rückwärtskompatibler Zugriff auf Starter-Sets.
   * @returns {Array<StarterTileData>}
   */
  getStarterTileDataList() {
    return this.getAllStarterTiles();
  }

  /**
   * Gibt eine hartkodierte Sammlung von `TileData`-Objekten zurück. Diese
   * Daten dienen als Basis für das Kartendeck und enthalten sowohl Keystone-
   * als auch Kombinationskacheln.
   * @returns {Array<TileData>}
   */
  getAllTiles() {
    return [
      // Keystones
      new TileData(
        Landscape.BAMBOOFOREST,
        Landscape.UNDEFINED,
        [Animal.PANDA],
        2,
      ),
      new TileData(
        Landscape.BAMBOOFOREST,
        Landscape.UNDEFINED,
        [Animal.JAPANMAKAK],
        2,
      ),
      new TileData(
        Landscape.BAMBOOFOREST,
        Landscape.UNDEFINED,
        [Animal.SIKA],
        1,
      ),

      new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [Animal.SIKA], 2),
      new TileData(
        Landscape.SAKURA,
        Landscape.UNDEFINED,
        [Animal.JAPANMAKAK],
        2,
      ),
      new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [Animal.KOI], 1),

      new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.PANDA], 2),
      new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.SIKA], 2),
      new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.CRANE], 1),

      new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.CRANE], 2),
      new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.PANDA], 1),
      new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.KOI], 2),

      new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.CRANE], 2),
      new TileData(
        Landscape.WETLAND,
        Landscape.UNDEFINED,
        [Animal.JAPANMAKAK],
        2,
      ),
      new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.KOI], 1),

      // Combinations
      new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [
        Animal.PANDA,
        Animal.SIKA,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [
        Animal.SIKA,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),

      new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.SIKA,
        Animal.JAPANMAKAK,
      ]),

      new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
        Animal.PANDA,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
        Animal.SIKA,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
        Animal.PANDA,
        Animal.SIKA,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),

      new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.KOI,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.CRANE,
        Animal.KOI,
      ]),

      new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
        Animal.SIKA,
        Animal.KOI,
      ]),
      new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.KOI,
      ]),
      new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.SIKA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),

      new TileData(Landscape.SAKURA, Landscape.POND, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.SAKURA, Landscape.POND, [Animal.SIKA, Animal.KOI]),
      new TileData(Landscape.SAKURA, Landscape.POND, [
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.SAKURA, Landscape.POND, [
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.SAKURA, Landscape.POND, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.SAKURA, Landscape.POND, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),

      new TileData(Landscape.SAKURA, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.SAKURA, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.KOI,
      ]),
      new TileData(Landscape.SAKURA, Landscape.WETLAND, [
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.SAKURA, Landscape.WETLAND, [
        Animal.CRANE,
        Animal.KOI,
      ]),
      new TileData(Landscape.SAKURA, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),
      new TileData(Landscape.SAKURA, Landscape.WETLAND, [
        Animal.JAPANMAKAK,
        Animal.CRANE,
        Animal.KOI,
      ]),

      new TileData(Landscape.MOUNTAIN, Landscape.POND, [
        Animal.PANDA,
        Animal.SIKA,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.POND, [
        Animal.PANDA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.POND, [
        Animal.PANDA,
        Animal.KOI,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.POND, [
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.POND, [
        Animal.CRANE,
        Animal.KOI,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.POND, [
        Animal.PANDA,
        Animal.CRANE,
        Animal.KOI,
      ]),

      new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.KOI,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.JAPANMAKAK,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
        Animal.SIKA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
        Animal.CRANE,
        Animal.KOI,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.SIKA,
        Animal.KOI,
      ]),

      new TileData(Landscape.POND, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.CRANE,
      ]),
      new TileData(Landscape.POND, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.KOI,
      ]),
      new TileData(Landscape.POND, Landscape.WETLAND, [
        Animal.JAPANMAKAK,
        Animal.CRANE,
      ]),
      new TileData(Landscape.POND, Landscape.WETLAND, [
        Animal.JAPANMAKAK,
        Animal.KOI,
      ]),
      new TileData(Landscape.POND, Landscape.WETLAND, [
        Animal.CRANE,
        Animal.KOI,
      ]),
      new TileData(Landscape.POND, Landscape.WETLAND, [
        Animal.PANDA,
        Animal.CRANE,
        Animal.KOI,
      ]),
    ];
  }

  /**
   * Liefert eine Liste vordefinierter Starter-Hands (jeweils drei Kacheln),
   * die beim Spielstart verwendet werden können. Nützlich für Tests und Demo-
   * Modi.
   * @returns {Array<StarterTileData>}
   */
  getAllStarterTiles() {
    return [
      new StarterTileData([
        new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.PANDA]),
        new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [
          Animal.SIKA,
          Animal.JAPANMAKAK,
          Animal.CRANE,
        ]),
        new TileData(Landscape.SAKURA, Landscape.POND, [
          Animal.PANDA,
          Animal.KOI,
        ]),
      ]),

      new StarterTileData([
        new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.CRANE]),
        new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [
          Animal.SIKA,
          Animal.CRANE,
          Animal.KOI,
        ]),
        new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [
          Animal.PANDA,
          Animal.JAPANMAKAK,
        ]),
      ]),

      new StarterTileData([
        new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [
          Animal.JAPANMAKAK,
        ]),
        new TileData(Landscape.WETLAND, Landscape.POND, [
          Animal.JAPANMAKAK,
          Animal.CRANE,
          Animal.KOI,
        ]),
        new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [
          Animal.PANDA,
          Animal.SIKA,
        ]),
      ]),

      new StarterTileData([
        new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.KOI]),
        new TileData(Landscape.SAKURA, Landscape.BAMBOOFOREST, [
          Animal.PANDA,
          Animal.SIKA,
          Animal.KOI,
        ]),
        new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [
          Animal.JAPANMAKAK,
          Animal.CRANE,
        ]),
      ]),

      new StarterTileData([
        new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [
          Animal.SIKA,
        ]),
        new TileData(Landscape.MOUNTAIN, Landscape.POND, [
          Animal.PANDA,
          Animal.SIKA,
          Animal.CRANE,
        ]),
        new TileData(Landscape.WETLAND, Landscape.SAKURA, [
          Animal.JAPANMAKAK,
          Animal.KOI,
        ]),
      ]),
    ];
  }
}
