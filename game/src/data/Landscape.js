// Definiert die Landschaften im Spiel als Enum-ähnliches Objekt.
// Enums definieren eine feste Menge von benannten Werten, die in der gesamten Anwendung verwendet werden können.

const Landscape = Object.freeze({
  UNDEFINED: "Undefined",
  BAMBOOFOREST: "BambooForest",
  MOUNTAIN: "Mountain",
  POND: "Pond",
  SAKURA: "Sakura",
  WETLAND: "Wetland",
});

export { Landscape };
export default Landscape;
