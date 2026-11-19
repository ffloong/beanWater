import type { Recipe } from '../types'

export type Thickness = 'thin' | 'standard' | 'thick'

/** 稠度因子：稀 +15%，标准 1，浓稠 -15%（对应“喜欢浓稠可减少水量”的种子提示） */
const THICKNESS_FACTOR: Record<Thickness, number> = {
  thin: 1.15,
  standard: 1,
  thick: 0.85,
}

export interface WaterPlan {
  recipeId: string
  servings: number
  thickness: Thickness
  /** 换算后的加水量；无水配方（奶昔类）为 0 */
  waterMl: number
  /** 无水配方：基底液体（牛奶/豆浆）总量换算 */
  liquidBaseMl: number
  /** 单人份最低总液量（机器最低水位线） */
  minWaterMl: number
  /** 实际液量被最低水位线钳制时为 true，UI 需提示 */
  clampedToMin: boolean
  ingredients: Array<{ ingredientId: string; amount: number }>
}

export function calcWater(recipe: Recipe, servings?: number, thickness: Thickness = 'standard'): WaterPlan {
  const factor = (servings ?? recipe.servings) / recipe.servings
  const waterRaw = recipe.waterMl * factor * THICKNESS_FACTOR[thickness]
  const water = Math.round(waterRaw)

  // 奶昔等无水配方：基底液量 = 至少选一组全部成员换算后求和
  let liquidBase = 0
  if (recipe.waterMl === 0) {
    for (const i of recipe.ingredients) {
      if (i.requiredAnyGroup) liquidBase += i.amount * factor
    }
  }
  const liquidTotal = recipe.waterMl === 0 ? Math.round(liquidBase) : water

  const clampedToMin = liquidTotal < recipe.minWaterMl
  return {
    recipeId: recipe.id,
    servings: servings ?? recipe.servings,
    thickness,
    waterMl: recipe.waterMl === 0 ? 0 : Math.max(water, recipe.minWaterMl),
    liquidBaseMl: recipe.waterMl === 0 ? Math.max(Math.round(liquidBase), recipe.minWaterMl) : 0,
    minWaterMl: recipe.minWaterMl,
    clampedToMin,
    ingredients: recipe.ingredients.map((i) => ({
      ingredientId: i.ingredientId,
      amount: Math.round(i.amount * factor),
    })),
  }
}
