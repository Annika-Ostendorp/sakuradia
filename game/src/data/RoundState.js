// Definiert die Rundenzustände im Spiel als Enum-ähnliches Objekt.
// Enums definieren eine feste Menge von benannten Werten, die in der gesamten Anwendung verwendet werden können.
const RoundState = Object.freeze({
    CHOOSE_TILE: 'ChooseTile',
    PLACE_TILE: 'PlaceTile',
    DRAW: 'Draw',
    GAME_OVER: 'GameOver',
});

export { RoundState };
export default RoundState;