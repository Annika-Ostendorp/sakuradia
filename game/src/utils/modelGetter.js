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
