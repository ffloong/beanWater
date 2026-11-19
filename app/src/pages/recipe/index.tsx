import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getRecipe } from '../../data/recipes'
import './index.scss'

export default function RecipeDetail() {
  const router = useRouter()
  const recipe = getRecipe(router.params.id ?? '')
  if (!recipe) {
    return (
      <View className='page'>
        <Text>食谱不存在</Text>
      </View>
    )
  }
  return (
    <View className='page'>
      <Text className='section-title'>{recipe.title}</Text>
      <Text>详情页建设中（Step 9 实现）</Text>
      <Text onClick={() => Taro.navigateBack()}>← 返回</Text>
    </View>
  )
}
