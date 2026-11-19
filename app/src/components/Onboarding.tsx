import { View, Text } from '@tarojs/components'
import IngredientChip from './IngredientChip'
import { COMMON_INGREDIENT_IDS, getIngredient } from '../data/ingredients'
import { useStore } from '../store/useStore'
import './Onboarding.scss'

/** 首次引导（§4.6）：60 秒勾选常备食材，完成前全屏覆盖 */
export default function Onboarding() {
  const pantry = useStore((s) => s.pantry)
  const togglePantry = useStore((s) => s.togglePantry)
  const setOnboarded = useStore((s) => s.setOnboarded)
  const items = COMMON_INGREDIENT_IDS.map(getIngredient).filter(
    (i): i is NonNullable<typeof i> => Boolean(i),
  )

  return (
    <View className='onb'>
      <View className='onb__card'>
        <Text className='onb__title'>欢迎来到 BeanWater 🫘</Text>
        <Text className='onb__sub'>勾选家里常备的食材，马上帮你找现在就能做的饮品</Text>
        <View className='onb__chips'>
          {items.map((i) => (
            <IngredientChip
              key={i.id}
              ingredient={i}
              selected={pantry.includes(i.id)}
              onTap={() => togglePantry(i.id)}
            />
          ))}
        </View>
        <View className='onb__btn' onClick={setOnboarded}>
          完成，看看现在能做什么 →
        </View>
        <Text className='onb__skip' onClick={setOnboarded}>
          跳过，先随便看看
        </Text>
      </View>
    </View>
  )
}
