import { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getRecipe, CATEGORY_EMOJI } from '../../data/recipes'
import { getIngredient, ingredientName } from '../../data/ingredients'
import { matchRecipe, aggregatedWarnings } from '../../logic/match'
import { calcWater, type Thickness } from '../../logic/water'
import { renderStep } from '../../logic/stepText'
import { useStore } from '../../store/useStore'
import MatchBadge from '../../components/MatchBadge'
import './index.scss'

const THICKNESS_LABEL: Record<Thickness, string> = {
  thin: '偏稀',
  standard: '标准',
  thick: '浓稠',
}

export default function RecipeDetail() {
  const router = useRouter()
  const recipe = getRecipe(router.params.id ?? '')

  const pantry = useStore((s) => s.pantry)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const markMade = useStore((s) => s.markMade)

  const [servings, setServings] = useState(recipe?.servings ?? 2)
  const [thickness, setThickness] = useState<Thickness>('standard')

  const pantrySet = useMemo(() => new Set(pantry), [pantry])

  if (!recipe) {
    return (
      <View className='page'>
        <Text className='rdetail__empty'>食谱不存在</Text>
      </View>
    )
  }

  const match = matchRecipe(recipe, pantrySet)
  const plan = calcWater(recipe, servings, thickness)
  const warnings = aggregatedWarnings(recipe)
  const favorite = favorites.includes(recipe.id)

  // “至少选一”组渲染：组内成员归到同一行组标题下
  const groups = new Map<string, typeof recipe.ingredients>()
  const singles: typeof recipe.ingredients = []
  for (const i of recipe.ingredients) {
    if (i.requiredAnyGroup) {
      const list = groups.get(i.requiredAnyGroup) ?? []
      list.push(i)
      groups.set(i.requiredAnyGroup, list)
    } else singles.push(i)
  }

  const ingredientRow = (item: (typeof recipe.ingredients)[number], groupLabel?: string) => {
    const ing = getIngredient(item.ingredientId)
    if (!ing) return null
    const owned = pantrySet.has(item.ingredientId)
    const subId = owned ? undefined : (ing.substitutes ?? []).find((s) => pantrySet.has(s))
    const amount = plan.ingredients.find((x) => x.ingredientId === item.ingredientId)?.amount ?? item.amount
    return (
      <View key={item.ingredientId} className='rdetail__ing'>
        <Text className='rdetail__ing-emoji'>{ing.emoji}</Text>
        <Text className={`rdetail__ing-name ${owned ? 'rdetail__ing-name--owned' : ''}`}>
          {ing.name}
        </Text>
        <Text className='rdetail__ing-amount'>
          {amount} {ing.unit}
        </Text>
        {groupLabel ? <Text className='rdetail__ing-badge rdetail__ing-badge--group'>{groupLabel}</Text> : null}
        <Text className={`rdetail__ing-badge ${item.required ? '' : 'rdetail__ing-badge--opt'}`}>
          {item.required ? '必需' : '可选'}
        </Text>
        {owned ? (
          <Text className='rdetail__ing-own'>✓ 有</Text>
        ) : subId ? (
          <Text className='rdetail__ing-sub'>可用 {ingredientName(subId)} 替代</Text>
        ) : null}
      </View>
    )
  }

  const soakHint =
    recipe.soakMinutes > 0
      ? `建议提前浸泡约 ${Math.round(recipe.soakMinutes / 60)} 小时（睡前泡、明早做）；免泡豆机型可跳过`
      : null

  const onMade = () => {
    markMade(recipe.id)
    Taro.showToast({ title: '已记录，近 7 天不再优先推荐', icon: 'none' })
  }

  const onShare = () => {
    Taro.setClipboardData({
      data: `BeanWater 食谱｜${recipe.title}：${recipe.ingredients
        .map((i) => `${ingredientName(i.ingredientId)} ${i.amount}${getIngredient(i.ingredientId)?.unit ?? ''}`)
        .join('、')}，加水至 ${recipe.waterMl}ml，${recipe.mode}模式约 ${recipe.timeMinutes} 分钟`,
    })
  }

  return (
    <View className='page rdetail'>
      <View className='rdetail__head'>
        <Text className='rdetail__emoji'>{recipe.emoji ?? CATEGORY_EMOJI[recipe.category] ?? '🥤'}</Text>
        <View className='rdetail__titles'>
          <Text className='rdetail__title'>{recipe.title}</Text>
          <Text className='rdetail__meta'>
            {recipe.category} · {recipe.mode} · {recipe.timeMinutes} 分钟 · 难度 {recipe.difficulty}/3
          </Text>
        </View>
        <MatchBadge status={match.status} />
      </View>

      <View className='rdetail__tags'>
        {recipe.tags.map((t) => (
          <Text key={t} className='rdetail__tag'>
            {t}
          </Text>
        ))}
      </View>

      {match.status !== 'can_make' && (
        <View className='rdetail__gap'>
          {match.missingIds.length > 0 && (
            <Text className='rdetail__gap-text'>还缺：{match.missingIds.map(ingredientName).join('、')}</Text>
          )}
          {match.substituteIds.length > 0 && (
            <Text className='rdetail__gap-text'>
              可替代：{match.substituteIds.map(ingredientName).join('、')}
            </Text>
          )}
        </View>
      )}

      {soakHint && (
        <View className='rdetail__soak'>
          <Text>🌙 {soakHint}</Text>
        </View>
      )}

      <Text className='section-title'>食材清单</Text>
      {singles.map((i) => ingredientRow(i))}
      {[...groups.entries()].map(([gid, members]) => (
        <View key={gid} className='rdetail__group'>
          <Text className='rdetail__group-title'>以下至少备一样</Text>
          {members.map((m) => ingredientRow(m, '二选一'))}
        </View>
      ))}

      <Text className='section-title'>水量与浓度</Text>
      <View className='rdetail__water'>
        <View className='rdetail__water-row'>
          <Text className='rdetail__water-label'>份量</Text>
          <View className='rdetail__stepper'>
            <Text className='rdetail__step-btn' onClick={() => setServings(Math.max(1, servings - 1))}>
              −
            </Text>
            <Text className='rdetail__step-num'>{servings} 人份</Text>
            <Text className='rdetail__step-btn' onClick={() => setServings(Math.min(6, servings + 1))}>
              ＋
            </Text>
          </View>
        </View>
        <View className='rdetail__water-row'>
          <Text className='rdetail__water-label'>浓度</Text>
          <View className='rdetail__thick'>
            {(['thin', 'standard', 'thick'] as Thickness[]).map((t) => (
              <Text
                key={t}
                className={`rdetail__thick-btn ${thickness === t ? 'rdetail__thick-btn--on' : ''}`}
                onClick={() => setThickness(t)}
              >
                {THICKNESS_LABEL[t]}
              </Text>
            ))}
          </View>
        </View>
        <Text className='rdetail__water-result'>
          {recipe.waterMl === 0
            ? `基底液体共 ${plan.liquidBaseMl} ml（牛奶或豆浆）`
            : `加水至 ${plan.waterMl} ml`}
          {plan.clampedToMin && ` · 已按机器最低水位线（${plan.minWaterMl} ml）调高`}
        </Text>
        {!plan.clampedToMin && servings < recipe.servings && (
          <Text className='rdetail__water-min'>单人份最低总液量 {plan.minWaterMl} ml</Text>
        )}
      </View>

      <Text className='section-title'>步骤</Text>
      <View className='rdetail__steps'>
        {recipe.steps.map((s, idx) => (
          <View key={idx} className='rdetail__step'>
            <Text className='rdetail__step-num'>{idx + 1}</Text>
            <Text className='rdetail__step-text'>{renderStep(recipe, s, plan)}</Text>
          </View>
        ))}
      </View>

      <Text className='section-title'>营养参考</Text>
      <View className='rdetail__nutrition'>
        <Text>热量约 {recipe.nutrition.caloriesKcal} kcal</Text>
        <Text>蛋白质 {recipe.nutrition.proteinG} g</Text>
        <Text>糖 {recipe.nutrition.sugarG} g</Text>
      </View>

      <Text className='section-title'>注意事项</Text>
      <View className='rdetail__warnings'>
        {warnings.map((w) => (
          <Text key={w} className='rdetail__warning'>
            ⚠️ {w}
          </Text>
        ))}
        <Text className='rdetail__disclaimer'>内容为传统食养参考，不构成医疗建议；特殊人群请遵医嘱。</Text>
      </View>

      <View className='rdetail__actions'>
        <View
          className={`rdetail__action ${favorite ? 'rdetail__action--fav' : ''}`}
          onClick={() => toggleFavorite(recipe.id)}
        >
          {favorite ? '★ 已收藏' : '☆ 收藏'}
        </View>
        <View className='rdetail__action rdetail__action--made' onClick={onMade}>
          ✓ 做过了
        </View>
        <View className='rdetail__action' onClick={onShare}>
          ↗ 分享
        </View>
      </View>
    </View>
  )
}
