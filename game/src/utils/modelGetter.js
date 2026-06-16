export default function getModelPathForKeystone(landscape) {
    switch (landscape) {
        case Landscape.BAMBOOFOREST:
            return "assets/models/tiles/designed/bamboo/bamboo_tile_sprint2.glb";
        case Landscape.MOUNTAIN:
            return "assets/models/tiles/designed/mountain/mountain_tile_sprint2.glb";
        case Landscape.POND:
            return "assets/models/tiles/designed/pond/pond_tile_sprint2.glb";
        case Landscape.SAKURA:
            return "assets/models/tiles/designed/sakura/sakura_tile_sprint2.glb";
        case Landscape.WETLAND:
            return "assets/models/tiles/designed/wetland/wetland_tile_sprint2.glb";
    }
}