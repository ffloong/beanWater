import seed from '../../../seed/recipes.json'
import type { Recipe, RecipeId } from '../types'

export const recipes: Recipe[] = seed.recipes as unknown as Recipe[]

/** 六大分类（§4.2），发现页与匹配时段映射使用，顺序即展示顺序 */
export const RECIPE_CATEGORIES = [
  '养生豆浆',
  '米糊',
  '五谷糊',
  '果蔬汁',
  '奶昔',
  '汤羹',
] as const

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]

export const CATEGORY_EMOJI: Record<string, string> = {
  养生豆浆: '🫘',
  米糊: '🥣',
  五谷糊: '🌾',
  果蔬汁: '🥤',
  奶昔: '🥛',
  汤羹: '🍲',
}

const byId = new Map<RecipeId, Recipe>(recipes.map((r) => [r.id, r]))

export function getRecipe(id: RecipeId): Recipe | undefined {
  return byId.get(id)
}
