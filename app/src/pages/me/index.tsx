import { View, Text } from '@tarojs/components'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function Me() {
  return (
    <View className='page'>
      <Text className='section-title'>我的</Text>
      <Text>建设中（Step 10 实现）</Text>
      <TabBar current='me' />
    </View>
  )
}
