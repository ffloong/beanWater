import { beforeEach, describe, expect, it, vi } from 'vitest'

// 用内存 Map 模拟 Taro Storage，验证持久化读写
const mem = new Map<string, string>()
vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: (k: string) => mem.get(k) ?? '',
    setStorageSync: (k: string, v: unknown) => {
      mem.set(k, String(v))
    },
    removeStorageSync: (k: string) => {
      mem.delete(k)
    },
  },
}))

async function freshStore() {
  vi.resetModules()
  const mod = await import('./useStore')
  return mod.useStore
}

beforeEach(() => mem.clear())

describe('useStore actions', () => {
  it('togglePantry 勾选/取消', async () => {
    const useStore = await freshStore()
    useStore.getState().togglePantry('soybean')
    expect(useStore.getState().pantry).toEqual(['soybean'])
    useStore.getState().togglePantry('soybean')
    expect(useStore.getState().pantry).toEqual([])
  })

  it('toggleAllergen / toggleFavorite / markMade', async () => {
    const useStore = await freshStore()
    useStore.getState().toggleAllergen('坚果')
    expect(useStore.getState().allergenFree).toEqual(['坚果'])
    useStore.getState().toggleFavorite('classic_soybean_milk')
    expect(useStore.getState().favorites).toContain('classic_soybean_milk')
    useStore.getState().markMade('classic_soybean_milk')
    expect(useStore.getState().madeLog['classic_soybean_milk']).toBeGreaterThan(0)
  })

  it('setOnboarded 标记引导完成', async () => {
    const useStore = await freshStore()
    expect(useStore.getState().onboarded).toBe(false)
    useStore.getState().setOnboarded()
    expect(useStore.getState().onboarded).toBe(true)
  })
})

describe('useStore persistence', () => {
  it('变更后写入 Taro Storage', async () => {
    const useStore = await freshStore()
    useStore.getState().togglePantry('oat')
    const raw = mem.get('beanwater-store')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.pantry).toContain('oat')
  })

  it('重新加载时从 Storage 恢复（模拟重启 App）', async () => {
    const first = await freshStore()
    first.getState().togglePantry('soybean')
    first.getState().setOnboarded()

    const second = await freshStore()
    expect(second.getState().onboarded).toBe(true)
    expect(second.getState().pantry).toContain('soybean')
  })
})
