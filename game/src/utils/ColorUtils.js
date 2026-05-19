import { Landscape } from "../data/Landscape.js";

export default class ColorUtils {

    getColorForLandscape(landscape) {
        switch (landscape) {
            case Landscape.MOUNTAIN:
                return 0x000008; // Grau
            case Landscape.POND:
                return 0x3083BC; // Blau
            case Landscape.WETLAND:
                return 0x00ff00; // Gruen
            case Landscape.BAMBOOFOREST:
                return 0x228b22; // Dunkelgrün
            case Landscape.SAKURA:
                return 0xFFB7C5; // Rosa
            default:
                return 0xffffff; // Weiss für undefined oder unbekannte Landschaften
        }
    }
}
