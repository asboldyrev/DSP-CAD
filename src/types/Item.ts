import type { Category } from "@/enums/Category";
import type { Icon } from "./Icon";

export interface Item {
    category: Category; // buildings, buildings-alt, components, effects, technologies, upgrades
    id: string; // tesla-tower, wireless-power-tower, satellite-substation, wind-turbine, thermal-power-plant, solar-panel, geothermal-power-station, mini-fusion-power-plant, energy-exchanger, accumulator, ...
    name: string; // Tesla Tower, Wireless Power Tower, Satellite Substation, Wind Turbine, Thermal Power Plant, Solar Panel, Geothermal Power Station, Mini Fusion Power Plant, Energy Exchanger, Accumulator, ...
    row?: number; // 0, 1, 2, 3, 4, 5, 6, 7
    stack?: number; // 100, 30, 50, 20, 300, 10, 200, 1000, 500
    machine?: Machine; // {"drain":90,"type":"electric","usage":4800}, {"drain":720,"type":"electric","usage":0}, {"speed":1,"type":"electric","usage":-300}, {"fuelCategories":["chemical"],"speed":1,"type":"burner"}, {"speed":1,"type":"electric","usage":-360}, {"speed":1,"type":"electric","usage":-4800}, {"fuelCategories":["nuclear"],"speed":1,"type":"burner"}, {"speed":1,"type":"electric","usage":54000}, {"speed":1,"type":"electric","usage":120000}, {"fuelCategories":["antimatter"],"speed":1,"type":"burner"}, ...
    fuel?: Fuel; // {"category":"accumulator","value":540}, {"category":"chemical","value":2.7}, {"category":"chemical","value":4.05}, {"category":"chemical","value":9}, {"category":"chemical","value":6.75}, {"category":"chemical","value":4.5}, {"category":"chemical","value":54}, {"category":"nuclear","value":600}, {"category":"antimatter","value":7200}, {"category":"antimatter","value":72000}, ...
    belt?: Belt; // {"speed":6}, {"speed":12}, {"speed":30}
    icon?: Icon; // ray-receiver
    module?: Module; // {"consumption":0.3,"limitation":"productivity","productivity":0.125,"proliferat…, {"consumption":0.7,"limitation":"productivity","productivity":0.2,"proliferator…, {"consumption":1.5,"limitation":"productivity","productivity":0.25,"proliferato…, {"consumption":0.3,"proliferator":"proliferator-1","speed":0.25,"sprays":12}, {"consumption":0.7,"proliferator":"proliferator-2","speed":0.5,"sprays":24}, {"consumption":1.5,"proliferator":"proliferator-3","speed":1,"sprays":60}
    technology: Technology; // {"prerequisites":["basic-chemical-engineering"],"unlockedRecipes":["graphene","…, {"prerequisites":["controlled-annihilation-reaction"],"unlockedRecipes":["artif…, {"prerequisites":["electromagnetism"],"unlockedRecipes":["arc-smelter","glass"]}, {"prerequisites":["electromagnetism"],"unlockedRecipes":["assembling-machine-1"…, {"prerequisites":["fluid-storage-encapsulation","plasma-extract-refining"],"unl…, {"prerequisites":["electromagnetism"],"unlockedRecipes":["conveyor-belt-1","sto…, {"prerequisites":["structure-matrix-technology"],"unlockedRecipes":["casimir-cr…, {"prerequisites":["dirac-inversion-mechanism"],"unlockedRecipes":["annihilation…, {"prerequisites":["smelting-purification"],"unlockedRecipes":["crystal-silicon"…, {"prerequisites":["thermal-power","plasma-extract-refining"],"unlockedRecipes":…, ...
  }

export interface Machine {
    drain: number; // 90, 720, 9, 4.5, 18, 60, 168, 12, 24, 36, ...
    type: string; // electric, burner
    usage: number; // 4800, 0, -300, -360, -4800, 54000, 120000, 144, 36, 90, ...
    speed: number; // 1, 2, 3, 0.75, 1.5
    fuelCategories: Array<string>; // ["chemical"], ["nuclear"], ["antimatter"], ["lens"]
    modules: number; // 1
    totalRecipe: boolean; // true
  }
  
export interface Fuel {
    category: string; // accumulator, chemical, nuclear, antimatter, lens
    value: number; // 540, 2.7, 4.05, 9, 6.75, 4.5, 54, 600, 7200, 72000, ...
  }
  
export interface Belt {
    speed: number; // 6, 12, 30
  }

export interface Module {
    consumption: number; // 0.3, 0.7, 1.5
    limitation: string; // productivity
    productivity: number; // 0.125, 0.2, 0.25
    proliferator: string; // proliferator-1, proliferator-2, proliferator-3
    sprays: number; // 12, 24, 60
    speed: number; // 0.25, 0.5, 1
  }
  
export interface Technology {
    prerequisites: Array<string>; // ["basic-chemical-engineering"], ["controlled-annihilation-reaction"], ["electromagnetism"], ["fluid-storage-encapsulation","plasma-extract-refining"], ["structure-matrix-technology"], ["dirac-inversion-mechanism"], ["smelting-purification"], ["thermal-power","plasma-extract-refining"], ["controlled-annihilation-reaction","df-plasma-turret-tech"], ["df-prototype-tech","magnetic-particle-trap"], ...
    unlockedRecipes: Array<string>; // ["graphene","graphene-advanced"], ["artificial-star"], ["arc-smelter","glass"], ["assembling-machine-1"], ["chemical-plant","plastic","sulfuric-acid"], ["conveyor-belt-1","storage-1","sorter-1"], ["casimir-crystal","casimir-crystal-advanced"], ["annihilation-constraint-sphere","antimatter-fuel-rod"], ["crystal-silicon","diamond","diamond-advanced"], ["fractionator","deuterium-fractionation"], ...
  }