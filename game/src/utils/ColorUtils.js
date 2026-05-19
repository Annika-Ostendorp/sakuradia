import { Landscape } from "../data/Landscape";

export default class ColorUtils {

    getColorForLandscape(landscape) {
        switch (landscape) {
            case Landscape.MOUNTAIN:
                return 0x888888; // Grau
            case Landscape.RIVER:
                return 0x0000ff; // Blau
            case Landscape.WETLAND:
                return 0x00ff00; // Gruen
            case Landscape.BAMBOOFOREST:
                return 0x228b22; // Dunkelgrün
            case Landscape.GRASSLAND:
                return 0x7cfc00; // Hellgrün
            default:
                return 0xffffff; // Weiss für undefined oder unbekannte Landschaften
        }
    }
}
