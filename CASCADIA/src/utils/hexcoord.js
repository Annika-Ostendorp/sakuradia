export default class HexCoord {
    constructor(c, r, hexSize = 1) {
        // Axiale Koordinaten des Hex-Gitters.
        // `c` entspricht der Spalten-/q-Achse (column), `r` der Reihen-/r-Achse (row).
        this.column = c;
        this.row = r;
        this.hexSize = hexSize;
    }

    // Nachbar-Richtungen für ein pointy-top Hex-Gitter in axialen Koordinaten.
    static Directions = [
        new HexCoord(1, 0),
        new HexCoord(1, -1),
        new HexCoord(0, -1),
        new HexCoord(-1, 0),
        new HexCoord(-1, 1),
        new HexCoord(0, 1)
    ];

    neighbor(dir) {
        const direction = HexCoord.Directions[dir];
        return new HexCoord(this.column + direction.column, this.row - direction.row);
    }

    static add(a, b) {
        return new HexCoord(a.column + b.column, a.row + b.row);
    }

    equals(other) {
        if (!(other instanceof HexCoord)) return false;
        return this.column === other.column && this.row === other.row;
    }

    hashCode() {
        return `${this.column},${this.row}`;
    }

    toString() {
        return `(${this.column}, ${this.row})`;
    }

    static distance(a, b) {
        // Distanz im axialen Koordinatensystem, umgerechnet über Cube-Koordinaten.
        const dq = a.column - b.column;
        const dr = a.row - b.row;
        const ds = (-a.column - a.row) - (-b.column - b.row);

        return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
    }

    getNeighbors() {
        const list = [];

        for (const dir of HexCoord.Directions) {
            list.push(HexCoord.add(this, dir));
        }

        return list;
    }

    hexToWorld() {
        // Pointy-top axial -> Weltkoordinaten: X/Z-Ebene, Y bleibt auf 0.
        const x = this.hexSize * Math.sqrt(3) * (this.column + this.row * 0.5);
        const z = this.hexSize * (1.5 * this.row);

        return { x, y: 0, z };
    }

    static worldToHex(pos, hexSize = 1) {
        // Umkehrung von hexToWorld() für pointy-top Hexfelder.
        const column = (Math.sqrt(3) / 3 * pos.x - 1 / 3 * pos.z) / hexSize;
        const row = (2 / 3 * pos.z) / hexSize;

        return HexCoord.hexRound(column, row, hexSize);
    }

    static hexRound(column, row, hexSize = 1) {
        // Rundet zunächst auf Cube-Koordinaten und korrigiert dann die größte Abweichung.
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

        return new HexCoord(rx, rz, hexSize);
    }
}