import { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import TabBar from '../../components/TabBar'
import RecipeCard from '../../components/RecipeCard'
import { recipes, RECIPE_CATEGORIES, CATEGORY_EMOJI } from '../../data/recipes'
import { getIngredient } from '../../data/ingredients'
import { recommend } from '../../logic/recommend'
import { matchRecipe } from '../../logic/match'
import { useStore } from '../../store/useStore'
import type { Recipe } from '../../types'
import './index.scss'

type Condition = 'no_soak' | 'fast' | 'low_sugar' | 'dairy_free'
type SortKey = 'smart' | 'can_make' | 'fastest' | 'favorites'

const CONDITIONS: Array<{ key: Condition; label: string }> = [
  { key: 'no_soak', label: '免泡豆' },
  { key: 'fast', label: '15 分钟内' },
  { key: 'low_sugar', label: '低糖' },
  { key: 'dairy_free', label: '无乳制品' },
]

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'smart', label: '智能推荐' },
  { key: 'can_make', label: '我家能做' },
  { key: 'fastest', label: '最快制作' },
  { key: 'favorites', label: '我的收藏' },
]

/** 内容标签（场景/功效），由种子数据动态汇总，避免维护两份清单 */
const ALL_TAGS = [...new Set(recipes.flatMap((r) => r.tags))]

function matchConditions(r: Recipe, conds: Set<Condition>): boolean {
  if (conds.has('no_soak') && r.soakMinutes !== 0) return false
  if (conds.has('fast') && r.timeMinutes > 15) return false
  if (conds.has('low_sugar') && r.nutrition.sugarG > 10) return false
  if (
    conds.has('dairy_free') &&
    r.ingredients.some((i) => getIngredient(i.ingredientId)?.allergens.includes('乳制品'))
  ) {
    return false
  }
  return true
}

export default function Discover() {
  const router = useRouter()
  const decode = (raw?: string) => {
    if (!raw) return undefined
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  const presetCat = decode(router.params.cat)
  const presetKw = decode(router.params.kw) ?? ''

  const [cat, setCat] = useState(RECIPE_CATEGORIES.includes(presetCat as never) ? presetCat : '全部')
  const [keyword, setKeyword] = useState(presetKw)
  const [tag, setTag] = useState<string | null>(null)
  const [conds, setConds] = useState<Set<Condition>>(new Set())
  const [sort, setSort] = useState<SortKey>('smart')

  const pantry = useStore((s) => s.pantry)
  const allergenFree = useStore((s) => s.allergenFree)
  const madeLog = useStore((s) => s.madeLog)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const pantrySet = useMemo(() => new Set(pantry), [pantry])

  const smartOrder = useMemo(() => {
    const rec = recommend({ pantry: new Set(pantry), allergenFree: new Set(allergenFree), madeLog })
    const pooled = [...rec.canMake, ...rec.missingOne, ...rec.nearest]
    return new Map(pooled.map((m, idx) => [m.recipe.id, idx]))
  }, [pantry, allergenFree, madeLog])

  const list = useMemo(() => {
    const kw = keyword.trim()
    const filtered = recipes.filter((r) => {
      if (cat !== '全部' && r.category !== cat) return false
      if (tag && !r.tags.includes(tag)) return false
      if (!matchConditions(r, conds)) return false
      if (kw) {
        const hay = [r.title, r.category, ...r.tags, ...r.ingredients.map((i) => getIngredient(i.ingredientId)?.name ?? '')]
        if (!hay.some((h) => h.includes(kw))) return false
      }
      return true
    })
    const sorted = [...filtered]
    if (sort === 'fastest') sorted.sort((a, b) => a.timeMinutes - b.timeMinutes)
    else if (sort === 'can_make') {
      const rank = { can_make: 0, missing_one: 1, substitutable: 2, missing_more: 3 }
      sorted.sort(
        (a, b) =>
          rank[matchRecipe(a, pantrySet).status] - rank[matchRecipe(b, pantrySet).status] ||
          a.timeMinutes - b.timeMinutes,
      )
    } else if (sort === 'favorites') sorted.sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)))
    else sorted.sort((a, b) => (smartOrder.get(a.id) ?? 999) - (smartOrder.get(b.id) ?? 999))
    return sorted
  }, [cat, keyword, tag, conds, sort, favorites, smartOrder, pantrySet])

  const matchById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof matchRecipe>>()
    for (const r of recipes) map.set(r.id, matchRecipe(r, pantrySet))
    return map
  }, [pantrySet])

  const toggleCond = (c: Condition) =>
    setConds((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  const openRecipe = (id: string) => Taro.navigateTo({ url: `/pages/recipe/index?id=${id}` })

  return (
    <View className='page discover'>
      <Input
        className='discover__search'
        placeholder='搜索食谱 / 食材 / 标签'
        value={keyword}
        onInput={(e) => setKeyword(e.detail.value)}
      />

      <View className='discover__cats'>
        {['全部', ...RECIPE_CATEGORIES].map((c) => (
          <View
            key={c}
            className={`discover__cat ${cat === c ? 'discover__cat--active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c === '全部' ? '全部' : `${CATEGORY_EMOJI[c] ?? ''}${c}`}
          </View>
        ))}
      </View>

      <View className='discover__row'>
        {CONDITIONS.map((c) => (
          <View
            key={c.key}
            className={`discover__pill ${conds.has(c.key) ? 'discover__pill--on' : ''}`}
            onClick={() => toggleCond(c.key)}
          >
            {c.label}
          </View>
        ))}
        {ALL_TAGS.map((t) => (
          <View
            key={t}
            className={`discover__pill ${tag === t ? 'discover__pill--on' : ''}`}
            onClick={() => setTag(tag === t ? null : t)}
          >
            {t}
          </View>
        ))}
      </View>

      <View className='discover__sorts'>
        {SORTS.map((s) => (
          <View
            key={s.key}
            className={`discover__sort ${sort === s.key ? 'discover__sort--active' : ''}`}
            onClick={() => setSort(s.key)}
          >
            {s.label}
          </View>
        ))}
        <Text className='discover__count'>{list.length} 款</Text>
      </View>

      {list.length === 0 ? (
        <Text className='discover__empty'>没有符合条件的食谱，换个筛选试试</Text>
      ) : (
        list.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            match={matchById.get(r.id)}
            favorite={favorites.includes(r.id)}
            onTap={() => openRecipe(r.id)}
            onToggleFavorite={() => toggleFavorite(r.id)}
          />
        ))
      )}

      <TabBar current='discover' />
    </View>
  )
}
