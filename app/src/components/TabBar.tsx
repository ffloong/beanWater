import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './TabBar.scss'

export type TabKey = 'home' | 'discover' | 'pantry' | 'me'

const TABS: Array<{ key: TabKey; icon: string; label: string; url: string }> = [
  { key: 'home', icon: '🏠', label: '首页', url: '/pages/index/index' },
  { key: 'discover', icon: '🔍', label: '发现', url: '/pages/discover/index' },
  { key: 'pantry', icon: '🧺', label: '食材库', url: '/pages/pantry/index' },
  { key: 'me', icon: '👤', label: '我的', url: '/pages/me/index' },
]

/**
 * 自绘底部导航（不用原生 tabBar，省去小程序图标资源；§4 信息架构）。
 * redirectTo 平铺切换，保持页面栈深度为 1。
 */
export default function TabBar({ current }: { current: TabKey }) {
  return (
    <View className='tabbar'>
      {TABS.map((t) => (
        <View
          key={t.key}
          className={`tabbar__item ${current === t.key ? 'tabbar__item--active' : ''}`}
          onClick={() => {
            if (t.key !== current) Taro.redirectTo({ url: t.url })
          }}
        >
          <Text className='tabbar__icon'>{t.icon}</Text>
          <Text className='tabbar__label'>{t.label}</Text>
        </View>
      ))}
    </View>
  )
}
