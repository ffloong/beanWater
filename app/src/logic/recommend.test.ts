import { describe, expect, it } from 'vitest'
import { recommend, getTimeSlot, type RecommendInput } from './recommend'
import { getRecipe } from '../data/recipes'
import type { RecipeId } from '../types'

const base: RecommendInput = { pantry: new Set<string>(), allergenFree: new Set(), madeLog: {} }

function pantryOf(recipeIds: RecipeId[]): Set<string> {
  const set = new Set<string>()
  for (const id of recipeIds) {
    for (const i of getRecipe(id)!.ingredients) set.add(i.ingredientId)
  }
  return set
}

describe('recommend', () => {
  it('现在就能做 / 加一样就能做 分桶正确', () => {
    const pantry = pantryOf(['classic_soybean_milk', 'banana_oat_smoothie'])
    const r = recommend({ ...base, pantry }, new Date('2026-11-19T08:00:00'))
    const canIds = r.canMake.map((m) => m.recipe.id)
    expect(canIds).toContain('classic_soybean_milk')
    expect(canIds).toContain('banana_oat_smoothie')
    // 缺核桃的黑豆核桃豆浆应进 missing_one
    const pantry2 = pantryOf(['classic_soybean_milk'])
    pantry2.add('red_date')
    const r2 = recommend({ ...base, pantry: pantry2 }, new Date('2026-11-19T08:00:00'))
    const missingIds = r2.missingOne.map((m) => m.recipe.id)
    expect(missingIds).toContain('black_soybean_walnut_milk')
  })

  it('过敏忌口为安全过滤：忌口坚果后含核桃食谱不出现在任何桶', () => {
    const pantry = pantryOf(['black_soybean_walnut_milk', 'classic_soybean_milk'])
    const r = recommend(
      { ...base, pantry, allergenFree: new Set(['坚果']) },
      new Date('2026-11-19T08:00:00'),
    )
    const all = [...r.canMake, ...r.missingOne, ...r.nearest]
    expect(all.map((m) => m.recipe.id)).not.toContain('black_soybean_walnut_milk')
    expect(r.canMake.map((m) => m.recipe.id)).toContain('classic_soybean_milk')
  })

  it('近 7 天做过的降权，不占同覆盖率首位', () => {
    const pantry = pantryOf(['classic_soybean_milk', 'millet_red_date_warm_porridge'])
    const now = new Date('2026-11-19T08:00:00')
    const madeLog = { classic_soybean_milk: now.getTime() - 24 * 3600 * 1000 }
    const r = recommend({ ...base, pantry, madeLog }, now)
    expect(r.canMake[0].recipe.id).toBe('millet_red_date_warm_porridge')
  })

  it('稀疏兜底：空食材库时 canMake 为空，nearest 按缺口升序给出', () => {
    const r = recommend(base, new Date('2026-11-19T08:00:00'))
    expect(r.canMake).toHaveLength(0)
    // 空食材库时"只缺 1 样"的食谱进 missingOne 并提示补购（§6），属预期行为
    expect(r.nearest.length).toBeGreaterThan(0)
    expect(r.nearest.length).toBeLessThanOrEqual(3)
    // nearest 内部按覆盖率降序
    for (let i = 1; i < r.nearest.length; i++) {
      expect(r.nearest[i - 1].coverage).toBeGreaterThanOrEqual(r.nearest[i].coverage)
    }
  })

  it('晚间时段卡：tomorrowMorning 只含早晨类且需泡豆的排前', () => {
    const pantry = pantryOf(['classic_soybean_milk', 'banana_oat_smoothie', 'millet_red_date_warm_porridge'])
    const r = recommend({ ...base, pantry }, new Date('2026-11-19T20:30:00'))
    const ids = r.tomorrowMorning.map((m) => m.recipe.id)
    expect(ids).toContain('classic_soybean_milk')
    expect(ids).not.toContain('banana_oat_smoothie') // 奶昔非早晨类
    // 泡豆的在前
    expect(ids.indexOf('classic_soybean_milk')).toBeLessThan(
      ids.indexOf('millet_red_date_warm_porridge'),
    )
  })
})

describe('getTimeSlot', () => {
  it('时段边界', () => {
    expect(getTimeSlot(new Date('2026-11-19T06:00:00'))).toBe('morning')
    expect(getTimeSlot(new Date('2026-11-19T12:00:00'))).toBe('afternoon')
    expect(getTimeSlot(new Date('2026-11-19T19:00:00'))).toBe('evening')
    expect(getTimeSlot(new Date('2026-11-19T01:00:00'))).toBe('morning')
  })
})
