import { Animal } from "/src/data/Animal.js";
import { Landscape } from "/src/data/Landscape.js";

export function getModelPathForKeystone(landscape) {
  switch (landscape) {
    case Landscape.BAMBOOFOREST:
      return "/assets/models/full_tiles/bamboo/bamboo_keystone_sprint3_pointY.glb";
    case Landscape.MOUNTAIN:
      return "/assets/models/full_tiles/mountain/mountain_keystone_sprint3_pointY.glb";
    case Landscape.POND:
      return "/assets/models/full_tiles/pond/pond_lower.glb";
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
      return "/assets/models/half_tiles/pond/pond_half_lower.glb";
    case Landscape.SAKURA:
      return "/assets/models/half_tiles/sakura/sakura_half_sprint3.glb";
    case Landscape.WETLAND:
      return "/assets/models/half_tiles/wetland/wetland_half_sprint3.glb";
  }
}

export function getModelForAnimal(animal) {
  switch (animal) {
    case Animal.CRANE:
      return "/assets/models/animals/crane/07-01_Crane.glb";
    case Animal.JAPANMAKAK:
      return "/assets/models/animals/japanmakak/07-03_Japanmakak.glb";
    case Animal.KOI:
      return "/assets/models/animals/koi/07-01_Koi.glb";
    case Animal.PANDA:
      return "/assets/models/animals/panda/05-19_Panda.glb";
    case Animal.SIKA:
      return "/assets/models/animals/sika/07-01_Sika.glb";
  }
}

export function getIconPathForAnimal(animal) {
  switch (animal) {
    case Animal.CRANE:
      return "/assets/images/animals/crane.png";
    case Animal.JAPANMAKAK:
      return "/assets/images/animals/japanmakak.png";
    case Animal.KOI:
      return "/assets/images/animals/koi.png";
    case Animal.PANDA:
      return "/assets/images/animals/panda.png";
    case Animal.SIKA:
      return "/assets/images/animals/sika.png";
  }
}