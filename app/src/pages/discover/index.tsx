import { View, Text } from '@tarojs/components'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function Discover() {
  return (
    <View className='page'>
      <Text className='section-title'>发现</Text>
      <Text>分类浏览建设中（Step 8 实现）</Text>
      <TabBar current='discover' />
    </View>
  )
}
