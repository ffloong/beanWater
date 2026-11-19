import { View, Text } from '@tarojs/components'
import type { Recipe } from '../types'
import type { MatchResult } from '../logic/match'
import { ingredientName } from '../data/ingredients'
import { CATEGORY_EMOJI } from '../data/recipes'
import MatchBadge from './MatchBadge'
import './RecipeCard.scss'

interface Props {
  recipe: Recipe
  match?: MatchResult
  favorite?: boolean
  onTap?: () => void
  onToggleFavorite?: () => void
}

/** 食谱卡：图/名称/类型/时间/匹配状态/收藏（§8.2），看得到“能不能做”（§3 原则 2） */
export default function RecipeCard({ recipe, match, favorite, onTap, onToggleFavorite }: Props) {
  const missingNames = match?.missingIds.map((id) => ingredientName(id)) ?? []
  return (
    <View className='rcard' onClick={onTap}>
      <View className='rcard__head'>
        <Text className='rcard__emoji'>{CATEGORY_EMOJI[recipe.category] ?? '🥤'}</Text>
        <View className='rcard__titles'>
          <Text className='rcard__title'>{recipe.title}</Text>
          <Text className='rcard__meta'>
            {recipe.category} · {recipe.timeMinutes} 分钟 · {recipe.servings} 人份
          </Text>
        </View>
        {match ? <MatchBadge status={match.status} /> : null}
        <Text
          className={`rcard__fav ${favorite ? 'rcard__fav--on' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.()
          }}
        >
          {favorite ? '★' : '☆'}
        </Text>
      </View>
      {match && missingNames.length > 0 ? (
        <Text className='rcard__missing'>缺：{missingNames.join('、')}</Text>
      ) : null}
    </View>
  )
}
