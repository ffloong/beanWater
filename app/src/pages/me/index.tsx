import { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TabBar from '../../components/TabBar'
import { useStore, ALL_ALLERGENS, type Audience } from '../../store/useStore'
import { getRecipe } from '../../data/recipes'
import type { Recipe } from '../../types'
import './index.scss'

const AUDIENCES: Array<{ key: Audience; label: string }> = [
  { key: 'default', label: '通用' },
  { key: 'kids', label: '儿童' },
  { key: 'elders', label: '长辈' },
  { key: 'diet', label: '减脂' },
]

function madeTimeText(ts: number): string {
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  return `${Math.floor(days / 30)} 个月前`
}

export default function Me() {
  const favorites = useStore((s) => s.favorites)
  const allergenFree = useStore((s) => s.allergenFree)
  const toggleAllergen = useStore((s) => s.toggleAllergen)
  const sugarLight = useStore((s) => s.sugarLight)
  const setSugarLight = useStore((s) => s.setSugarLight)
  const audience = useStore((s) => s.audience)
  const setAudience = useStore((s) => s.setAudience)
  const madeLog = useStore((s) => s.madeLog)
  const resetAll = useStore((s) => s.resetAll)

  const favRecipes = useMemo(
    () => favorites.map((id) => getRecipe(id)).filter((r): r is Recipe => Boolean(r)),
    [favorites],
  )
  const madeList = useMemo(
    () =>
      Object.entries(madeLog)
        .map(([id, ts]) => ({ recipe: getRecipe(id), ts }))
        .filter((x): x is { recipe: Recipe; ts: number } => Boolean(x.recipe))
        .sort((a, b) => b.ts - a.ts),
    [madeLog],
  )

  const openRecipe = (id: string) => Taro.navigateTo({ url: `/pages/recipe/index?id=${id}` })

  const onReset = () => {
    Taro.showModal({
      title: '重置全部数据',
      content: '将清空常备食材、收藏、做过的记录和偏好设置，确定吗？',
      confirmColor: '#b4543e',
      success: (res) => {
        if (res.confirm) resetAll()
      },
    })
  }

  return (
    <View className='page me'>
      <Text className='section-title'>我的收藏（{favRecipes.length}）</Text>
      {favRecipes.length === 0 ? (
        <Text className='me__empty'>还没有收藏，逛逛「发现」挑几款吧</Text>
      ) : (
        favRecipes.map((r) => (
          <View key={r.id} className='me__fav' onClick={() => openRecipe(r.id)}>
            <Text className='me__fav-title'>{r.title}</Text>
            <Text className='me__fav-meta'>
              {r.category} · {r.timeMinutes} 分钟
            </Text>
          </View>
        ))
      )}

      <Text className='section-title'>口味档案</Text>
      <View className='me__card'>
        <Text className='me__label'>过敏忌口（安全项，含这些过敏原的食谱不再推荐）</Text>
        <View className='me__row'>
          {ALL_ALLERGENS.map((a) => (
            <View
              key={a}
              className={`me__chip ${allergenFree.includes(a) ? 'me__chip--on' : ''}`}
              onClick={() => toggleAllergen(a)}
            >
              {a}
            </View>
          ))}
        </View>
        <Text className='me__label'>口味偏好</Text>
        <View className='me__row'>
          <View
            className={`me__chip ${sugarLight ? 'me__chip--on' : ''}`}
            onClick={() => setSugarLight(!sugarLight)}
          >
            减糖
          </View>
        </View>
        <Text className='me__label'>适合人群</Text>
        <View className='me__row'>
          {AUDIENCES.map((a) => (
            <View
              key={a.key}
              className={`me__chip ${audience === a.key ? 'me__chip--on' : ''}`}
              onClick={() => setAudience(a.key)}
            >
              {a.label}
            </View>
          ))}
        </View>
      </View>

      <Text className='section-title'>做过记录（{madeList.length}）</Text>
      {madeList.length === 0 ? (
        <Text className='me__empty'>还没做过食谱；在详情页点「做过了」就会记录，近 7 天不再优先推荐</Text>
      ) : (
        madeList.map(({ recipe, ts }) => (
          <View key={recipe.id} className='me__made' onClick={() => openRecipe(recipe.id)}>
            <Text className='me__made-title'>{recipe.title}</Text>
            <Text className='me__made-time'>{madeTimeText(ts)}</Text>
          </View>
        ))
      )}

      <Text className='section-title'>关于</Text>
      <View className='me__card'>
        <Text className='me__about'>
          BeanWater · 破壁机食谱助手。内容为传统食养参考，不构成医疗建议；孕妇、婴幼儿、糖尿病、肾病、肠胃敏感等特殊人群请遵医嘱；豆类必须充分煮熟。
        </Text>
        <View className='me__reset' onClick={onReset}>
          重置全部数据
        </View>
      </View>

      <TabBar current='me' />
    </View>
  )
}
