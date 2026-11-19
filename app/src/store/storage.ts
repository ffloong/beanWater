import Taro from '@tarojs/taro'

/**
 * zustand persist 所需的同步 Storage 适配。
 * Taro Storage 在 H5 映射 localStorage、小程序映射本地存储，字符串进出两端一致。
 */
export const taroStorage = {
  getItem: (name: string): string | null => {
    try {
      const v = Taro.getStorageSync(name)
      return v ? String(v) : null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      Taro.setStorageSync(name, value)
    } catch {
      // 存储失败（如隐私模式）时静默降级为内存态
    }
  },
  removeItem: (name: string): void => {
    try {
      Taro.removeStorageSync(name)
    } catch {
      // 同上
    }
  },
}
