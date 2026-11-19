import type { Allergen, RecipeId } from '../types'
import { recipes } from '../data/recipes'
import { matchRecipe, allergenConflicts, type MatchResult } from './match'

export type TimeSlot = 'morning' | 'afternoon' | 'evening'

/** 分类 → 时段（§6：早晨豆浆/米糊/五谷糊，下午果蔬汁/奶昔，晚间汤羹） */
const CATEGORY_SLOT: Record<string, TimeSlot> = {
  养生豆浆: 'morning',
  米糊: 'morning',
  五谷糊: 'morning',
  果蔬汁: 'afternoon',
  奶昔: 'afternoon',
  汤羹: 'evening',
}

export function getTimeSlot(now: Date = new Date()): TimeSlot {
  const h = now.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'afternoon'
  if (h >= 17 && h < 23) return 'evening'
  return 'morning' // 深夜按“为明早准备”处理
}

export interface RecommendInput {
  pantry: Set<string>
  /** 用户过敏忌口（安全过滤，§12） */
  allergenFree?: Set<Allergen>
  /** recipeId -> 做过的毫秒时间戳，用于轮换去重（§6） */
  madeLog?: Record<RecipeId, number>
  now?: Date
}

export interface RecommendResult {
  canMake: MatchResult[]
  missingOne: MatchResult[]
  /** 稀疏兜底（§6）：所有非过敏食谱按缺口升序取前 3 */
  nearest: MatchResult[]
  /** 晚间时段卡（§4.1）：适合明早喝且现在就能做的，需泡豆的排前 */
  tomorrowMorning: MatchResult[]
}

const MADE_RECENCY_MS = 7 * 24 * 60 * 60 * 1000

export function recommend(input: RecommendInput, now: Date = new Date()): RecommendResult {
  const { pantry } = input
  const allergenFree = input.allergenFree ?? new Set<Allergen>()
  const madeLog = input.madeLog ?? {}
  const slot = getTimeSlot(now)

  const eligible = recipes
    .filter((r) => allergenConflicts(r, allergenFree).length === 0)
    .map((r) => matchRecipe(r, pantry))

  const sortKey = (m: MatchResult): number => {
    // 覆盖率优先 → 时段契合 → 近 7 天做过的降权 → 制作时间短优先
    const madeAt = madeLog[m.recipe.id]
    const madePenalty = madeAt && now.getTime() - madeAt < MADE_RECENCY_MS ? 0.2 : 0
    const slotFit = CATEGORY_SLOT[m.recipe.category] === slot ? 0.05 : 0
    return m.coverage - madePenalty + slotFit - m.recipe.timeMinutes / 100000
  }

  const bySortKey = (a: MatchResult, b: MatchResult) => sortKey(b) - sortKey(a)
  const sorted = [...eligible].sort(bySortKey)

  const canMake = sorted.filter((m) => m.status === 'can_make')
  const missingOne = sorted.filter((m) => m.status === 'missing_one')
  const substitutable = sorted.filter((m) => m.status === 'substitutable')

  const byGap = (a: MatchResult, b: MatchResult) =>
    b.coverage - a.coverage || a.recipe.timeMinutes - b.recipe.timeMinutes
  const nearest = [...eligible].sort(byGap).slice(0, 3)

  const tomorrowMorning = canMake
    .filter((m) => CATEGORY_SLOT[m.recipe.category] === 'morning')
    .sort((a, b) => b.recipe.soakMinutes - a.recipe.soakMinutes) // 需泡豆的优先提示“今晚泡”

  return { canMake, missingOne, nearest: nearest.length > 0 ? nearest : substitutable.slice(0, 3), tomorrowMorning }
}
