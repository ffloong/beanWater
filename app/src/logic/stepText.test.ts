import { describe, expect, it } from 'vitest'
import { renderStep } from './stepText'
import { calcWater } from './water'
import { getRecipe } from '../data/recipes'

describe('renderStep', () => {
  it('{water} 随份数换算', () => {
    const r = getRecipe('classic_soybean_milk')!
    const plan = calcWater(r, 4)
    const out = renderStep(r, r.steps[1], plan)
    expect(out).toContain('1800')
    expect(out).not.toContain('{water}')
  })

  it('{water} 不低于最低水位线（单人份浓稠档钳制）', () => {
    const r = getRecipe('classic_soybean_milk')!
    const plan = calcWater(r, 1, 'thick')
    const out = renderStep(r, r.steps[1], plan)
    expect(out).toContain('450')
  })

  it('{<ingredientId>} 渲染为用量+单位并随份数换算', () => {
    const r = getRecipe('pumpkin_carrot_velvet_soup')!
    const plan = calcWater(r, 1)
    const out = renderStep(r, r.steps[1], plan)
    // 占位符被替换，且牛奶用量减半（100 → 50ml）
    expect(out).not.toContain('{milk}')
    expect(out).toContain('50 ml')
  })

  it('未知占位符原样保留', () => {
    const r = getRecipe('classic_soybean_milk')!
    const plan = calcWater(r, 2)
    const out = renderStep(r, '这是 {unknown} 文案', plan)
    expect(out).toBe('这是 {unknown} 文案')
  })
})
