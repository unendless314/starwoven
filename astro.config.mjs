import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// 線上塔羅抽卡（DEC-073，規格 demo_docs/tarot_plan.md）：
// 全站維持 output: 'static'；僅 src/pages/api/tarot/reading.ts 宣告 prerender = false，
// 由 Node standalone 服務提供（build 輸出 dist/client/ ＋ dist/server/）。
const tarotSecret = { context: 'server', access: 'secret' };

// https://astro.build/config
export default defineConfig({
  site: 'https://starwoven.xyz',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  env: {
    // TAROT_* 伺服器變數之唯一清單（規格書第三節第 3 小節）。
    // 一律宣告為 secret：於執行期讀取、不進 bundle，改 /etc/starwoven/app.env 後重啟服務即生效。
    schema: {
      TAROT_ENABLED: envField.boolean({ ...tarotSecret, default: true }),
      TAROT_AI_PROVIDER: envField.enum({ ...tarotSecret, values: ['openai-compatible'], default: 'openai-compatible' }),
      TAROT_AI_BASE_URL: envField.string({ ...tarotSecret, url: true, default: 'https://api.minimax.io/v1' }),
      TAROT_AI_MODEL: envField.string({ ...tarotSecret, default: 'MiniMax-M3.1-Flash' }),
      // 選填、無預設：缺少即功能停用（DISABLED），不讓金鑰成為全站 build 的前置條件
      TAROT_AI_API_KEY: envField.string({ ...tarotSecret, optional: true }),
      // none ＝ 不送出 reasoning_effort（本系統自訂哨兵值，不轉送供應商）
      TAROT_AI_REASONING_EFFORT: envField.enum({
        ...tarotSecret,
        values: ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
        default: 'low',
      }),
      TAROT_DAILY_LIMIT: envField.number({ ...tarotSecret, int: true, min: 0, default: 300 }),
      TAROT_IP_DAILY_LIMIT: envField.number({ ...tarotSecret, int: true, min: 0, default: 10 }),
    },
    validateSecrets: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
