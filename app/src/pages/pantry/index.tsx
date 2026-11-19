import { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import TabBar from '../../components/TabBar'
import IngredientChip from '../../components/IngredientChip'
import { ALL_ALLERGENS, useStore } from '../../store/useStore'
import { ingredients } from '../../data/ingredients'
import { recommend } from '../../logic/recommend'
import type { Allergen } from '../../types'
import './index.scss'

type MarkMode = 'pantry' | 'disliked' | 'allergen'

const MODES: Array<{ key: MarkMode; label: string; hint: string }> = [
  { key: 'pantry', label: '常备', hint: '点选家里常有的食材，勾选一次长期有效' },
  { key: 'disliked', label: '不喜欢', hint: '点选不想出现在推荐里的食材' },
  { key: 'allergen', label: '过敏忌口', hint: '点选需要忌口的食材，含它的食谱不再推荐' },
]

export default function Pantry() {
  const [mode, setMode] = useState<MarkMode>('pantry')
  const [keyword, setKeyword] = useState('')
  const pantry = useStore((s) => s.pantry)
  const disliked = useStore((s) => s.disliked)
  const allergenFree = useStore((s) => s.allergenFree)
  const togglePantry = useStore((s) => s.togglePantry)
  const toggleDisliked = useStore((s) => s.toggleDisliked)
  const toggleAllergen = useStore((s) => s.toggleAllergen)

  const canMakeCount = useMemo(
    () => recommend({ pantry: new Set(pantry), allergenFree: new Set(allergenFree) }).canMake.length,
    [pantry, allergenFree],
  )

  const grouped = useMemo(() => {
    const kw = keyword.trim()
    const filtered = kw
      ? ingredients.filter(
          (i) => i.name.includes(kw) || i.aliases.some((a) => a.includes(kw)),
        )
      : ingredients
    const map = new Map<string, typeof ingredients>()
    for (const i of filtered) {
      const list = map.get(i.category) ?? []
      list.push(i)
      map.set(i.category, list)
    }
    return [...map.entries()]
  }, [keyword])

  const selectedSet = mode === 'pantry' ? pantry : mode === 'disliked' ? disliked : []
  const isMarked = (id: string) => selectedSet.includes(id)
  const otherBadges = (id: string): string[] => {
    const badges: string[] = []
    if (mode !== 'pantry' && pantry.includes(id)) badges.push('常备')
    if (mode !== 'disliked' && disliked.includes(id)) badges.push('不喜欢')
    const ing = ingredients.find((x) => x.id === id)
    if (ing?.allergens.some((a) => allergenFree.includes(a))) badges.push('过敏')
    return badges
  }

  const activeMode = MODES.find((m) => m.key === mode)!

  return (
    <View className='page pantry'>
      <Text className='section-title'>我的常备食材</Text>
      <Text className='pantry__summary'>
        常备 {pantry.length} 样 · 现在能做 {canMakeCount} 款饮品
      </Text>

      <View className='pantry__modes'>
        {MODES.map((m) => (
          <View
            key={m.key}
            className={`pantry__mode ${mode === m.key ? 'pantry__mode--active' : ''}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </View>
        ))}
      </View>
      <Text className='pantry__hint'>{activeMode.hint}</Text>

      <Input
        className='pantry__search'
        placeholder='搜索食材（支持别名，如“大豆”）'
        value={keyword}
        onInput={(e) => setKeyword(e.detail.value)}
      />

      {grouped.map(([category, list]) => (
        <View key={category} className='pantry__group'>
          <Text className='pantry__group-title'>{category}</Text>
          <View>
            {list.map((i) => (
              <IngredientChip
                key={i.id}
                ingredient={i}
                selected={isMarked(i.id)}
                badge={otherBadges(i.id).join('·')}
                onTap={() => {
                  if (mode === 'pantry') togglePantry(i.id)
                  else if (mode === 'disliked') toggleDisliked(i.id)
                  else i.allergens.forEach((a) => toggleAllergen(a as Allergen))
                }}
              />
            ))}
          </View>
        </View>
      ))}

      {keyword.trim() === '' && (
        <View className='pantry__group'>
          <Text className='pantry__group-title'>过敏原（按类别一键忌口）</Text>
          <View>
            {ALL_ALLERGENS.map((a) => (
              <View
                key={a}
                className={`pantry__allergen ${allergenFree.includes(a) ? 'pantry__allergen--on' : ''}`}
                onClick={() => toggleAllergen(a)}
              >
                {a}
              </View>
            ))}
          </View>
        </View>
      )}

      <TabBar current='pantry' />
    </View>
  )
}
