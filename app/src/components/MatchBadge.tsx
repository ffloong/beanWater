import { Text } from '@tarojs/components'
import type { MatchStatus } from '../logic/match'
import './MatchBadge.scss'

const LABEL: Record<MatchStatus, string> = {
  can_make: '可做',
  missing_one: '缺 1 样',
  substitutable: '可替代',
  missing_more: '缺多样',
}

/** 匹配状态徽标（§8.2：可做绿色 / 缺 1 样黄色 / 可替代豆黄） */
export default function MatchBadge({ status }: { status: MatchStatus }) {
  return <Text className={`match-badge match-badge--${status}`}>{LABEL[status]}</Text>
}
