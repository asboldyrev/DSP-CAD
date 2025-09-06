import type { Node } from '@/types/Node'
import type { Recipe } from '@/types/Recipes'
import { useProducersStore } from '@/stores/producersStore'

export interface ProductionResult {
  rate: number
  unit: string
  inputLabel: string
  inputType: 'veins' | 'rate' | 'buildings'
  inputMin: number
  inputMax: number
  inputStep: number
  inputPrecision: number
}

export class ProductionCalculator {
  /**
   * Рассчитывает производительность для ноды
   */
  static calculateProduction(node: Node): ProductionResult {
    if (!node.recipe) {
      return this.getEmptyResult()
    }

    const buildingId = node.item.id

    switch (buildingId) {
      case 'mining-machine':
      case 'advanced-mining-machine':
        return this.calculateMiningMachineProduction(node)
      
      case 'oil-extractor':
        return this.calculateOilExtractorProduction(node)
      
      case 'ray-receiver':
        return this.calculateRayReceiverProduction(node)
      
      case 'water-pump':
        return this.calculateWaterPumpProduction(node)
      
      default:
        // Проверяем, является ли строение процессором
        if (this.isProcessor(node)) {
          return this.calculateProcessorProduction(node)
        }
        return this.getEmptyResult()
    }
  }

  /**
   * Расчет для mining-machine и advanced-mining-machine
   */
  private static calculateMiningMachineProduction(node: Node): ProductionResult {
    const recipe = node.recipe!
    const building = node.item
    const veins = node.veins || 1

    // Получаем количество предметов на выходе из рецепта
    const outQty = Object.values(recipe.out)[0] || 1

    // Время рецепта в секундах
    const recipeTimeSec = recipe.time

    // Скорость машины
    const machineSpeed = building.machine?.speed || 1

    // Коэффициент эффективности по энергии (пока всегда 1)
    const powerEfficiency = 1.0

    // Формула: rate_sec = veins * (out_qty / recipe_time_sec) * machine_speed * power_efficiency
    const rate = veins * (outQty / recipeTimeSec) * machineSpeed * powerEfficiency

    return {
      rate,
      unit: 'шт/сек',
      inputLabel: 'Количество жил',
      inputType: 'veins',
      inputMin: 1,
      inputMax: 100,
      inputStep: 1,
      inputPrecision: 0
    }
  }

  /**
   * Расчет для oil-extractor
   */
  private static calculateOilExtractorProduction(node: Node): ProductionResult {
    // Для oil-extractor скорость добычи указывается напрямую
    const rate = node.veins || 0

    return {
      rate,
      unit: 'шт/сек',
      inputLabel: 'Скорость добычи',
      inputType: 'rate',
      inputMin: 0,
      inputMax: 1000,
      inputStep: 0.0001,
      inputPrecision: 4
    }
  }

  /**
   * Расчет для ray-receiver
   */
  private static calculateRayReceiverProduction(node: Node): ProductionResult {
    // Для ray-receiver скорость добычи указывается напрямую (целое число)
    const rate = node.veins || 0

    return {
      rate,
      unit: 'шт/сек',
      inputLabel: 'Скорость добычи',
      inputType: 'rate',
      inputMin: 0,
      inputMax: 1000,
      inputStep: 1,
      inputPrecision: 0
    }
  }

  /**
   * Расчет для water-pump
   */
  private static calculateWaterPumpProduction(node: Node): ProductionResult {
    const recipe = node.recipe!
    const building = node.item
    const buildings = node.veins || 1

    // Получаем количество предметов на выходе из рецепта
    const outQty = Object.values(recipe.out)[0] || 1

    // Время рецепта в секундах
    const recipeTimeSec = recipe.time

    // Скорость машины
    const machineSpeed = building.machine?.speed || 1

    // Коэффициент эффективности по энергии (пока всегда 1)
    const powerEfficiency = 1.0

    // Формула: rate_sec = buildings * (out_qty / recipe_time_sec) * machine_speed * power_efficiency
    const rate = buildings * (outQty / recipeTimeSec) * machineSpeed * powerEfficiency

    return {
      rate,
      unit: 'шт/сек',
      inputLabel: 'Количество построек',
      inputType: 'buildings',
      inputMin: 1,
      inputMax: 100,
      inputStep: 1,
      inputPrecision: 0
    }
  }

  /**
   * Возвращает пустой результат для нод без рецепта или не-майнеров
   */
  private static getEmptyResult(): ProductionResult {
    return {
      rate: 0,
      unit: 'шт/сек',
      inputLabel: '',
      inputType: 'veins',
      inputMin: 0,
      inputMax: 0,
      inputStep: 1,
      inputPrecision: 0
    }
  }

  /**
   * Проверяет, является ли строение майнером
   */
  static isMiner(buildingId: string): boolean {
    const producersStore = useProducersStore()
    return producersStore.isMiner(buildingId)
  }

  /**
   * Проверяет, является ли строение процессором
   */
  static isProcessor(node: Node): boolean {
    // Получаем список процессоров напрямую из producers.json
    const processors = [
      "assembling-machine-1",
      "assembling-machine-2", 
      "assembling-machine-3",
      "df-recomposing-assembler",
      "energy-exchanger",
      "arc-smelter",
      "plane-smelter",
      "df-negentropy-smelter",
      "oil-refinery",
      "chemical-plant",
      "quantum-chemical-plant",
      "fractionator",
      "miniature-particle-collider",
      "matrix-lab",
      "df-self-evolution-lab"
    ]
    return processors.includes(node.item.id)
  }

  /**
   * Расчет производительности для процессоров
   */
  private static calculateProcessorProduction(node: Node): ProductionResult {
    const recipe = node.recipe!
    const buildingCount = node.buildingCount || 1
    const buildingSpeed = node.item.machine?.speed || 1

    // Рассчитываем базовую скорость производства (предметов в секунду)
    // Формула: (количество_выхода / время_рецепта) * скорость_строения * количество_строений
    const outputEntries = Object.entries(recipe.out as unknown as Record<string, number>)
    const totalOutputPerCycle = outputEntries.reduce((sum, [_, quantity]) => sum + quantity, 0)
    
    const baseRate = (totalOutputPerCycle / recipe.time) * buildingSpeed * buildingCount

    return {
      rate: baseRate,
      unit: 'шт/сек',
      inputLabel: 'Количество строений',
      inputType: 'buildings',
      inputMin: 1,
      inputMax: 100,
      inputStep: 1,
      inputPrecision: 0
    }
  }
}