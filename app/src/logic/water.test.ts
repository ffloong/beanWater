import { describe, expect, it } from 'vitest'
import { calcWater } from './water'
import { getRecipe } from '../data/recipes'

describe('calcWater', () => {
  it('按份数等比换算食材与水量', () => {
    const r = getRecipe('classic_soybean_milk')!
    const p = calcWater(r, 4)
    expect(p.waterMl).toBe(1800)
    expect(p.ingredients.find((i) => i.ingredientId === 'soybean')!.amount).toBe(100)
  })

  it('浓稠档减少水量', () => {
    const r = getRecipe('red_bean_oat_porridge_drink')!
    const p = calcWater(r, 2, 'thick')
    expect(p.waterMl).toBe(Math.round(800 * 0.85))
  })

  it('稀档增加水量', () => {
    const r = getRecipe('classic_soybean_milk')!
    const p = calcWater(r, 2, 'thin')
    expect(p.waterMl).toBe(Math.round(900 * 1.15))
  })

  it('单人份不低于最低水位线（钳制并标记）', () => {
    const r = getRecipe('classic_soybean_milk')!
    const p = calcWater(r, 1, 'thick') // 900*0.5*0.85 = 382 < 450
    expect(p.clampedToMin).toBe(true)
    expect(p.waterMl).toBe(450)
  })

  it('无水配方（奶昔）：基底液量换算并按最低水位线钳制', () => {
    const r = getRecipe('banana_oat_smoothie')!
    const p = calcWater(r, 1)
    // 基底 250+250=500 × 0.5 = 250 < 500 → 钳制到 500
    expect(p.waterMl).toBe(0)
    expect(p.clampedToMin).toBe(true)
    expect(p.liquidBaseMl).toBe(500)
  })
})
