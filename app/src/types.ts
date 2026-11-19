export type IngredientId = string
export type RecipeId = string

export type Allergen = '大豆' | '坚果' | '乳制品' | '麸质'

export interface Ingredient {
  id: IngredientId
  name: string
  aliases: string[]
  emoji: string
  category: string
  tags: string[]
  allergens: Allergen[]
  unit: string
  defaultAmount: number
  substitutes: IngredientId[]
  cautions: string[]
}

export interface RecipeIngredient {
  ingredientId: IngredientId
  amount: number
  required: boolean
  /**
   * “至少选一”基底组：同组食材至少具备一个才可判定“现在就能做”。
   * 组内成员 required 均为 false。
   */
  requiredAnyGroup?: string
}

export interface Nutrition {
  caloriesKcal: number
  proteinG: number
  sugarG: number
}

export interface Recipe {
  id: RecipeId
  title: string
  category: string
  servings: number
  timeMinutes: number
  difficulty: number
  ingredients: RecipeIngredient[]
  waterMl: number
  /** 单人份最低总液量（含水/牛奶/豆浆等液体），受破壁机最低水位线约束 */
  minWaterMl: number
  /** 建议提前浸泡时长（分钟），0 表示无需浸泡；免泡豆机型可跳过 */
  soakMinutes: number
  mode: string
  steps: string[]
  tags: string[]
  nutrition: Nutrition
  /** 仅存食谱特有提示；食材层面的警示由 ingredient.cautions 聚合 */
  warnings: string[]
}
