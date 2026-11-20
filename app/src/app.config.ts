export default defineAppConfig({
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/discover/index',
    'pages/pantry/index',
    'pages/me/index',
    'pages/recipe/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAF8F4',
    navigationBarTitleText: 'BeanWater',
    navigationBarTextStyle: 'black',
  },
})
