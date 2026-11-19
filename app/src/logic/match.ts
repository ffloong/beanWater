import type { Allergen, IngredientId, Recipe } from '../types'
import { getIngredient } from '../data/ingredients'

export type MatchStatus =
  | 'can_make' // 现在就能做：必需与基底组全部直接具备
  | 'missing_one' // 加一样就能做：只缺 1 个必需单元（提示补购）
  | 'substitutable' // 相似可替代：缺口可用替代表覆盖
  | 'missing_more' // 缺 2 个及以上单元

export interface MatchResult {
  recipe: Recipe
  status: MatchStatus
  /** 直接具备的必需单元数 */
  matchedUnits: number
  /** 必需单元总数（必需食材 + 每个至少选一组各算 1 单元） */
  totalUnits: number
  /** 缺失单元数（组缺口算 1） */
  missingUnits: number
  /** 完全缺失的食材 id（“至少选一”组缺失时列出全部组员，用于展示） */
  missingIds: IngredientId[]
  /** 本身缺失但可用常备食材替代的食材 id */
  substituteIds: IngredientId[]
  /** 0–1，替代覆盖也计入覆盖 */
  coverage: number
}

interface Unit {
  kind: 'item' | 'group'
  /** kind=item 时为单个食材；kind=group 时为组内全部成员 */
  ids: IngredientId[]
}

/** 必需单元 = required 食材 + 每个至少选一组各 1 单元（PRODUCT_DESIGN.md §7） */
function requiredUnits(recipe: Recipe): Unit[] {
  const units: Unit[] = recipe.ingredients
    .filter((i) => i.required)
    .map((i) => ({ kind: 'item' as const, ids: [i.ingredientId] }))
  const groups = new Map<string, IngredientId[]>()
  for (const i of recipe.ingredients) {
    if (i.requiredAnyGroup) {
      const list = groups.get(i.requiredAnyGroup) ?? []
      list.push(i.ingredientId)
      groups.set(i.requiredAnyGroup, list)
    }
  }
  for (const ids of groups.values()) units.push({ kind: 'group', ids })
  return units
}

function coveredBySubstitute(id: IngredientId, pantry: Set<IngredientId>): boolean {
  return (getIngredient(id)?.substitutes ?? []).some((s) => pantry.has(s))
}

export function matchRecipe(recipe: Recipe, pantry: Set<IngredientId>): MatchResult {
  const missingIds: IngredientId[] = []
  const substituteIds: IngredientId[] = []
  let matchedUnits = 0
  let substituteUnits = 0
  let missingUnits = 0
  let totalUnits = 0

  for (const unit of requiredUnits(recipe)) {
    totalUnits++
    if (unit.kind === 'item') {
      const id = unit.ids[0]
      if (pantry.has(id)) {
        matchedUnits++
      } else if (coveredBySubstitute(id, pantry)) {
        substituteUnits++
        substituteIds.push(id)
      } else {
        missingUnits++
        missingIds.push(id)
      }
    } else {
      // 组：任一组员直接具备即满足；否则任一组员的替代可用也算替代覆盖
      const directHit = unit.ids.find((id) => pantry.has(id))
      if (directHit) {
        matchedUnits++
      } else {
        const subHits = unit.ids.filter((id) => coveredBySubstitute(id, pantry))
        if (subHits.length > 0) {
          substituteUnits++
          substituteIds.push(...subHits)
        } else {
          missingUnits++
          missingIds.push(...unit.ids)
        }
      }
    }
  }

  const coverage = totalUnits === 0 ? 1 : (matchedUnits + substituteUnits) / totalUnits

  let status: MatchStatus
  if (missingUnits === 0 && substituteUnits === 0) status = 'can_make'
  else if (missingUnits === 0) status = 'substitutable'
  else if (missingUnits === 1) status = 'missing_one'
  else status = 'missing_more'

  return {
    recipe,
    status,
    matchedUnits,
    totalUnits,
    missingUnits,
    missingIds,
    substituteIds,
    coverage,
  }
}

/** 食谱所含食材的过敏原与用户忌口的交集（安全项，命中即从推荐剔除，§12） */
export function allergenConflicts(recipe: Recipe, allergenFree: Set<Allergen>): Allergen[] {
  if (allergenFree.size === 0) return []
  const conflicts = new Set<Allergen>()
  for (const item of recipe.ingredients) {
    for (const a of getIngredient(item.ingredientId)?.allergens ?? []) {
      if (allergenFree.has(a)) conflicts.add(a)
    }
  }
  return [...conflicts]
}

/** 详情页注意事项：食材 cautions 自动聚合 + 食谱特有 warnings（§12 防漏标） */
export function aggregatedWarnings(recipe: Recipe): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const push = (s: string) => {
    if (!seen.has(s)) {
      seen.add(s)
      result.push(s)
    }
  }
  for (const item of recipe.ingredients) {
    for (const c of getIngredient(item.ingredientId)?.cautions ?? []) push(c)
  }
  for (const w of recipe.warnings) push(w)
  return result
}
