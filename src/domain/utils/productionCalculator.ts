import type { Node } from '@/data-source/dto/node.dto'
import type { ProductionResult } from '@/data-source/dto/productionResult'

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
        const veins = node.factor || 1

        // Получаем количество предметов на выходе из рецепта
        const outQty = Object.values(recipe.out)[0] || 1

        // Время рецепта в секундах
        const recipeTimeSec = recipe.time

        // Скорость машины
        const machineSpeed = building.machine?.speed || 1

        // Коэффициент эффективности по энергии (пока всегда 1)
        const powerEfficiency = 1.0

        // Формула: rate_sec = veins * (out_qty / recipe_time_sec) * machine_speed * power_efficiency
        let rate = veins * (outQty / recipeTimeSec) * machineSpeed * powerEfficiency
        // Apply productivity coefficient
        const coefficient = node.coefficient ?? 1
        rate = rate * coefficient

        return {
            rate,
            inputUnit: 'шт',
            outputUnit: 'шт/сек',
            inputLabel: 'Количество жил',
            inputType: 'veins',
            inputMin: 1,
            inputMax: 100,
            inputStep: 1,
            inputPrecision: 0,
        }
    }

    /**
     * Расчет для oil-extractor
     */
    private static calculateOilExtractorProduction(node: Node): ProductionResult {
        // Для oil-extractor скорость добычи указывается напрямую
        let rate = node.factor || 0
        // Apply productivity coefficient
        const coefficient = node.coefficient ?? 1
        rate = rate * coefficient

        return {
            rate,
            inputUnit: 'шт/сек',
            outputUnit: 'шт/сек',
            inputLabel: 'Скорость добычи',
            inputType: 'rate',
            inputMin: 0,
            inputMax: 1000,
            inputStep: 0.0001,
            inputPrecision: 4,
        }
    }

    /**
     * Расчет для ray-receiver
     */
    private static calculateRayReceiverProduction(node: Node): ProductionResult {
        // Для ray-receiver скорость добычи указывается напрямую (целое число)
        let rate = node.factor || 0
        // Apply productivity coefficient
        const coefficient = node.coefficient ?? 1
        rate = rate * coefficient

        return {
            rate,
            inputUnit: '',
            outputUnit: 'шт/сек',
            inputLabel: 'Скорость добычи',
            inputType: 'rate',
            inputMin: 0,
            inputMax: 1000,
            inputStep: 1,
            inputPrecision: 0,
        }
    }

    /**
     * Расчет для water-pump
     */
    private static calculateWaterPumpProduction(node: Node): ProductionResult {
        const recipe = node.recipe!
        const building = node.item
        const buildings = node.factor || 1

        // Получаем количество предметов на выходе из рецепта
        const outQty = Object.values(recipe.out)[0] || 1

        // Время рецепта в секундах
        const recipeTimeSec = recipe.time

        // Скорость машины
        const machineSpeed = building.machine?.speed || 1

        // Коэффициент эффективности по энергии (пока всегда 1)
        const powerEfficiency = 1.0

        // Формула: rate_sec = buildings * (out_qty / recipe_time_sec) * machine_speed * power_efficiency
        let rate = buildings * (outQty / recipeTimeSec) * machineSpeed * powerEfficiency
        // Apply productivity coefficient
        const coefficient = node.coefficient ?? 1
        rate = rate * coefficient

        return {
            rate,
            inputUnit: '',
            outputUnit: 'шт/сек',
            inputLabel: 'Количество построек',
            inputType: 'buildings',
            inputMin: 1,
            inputMax: 100,
            inputStep: 1,
            inputPrecision: 0,
        }
    }

    /**
     * Возвращает пустой результат для нод без рецепта или не-майнеров
     */
    private static getEmptyResult(): ProductionResult {
        return {
            rate: 0,
            inputUnit: 'шт/сек',
            outputUnit: 'шт/сек',
            inputLabel: '',
            inputType: 'veins',
            inputMin: 0,
            inputMax: 0,
            inputStep: 1,
            inputPrecision: 0,
        }
    }
}
