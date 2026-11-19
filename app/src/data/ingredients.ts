import seed from '../../../seed/ingredients.json'
import type { Ingredient, IngredientId } from '../types'

export const ingredients: Ingredient[] = seed.ingredients as unknown as Ingredient[]

const byId = new Map<IngredientId, Ingredient>(ingredients.map((i) => [i.id, i]))

export function getIngredient(id: IngredientId): Ingredient | undefined {
  return byId.get(id)
}

export function ingredientName(id: IngredientId): string {
  return byId.get(id)?.name ?? id
}

export function ingredientEmoji(id: IngredientId): string {
  return byId.get(id)?.emoji ?? '🥄'
}

/** 首次引导（§4.6）优先展示的常用食材，勾选即可覆盖大部分种子食谱 */
export const COMMON_INGREDIENT_IDS: IngredientId[] = [
  'soybean',
  'black_soybean',
  'red_bean',
  'mung_bean',
  'oat',
  'millet',
  'black_rice',
  'walnut',
  'red_date',
  'apple',
  'banana',
  'carrot',
  'spinach',
  'milk',
  'honey',
]
