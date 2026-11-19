import { View, Text } from '@tarojs/components'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function Index() {
  return (
    <View className='page page-index'>
      <Text className='page-index__title'>BeanWater</Text>
      <Text className='page-index__slogan'>家里有这些食材，现在就能做出什么？</Text>
      <TabBar current='home' />
    </View>
  )
}
