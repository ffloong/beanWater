import { View, Text } from '@tarojs/components'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function Pantry() {
  return (
    <View className='page'>
      <Text className='section-title'>我的常备食材</Text>
      <Text>建设中（Step 6 实现）</Text>
      <TabBar current='pantry' />
    </View>
  )
}
