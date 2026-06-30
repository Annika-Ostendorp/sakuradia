// Definiert die Rundenzustände im Spiel als Enum-ähnliches Objekt.
// Enums definieren eine feste Menge von benannten Werten, die in der gesamten Anwendung verwendet werden können.
export const RoundState = Object.freeze({
  CHOOSE_TILE: "ChooseTile",
  PLACE_TILE: "PlaceTile",
  CANNOT_PLACE_ANIMAL: "CannotPlaceAnimal",
  PLACE_ANIMAL: "PlaceAnimal",
  DRAW: "Draw",
  GAME_OVER: "GameOver",
});
