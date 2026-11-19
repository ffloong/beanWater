import { describe, expect, it } from 'vitest'
import { matchRecipe, allergenConflicts, aggregatedWarnings } from './match'
import { getRecipe } from '../data/recipes'

describe('matchRecipe', () => {
  it('必需食材直接具备 → can_make（可选食材不影响）', () => {
    const r = getRecipe('classic_soybean_milk')!
    const m = matchRecipe(r, new Set(['soybean']))
    expect(m.status).toBe('can_make')
    expect(m.coverage).toBe(1)
  })

  it('缺口可用替代覆盖 → substitutable（黄豆→黑豆）', () => {
    const r = getRecipe('classic_soybean_milk')!
    const m = matchRecipe(r, new Set(['black_soybean']))
    expect(m.status).toBe('substitutable')
    expect(m.substituteIds).toContain('soybean')
    expect(m.coverage).toBe(1)
  })

  it('只缺 1 个必需 → missing_one', () => {
    const r = getRecipe('black_soybean_walnut_milk')!
    const m = matchRecipe(r, new Set(['black_soybean', 'red_date']))
    expect(m.status).toBe('missing_one')
    expect(m.missingIds).toEqual(['walnut'])
  })

  it('缺 2 个及以上 → missing_more', () => {
    const r = getRecipe('black_soybean_walnut_milk')!
    const m = matchRecipe(r, new Set<string>())
    expect(m.status).toBe('missing_more')
    expect(m.missingIds).toEqual(['black_soybean', 'walnut'])
  })

  it('“至少选一”基底组：两样都没有 → 缺 1 个单元（missing_one）', () => {
    const r = getRecipe('banana_oat_smoothie')!
    const m = matchRecipe(r, new Set(['banana', 'oat']))
    expect(m.status).toBe('missing_one')
    // 缺口列出组内全部成员
    expect(m.missingIds).toEqual(expect.arrayContaining(['milk', 'soy_milk']))
  })

  it('“至少选一”基底组：任一具备 → can_make', () => {
    const r = getRecipe('banana_oat_smoothie')!
    const m = matchRecipe(r, new Set(['banana', 'oat', 'soy_milk']))
    expect(m.status).toBe('can_make')
  })
})

describe('allergenConflicts', () => {
  it('忌口坚果时，含核桃的食谱命中冲突', () => {
    const r = getRecipe('black_soybean_walnut_milk')!
    expect(allergenConflicts(r, new Set(['坚果']))).toEqual(['坚果'])
  })
  it('无忌口时不命中', () => {
    const r = getRecipe('black_soybean_walnut_milk')!
    expect(allergenConflicts(r, new Set())).toEqual([])
  })
})

describe('aggregatedWarnings', () => {
  it('聚合食材 cautions + 食谱特有 warnings，去重保序', () => {
    const r = getRecipe('classic_soybean_milk')!
    const w = aggregatedWarnings(r)
    // 黄豆 cautions：必须充分煮熟 / 大豆过敏禁用
    expect(w).toContain('必须充分煮熟')
    expect(w).toContain('大豆过敏禁用')
    // 无重复
    expect(new Set(w).size).toBe(w.length)
  })
})
