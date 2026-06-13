// Debugging Tipps
// console.info(newHexCoord.hashCode()) // Gibt die Koordinate mit validem hash zurück

/**
 * Definiert die HexCoord Klasse für axiale Koordinaten in einem hexagonalen Gitter.
 * Bietet Methoden für Nachbarn, Addition, Gleichheit, Hashing, String-Darstellung,
 * Distanzberechnung und Umrechnung zwischen Hex- und Weltkoordinaten.
 */
export default class HexCoord {
    constructor(column, row) {
        // Axiale Koordinaten des Hex-Gitters.
        this.column = column;
        this.row = row;
    }

    // Nachbar-Richtungen für ein pointy-top Hex-Gitter in axialen Koordinaten.
    static Directions = [
        new HexCoord(1, 0), // Rechts
        new HexCoord(1, -1), // Rechts Unten
        new HexCoord(0, -1), // Links Unten 
        new HexCoord(-1, 0), // Links
        new HexCoord(-1, 1), // Links Oben
        new HexCoord(0, 1) // Rechts Oben
    ];

    // Gibt die Hex-Koordinaten des Nachbarfelds in der angegebenen Richtung zurück.
    neighbor(dir) {
        const direction = HexCoord.Directions[dir];
        return new HexCoord(this.column + direction.column, this.row + direction.row);
    }

    // Addiert zwei Hex-Koordinaten, z.B. für die Berechnung von Nachbarn.
    static add(a, b) {
        return new HexCoord(a.column + b.column, a.row + b.row);
    }

    // Vergleicht diese Hex-Koordinate mit einer anderen auf Gleichheit.
    equals(other) {
        if (!(other instanceof HexCoord)){
            return false;
        }
        return this.column === other.column && this.row === other.row;
    }

    // Ein einfacher Hash-Code basierend auf den Spalten- und Reihenwerten, z.B. "2,-1".
    hashCode() {
        return `${this.column},${this.row}`;
    }

    // Gibt eine lesbare String-Darstellung der Hex-Koordinaten zurück, z.B. "(2, -1)".
    toString() {
        return `(${this.column}, ${this.row})`;
    }

    // Distanz im axialen Koordinatensystem, umgerechnet über Cube-Koordinaten.
    static distance(a, b) {
        // Distanz im axialen Koordinatensystem, umgerechnet über Cube-Koordinaten.
        const dq = a.column - b.column;
        const dr = a.row - b.row;
        const ds = (-a.column - a.row) - (-b.column - b.row);

        return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
    }

    // Gibt die sechs Nachbarn dieses Hex-Felds zurück.
    getNeighbors() {
        const list = [];

        for (const dir of HexCoord.Directions) {
            list.push(HexCoord.add(this, dir));
        }

        return list;
    }

    // Berechnet die Weltkoordinaten für die Mitte dieses Hex-Felds, basierend auf der hexSize.
    hexToWorld(hexCoord, hexSize = 1) {
        const x = Math.sqrt(3) * hexSize * (hexCoord.column + hexCoord.row * 0.5);
        const z = -1.5 * hexSize * hexCoord.row;

        return { x, y: 0, z };
    }

    // Berechnet die axialen Hex-Koordinaten aus Weltkoordinaten, basierend auf der hexSize.
    static worldToHex(pos, hexSize = 1) {
        // Umkehrung von hexToWorld() für pointy-top Hexfelder.
        const column = (Math.sqrt(3) / 3 * pos.x - 1 / 3 * pos.z) / hexSize;
        const row = (2 / 3 * pos.z) / hexSize;

        return HexCoord.hexRound(column, row);
    }

    /**
     * Rundet zunächst auf Cube-Koordinaten und korrigiert dann die größte Abweichung.
     */
    static hexRound(column, row) {
        let x = column;
        let z = row;
        let y = -x - z;

        let rx = Math.round(x);
        let ry = Math.round(y);
        let rz = Math.round(z);

        const dx = Math.abs(rx - x);
        const dy = Math.abs(ry - y);
        const dz = Math.abs(rz - z);

        if (dx > dy && dx > dz)
            rx = -ry - rz;
        else if (dy > dz)
            ry = -rx - rz;
        else
            rz = -rx - ry;

        return new HexCoord(rx, rz);
    }
}
