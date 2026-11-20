/* 小程序运行时验证：用 miniprogram-automator 驱动微信开发者工具模拟器，
 * 逐页打开并截图，抓取控制台错误。用法：node scripts/verify-weapp.mjs */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const automator = require('miniprogram-automator')

const CLI = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const PROJECT = '/Users/loong/ffProduct/beanWater/app'

async function main() {
  const mp = await automator.launch({ cliPath: CLI, projectPath: PROJECT, timeout: 120000 })
  const logs = []
  mp.on('console', (msg) => logs.push(`${msg.type}: ${(msg.args ?? []).join(' ')}`.slice(0, 200)))
  mp.on('exception', (e) => logs.push(`EXCEPTION: ${e.message}`.slice(0, 200)))

  const shots = [
    { path: '/pages/index/index', name: 'home', probe: '.page-index__title' },
    { path: '/pages/pantry/index', name: 'pantry', probe: '.pantry__summary' },
    { path: '/pages/discover/index', name: 'discover', probe: '.discover__cats' },
    { path: '/pages/me/index', name: 'me', probe: '.section-title' },
  ]

  let failed = false
  for (const s of shots) {
    const page = await mp.reLaunch(s.path)
    await page.waitFor(800)
    const el = await page.$(s.probe)
    const text = el ? await el.text() : null
    const ok = Boolean(text && text.length > 0)
    console.log(`${ok ? '✓' : '✗'} ${s.path} probe="${text ?? 'MISSING'}"`)
    if (!ok) failed = true
    await mp.screenshot({ path: `/tmp/weapp-${s.name}.png` })
  }

  const errors = logs.filter((l) => l.startsWith('EXCEPTION') || l.startsWith('error'))
  console.log('console errors:', errors.length ? errors : 'none')
  await mp.close()
  await new Promise((r) => setTimeout(r, 1000))
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('FAIL:', e.message)
  process.exit(1)
})
