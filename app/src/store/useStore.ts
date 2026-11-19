import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Allergen } from '../types'
import { taroStorage } from './storage'

export type Audience = 'default' | 'kids' | 'elders' | 'diet'

export const ALL_ALLERGENS: Allergen[] = ['大豆', '坚果', '乳制品', '麸质']

interface AppState {
  /** 首次引导（勾选常备食材）是否已完成，§4.6 */
  onboarded: boolean
  /** 常备清单：勾选一次长期有效（§4.3，非库存管理） */
  pantry: string[]
  /** 不喜欢的食材：推荐降权 */
  disliked: string[]
  /** 过敏忌口：安全过滤，直接从推荐剔除（§12） */
  allergenFree: Allergen[]
  /** 收藏的食谱 id */
  favorites: string[]
  /** 做过的记录：recipeId -> 最近一次毫秒时间戳（推荐去重，§6） */
  madeLog: Record<string, number>
  /** 减糖偏好 */
  sugarLight: boolean
  /** 人群偏好 */
  audience: Audience

  setOnboarded: () => void
  togglePantry: (id: string) => void
  toggleDisliked: (id: string) => void
  toggleAllergen: (a: Allergen) => void
  toggleFavorite: (recipeId: string) => void
  markMade: (recipeId: string) => void
  setSugarLight: (v: boolean) => void
  setAudience: (a: Audience) => void
  resetAll: () => void
}

export const STORAGE_KEY = 'beanwater-store'

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      pantry: [],
      disliked: [],
      allergenFree: [],
      favorites: [],
      madeLog: {},
      sugarLight: false,
      audience: 'default',

      setOnboarded: () => set({ onboarded: true }),
      togglePantry: (id) =>
        set((s) => ({
          pantry: s.pantry.includes(id) ? s.pantry.filter((x) => x !== id) : [...s.pantry, id],
        })),
      toggleDisliked: (id) =>
        set((s) => ({
          disliked: s.disliked.includes(id)
            ? s.disliked.filter((x) => x !== id)
            : [...s.disliked, id],
        })),
      toggleAllergen: (a) =>
        set((s) => ({
          allergenFree: s.allergenFree.includes(a)
            ? s.allergenFree.filter((x) => x !== a)
            : [...s.allergenFree, a],
        })),
      toggleFavorite: (recipeId) =>
        set((s) => ({
          favorites: s.favorites.includes(recipeId)
            ? s.favorites.filter((x) => x !== recipeId)
            : [...s.favorites, recipeId],
        })),
      markMade: (recipeId) =>
        set((s) => ({ madeLog: { ...s.madeLog, [recipeId]: Date.now() } })),
      setSugarLight: (v) => set({ sugarLight: v }),
      setAudience: (a) => set({ audience: a }),
      resetAll: () =>
        set({
          onboarded: false,
          pantry: [],
          disliked: [],
          allergenFree: [],
          favorites: [],
          madeLog: {},
          sugarLight: false,
          audience: 'default',
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => taroStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        pantry: s.pantry,
        disliked: s.disliked,
        allergenFree: s.allergenFree,
        favorites: s.favorites,
        madeLog: s.madeLog,
        sugarLight: s.sugarLight,
        audience: s.audience,
      }),
    },
  ),
)
