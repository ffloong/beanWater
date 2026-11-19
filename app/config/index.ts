import { defineConfig, type UserConfigExport } from '@tarojs/cli'

export default defineConfig<'webpack5'>(async () => {
  // The following user-defined configuration only covers the common scenarios.
  // For full customization, refer to https://taro-docs.jd.com/docs/compiling-config
  return {
    projectName: 'beanwater-app',
    date: '2026-11-19',
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: { enable: false },
    },
    mini: {},
    h5: {},
  } satisfies UserConfigExport<'webpack5'>
})
