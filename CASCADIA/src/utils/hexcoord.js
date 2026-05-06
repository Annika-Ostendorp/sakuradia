export default class HexCoord {
    constructor(q, r, hexSize = 1) {
        this.q = q; // column
        this.r = r; // row
        this.hexSize = hexSize;
    }

    // Pointy-top axial directions
    static Directions = [
        new HexCoord(1, 0),
        new HexCoord(1, -1),
        new HexCoord(0, -1),
        new HexCoord(-1, 0),
        new HexCoord(-1, 1),
        new HexCoord(0, 1)
    ];

    neighbor(dir) {
        const d = HexCoord.Directions[dir];
        return new HexCoord(this.q + d.q, this.r + d.r);
    }

    static add(a, b) {
        return new HexCoord(a.q + b.q, a.r + b.r);
    }

    equals(other) {
        if (!(other instanceof HexCoord)) return false;
        return this.q === other.q && this.r === other.r;
    }

    hashCode() {
        return `${this.q},${this.r}`;
    }

    toString() {
        return `(${this.q}, ${this.r})`;
    }

    static distance(a, b) {
        const dq = a.q - b.q;
        const dr = a.r - b.r;
        const ds = (-a.q - a.r) - (-b.q - b.r);

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
        const x = this.hexSize * Math.sqrt(3) * (this.q + this.r * 0.5);
        const z = this.hexSize * (1.5 * this.r);

        return { x, y: 0, z };
    }

    static worldToHex(pos, hexSize = 1) {
        const q = (Math.sqrt(3) / 3 * pos.x - 1 / 3 * pos.z) / hexSize;
        const r = (2 / 3 * pos.z) / hexSize;

        return HexCoord.hexRound(q, r, hexSize);
    }

    static hexRound(q, r, hexSize = 1) {
        let x = q;
        let z = r;
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