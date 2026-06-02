// Definiert die Landschaften im Spiel als Enum-ähnliches Objekt.
// Enums definieren eine feste Menge von benannten Werten, die in der gesamten Anwendung verwendet werden können.

const Landscape = Object.freeze({
    "UNDEFINED": "Undefined",
    "MOUNTAIN": "Mountain",
    "BAMBOOFOREST": "BambooForest",
    "WETLAND": "Wetland",
    "POND": "Pond",
    "SAKURA": "Sakura"
});

export { Landscape };
export default Landscape;