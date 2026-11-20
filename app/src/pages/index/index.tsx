import { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TabBar from '../../components/TabBar'
import Onboarding from '../../components/Onboarding'
import RecipeCard from '../../components/RecipeCard'
import { useStore } from '../../store/useStore'
import { recommend, getTimeSlot } from '../../logic/recommend'
import { ingredientName } from '../../data/ingredients'
import './index.scss'

/** 快捷入口（§4.1） */
const QUICK_ENTRIES = [
  { icon: '🧺', label: '我有这些食材', url: '/pages/pantry/index' },
  { icon: '🫘', label: '养生豆浆', url: '/pages/discover/index?cat=%E5%85%BB%E7%94%9F%E8%B1%86%E6%B5%86' },
  { icon: '🥤', label: '果蔬汁', url: '/pages/discover/index?cat=%E6%9E%9C%E8%94%AC%E6%B1%81' },
  { icon: '🌾', label: '五谷糊', url: '/pages/discover/index?cat=%E4%BA%94%E8%B0%B7%E7%B3%8A' },
]

export default function Index() {
  const onboarded = useStore((s) => s.onboarded)
  const pantry = useStore((s) => s.pantry)
  const allergenFree = useStore((s) => s.allergenFree)
  const madeLog = useStore((s) => s.madeLog)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)

  const rec = useMemo(
    () => recommend({ pantry: new Set(pantry), allergenFree: new Set(allergenFree), madeLog }),
    [pantry, allergenFree, madeLog],
  )
  const slot = useMemo(() => getTimeSlot(), [])

  // 今日推荐：能做 > 加一样 > 稀疏兜底“最接近”（§6）
  const main = rec.canMake[0] ?? rec.missingOne[0] ?? rec.nearest[0]
  const pooled = [...rec.canMake.slice(1), ...rec.missingOne, ...rec.nearest]
  const simple = pooled.filter((m) => m.recipe.id !== main?.recipe.id).slice(0, 3)

  const pantrySummary = pantry.length
    ? `家里有 ${pantry.slice(0, 6).map(ingredientName).join('、')}${pantry.length > 6 ? ' 等' : ''}`
    : '还没添加常备食材，去食材库勾选几下就能开始推荐 →'

  const openRecipe = (id: string) => Taro.navigateTo({ url: `/pages/recipe/index?id=${id}` })

  const [kw, setKw] = useState('')
  const goSearch = () => {
    const q = kw.trim()
    Taro.redirectTo({
      url: q ? `/pages/discover/index?kw=${encodeURIComponent(q)}` : '/pages/discover/index',
    })
  }

  return (
    <View className='page page-index'>
      <View className='search-bar'>
        <Text className='search-bar__icon'>🔍</Text>
        <Input
          className='search-bar__input'
          placeholder='搜索食谱、食材、功效、场景'
          value={kw}
          onInput={(e) => setKw(e.detail.value)}
          onConfirm={goSearch}
        />
        {kw.trim() ? (
          <Text className='search-bar__go' onClick={goSearch}>
            搜索
          </Text>
        ) : null}
      </View>

      <View className='quick'>
        {QUICK_ENTRIES.map((q) => (
          <View key={q.label} className='quick__item' onClick={() => Taro.redirectTo({ url: q.url })}>
            <Text className='quick__icon'>{q.icon}</Text>
            <Text className='quick__label'>{q.label}</Text>
          </View>
        ))}
      </View>

      <View className='summary' onClick={() => Taro.redirectTo({ url: '/pages/pantry/index' })}>
        <Text className='summary__text'>{pantrySummary}</Text>
        <Text className='summary__count'>能做 {rec.canMake.length} 款</Text>
      </View>

      <Text className='section-title'>今天喝什么</Text>
      {main ? (
        <View className='today-main'>
          <RecipeCard
            recipe={main.recipe}
            match={main}
            favorite={favorites.includes(main.recipe.id)}
            onTap={() => openRecipe(main.recipe.id)}
            onToggleFavorite={() => toggleFavorite(main.recipe.id)}
          />
          {main.status === 'missing_one' && (
            <Text className='today-main__hint'>
              补 1 样「{main.missingIds.map(ingredientName).join('、')}」就能做
            </Text>
          )}
          {main.status === 'substitutable' && (
            <Text className='today-main__hint'>
              可用「{main.substituteIds.map(ingredientName).join('、')}」替代
            </Text>
          )}
        </View>
      ) : (
        <Text className='empty'>添加几样食材，马上帮你找能做的饮品</Text>
      )}
      {simple.map((m) => (
        <RecipeCard
          key={m.recipe.id}
          recipe={m.recipe}
          match={m}
          favorite={favorites.includes(m.recipe.id)}
          onTap={() => openRecipe(m.recipe.id)}
          onToggleFavorite={() => toggleFavorite(m.recipe.id)}
        />
      ))}

      {slot === 'evening' && rec.tomorrowMorning.length > 0 && (
        <View className='tomorrow'>
          <Text className='section-title'>明早喝什么 ☀️</Text>
          {rec.tomorrowMorning.slice(0, 2).map((m) => (
            <RecipeCard
              key={m.recipe.id}
              recipe={m.recipe}
              match={m}
              favorite={favorites.includes(m.recipe.id)}
              onTap={() => openRecipe(m.recipe.id)}
              onToggleFavorite={() => toggleFavorite(m.recipe.id)}
            />
          ))}
          {rec.tomorrowMorning.some((m) => m.recipe.soakMinutes > 0) && (
            <Text className='tomorrow__soak'>
              🌙 睡前记得泡豆（约 {Math.round(rec.tomorrowMorning[0].recipe.soakMinutes / 60)} 小时），免泡豆机型可跳过
            </Text>
          )}
        </View>
      )}

      {!onboarded && <Onboarding />}
      <TabBar current='home' />
    </View>
  )
}
