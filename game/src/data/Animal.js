// Definiert die Tiere im Spiel als Enum-ähnliches Objekt.
// Enums definieren eine feste Menge von benannten Werten, die in der gesamten Anwendung verwendet werden können.
const Animal = Object.freeze({
    NONE: 'NONE',
    PANDA: 'Panda',
    SIKA: 'Sika',
    JAPANMAKAK: 'Japanmakak',
    CRANE: 'Crane',
    KOI: 'Koi',
});

export { Animal };
export default Animal;