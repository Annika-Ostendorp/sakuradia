import { Animal } from "/src/data/Animal.js";
import { Landscape } from "/src/data/Landscape.js";

export function getModelPathForKeystone(landscape) {
    switch (landscape) {
        case Landscape.BAMBOOFOREST:
            return "/assets/models/full_tiles/bamboo/bamboo_keystone_sprint3_pointY.glb";
        case Landscape.MOUNTAIN:
            return "/assets/models/full_tiles/mountain/mountain_keystone_sprint3_pointY.glb";
        case Landscape.POND:
            return "/assets/models/full_tiles/pond/pond_keystone_sprint3_pointY.glb";
        case Landscape.SAKURA:
            return "/assets/models/full_tiles/sakura/sakura_keystone_sprint3_pointY.glb";
        case Landscape.WETLAND:
            return "/assets/models/full_tiles/wetland/wetland_keystone_sprint3_pointY.glb";
    }
}

export function getModelPathForHalfTile(landscape) {
    switch (landscape) {
        case Landscape.BAMBOOFOREST:
            return "/assets/models/half_tiles/bamboo/bamboo_half_sprint3.glb";
        case Landscape.MOUNTAIN:
            return "/assets/models/half_tiles/mountain/mountain_half_sprint3.glb";
        case Landscape.POND:
            return "/assets/models/half_tiles/pond/pond_half_sprint3.glb";
        case Landscape.SAKURA:
            return "/assets/models/half_tiles/sakura/sakura_half_sprint3.glb";
        case Landscape.WETLAND:
            return "/assets/models/half_tiles/wetland/wetland_half_sprint3.glb";
    }
}

// CRANE: "Crane",
// JAPANMAKAK: "Japanmakak",
// KOI: "Koi",
// PANDA: "Panda",
// SIKA: "Sika",

export function getModelForAnimal(animal) {
    switch (animal) {
        case ANIMAL.Crane:
            return "/assets/models/animals/crane/07-01_Crane.glb.glb";
        case ANIMAL.Japanmakak:
            return "/assets/models/animals/japanmakak/05-19_Japanmakak.glb.glb";
        case ANIMAL.Koi:
            return "/assets/models/animals/koi/07-01_Koi.glb.glb";
        case ANIMAL.Panda:
            return "/assets/models/animals/panda/05-19_Panda.glb.glb";
        case ANIMAL.Sika:
            return "/assets/models/animals/sika/07-01_Sika.glb.glb";
    }
}