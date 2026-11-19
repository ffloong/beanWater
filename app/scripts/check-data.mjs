#!/usr/bin/env node
/**
 * 种子数据校验（PROGRESS.md Step 2 验收，`npm run check:data`）：
 * - JSON 可解析，字段齐全
 * - substitutes 双向闭环、无悬空引用
 * - 食谱引用的食材必须存在；"至少选一"组规则自洽
 * - 六大分类全部有内容（不允许空分类）
 * - allergens / emoji 已结构化标注
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ingredients = JSON.parse(readFileSync(join(root, 'seed', 'ingredients.json'), 'utf8')).ingredients
const recipes = JSON.parse(readFileSync(join(root, 'seed', 'recipes.json'), 'utf8')).recipes

const CATS = new Set(['养生豆浆', '米糊', '五谷糊', '果蔬汁', '奶昔', '汤羹'])
const REQUIRED_INGREDIENT_FIELDS = ['id', 'name', 'emoji', 'category', 'tags', 'allergens', 'unit', 'defaultAmount', 'substitutes', 'cautions']
const REQUIRED_RECIPE_FIELDS = ['id', 'title', 'category', 'servings', 'timeMinutes', 'difficulty', 'ingredients', 'waterMl', 'minWaterMl', 'soakMinutes', 'mode', 'steps', 'tags', 'nutrition', 'warnings']

const errors = []
const ingIds = new Set(ingredients.map((i) => i.id))
const byId = new Map(ingredients.map((i) => [i.id, i]))

for (const i of ingredients) {
  for (const f of REQUIRED_INGREDIENT_FIELDS) {
    if (i[f] === undefined) errors.push(`食材 ${i.id} 缺字段 ${f}`)
  }
  for (const s of i.substitutes ?? []) {
    if (!ingIds.has(s)) errors.push(`悬空替代引用: ${i.id} -> ${s}`)
    else if (!byId.get(s).substitutes.includes(i.id)) errors.push(`替代未双向: ${i.id} -> ${s}`)
  }
}

const catCount = {}
for (const r of recipes) {
  for (const f of REQUIRED_RECIPE_FIELDS) {
    if (r[f] === undefined) errors.push(`食谱 ${r.id} 缺字段 ${f}`)
  }
  if (!CATS.has(r.category)) errors.push(`食谱 ${r.id} 分类非法: ${r.category}`)
  catCount[r.category] = (catCount[r.category] ?? 0) + 1
  for (const item of r.ingredients) {
    if (!ingIds.has(item.ingredientId)) errors.push(`食谱 ${r.id} 引用不存在食材: ${item.ingredientId}`)
  }
  const noWater = r.waterMl === 0
  const groups = r.ingredients.filter((i) => i.requiredAnyGroup)
  if (noWater && groups.length === 0) errors.push(`食谱 ${r.id} 无水且无"至少选一"基底组`)
  for (const g of groups) if (g.required) errors.push(`食谱 ${r.id} 组内成员 ${g.ingredientId} 不应为 required`)
}

for (const c of CATS) if (!catCount[c]) errors.push(`空分类: ${c}`)

console.log(`ingredients: ${ingredients.length}, recipes: ${recipes.length}`)
console.log(`分类覆盖: ${JSON.stringify(catCount)}`)
if (errors.length) {
  console.error('\n发现问题:')
  for (const e of errors) console.error(' - ' + e)
  process.exit(1)
}
console.log('check:data 全部通过 ✓')
