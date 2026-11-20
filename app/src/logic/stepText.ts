import type { Recipe } from '../types'
import { getIngredient } from '../data/ingredients'
import type { WaterPlan } from './water'

/**
 * 渲染步骤模板（数据约定见 PRODUCT_DESIGN.md §7）：
 * - {water} → 换算后的加水量（已含最低水位线钳制）
 * - {<ingredientId>} → 换算后的用量 + 单位，如 "100 ml"
 * - 未知占位符原样保留，避免误伤普通文案
 */
export function renderStep(recipe: Recipe, step: string, plan: WaterPlan): string {
  return step.replace(/\{([a-zA-Z_]\w*)\}/g, (raw, token: string) => {
    if (token === 'water') return String(plan.waterMl)
    const item = plan.ingredients.find((i) => i.ingredientId === token)
    if (item) {
      const unit = getIngredient(token)?.unit ?? ''
      return `${item.amount} ${unit}`.trim()
    }
    return raw
  })
}
