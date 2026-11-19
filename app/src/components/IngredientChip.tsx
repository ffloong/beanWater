import { View, Text } from '@tarojs/components'
import type { Ingredient } from '../types'
import './IngredientChip.scss'

interface Props {
  ingredient: Ingredient
  selected?: boolean
  /** 附加标记文案，如“过敏”“不喜欢” */
  badge?: string
  onTap?: () => void
}

/** 食材 Chip：图标 + 名称 + 勾选状态（§8.2） */
export default function IngredientChip({ ingredient, selected, badge, onTap }: Props) {
  return (
    <View className={`chip ${selected ? 'chip--selected' : ''}`} onClick={onTap}>
      <Text className='chip__emoji'>{ingredient.emoji}</Text>
      <Text className='chip__name'>{ingredient.name}</Text>
      {badge ? <Text className='chip__badge'>{badge}</Text> : null}
    </View>
  )
}
