import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// AI 互動功能（線上塔羅抽卡 DEC-073；共用基礎設施 DEC-079，規格 demo_docs/ai_platform_plan.md）：
// 全站維持 output: 'static'；僅 src/pages/api/<feature>/reading.ts 宣告 prerender = false，
// 由 Node standalone 服務提供（build 輸出 dist/client/ ＋ dist/server/）。
const serverSecret = { context: 'server', access: 'secret' };

// https://astro.build/config
export default defineConfig({
  site: 'https://starwoven.xyz',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  env: {
    // AI 功能伺服器變數之唯一清單（規格書第三節第 4 小節）。
    // 一律宣告為 secret：於執行期讀取、不進 bundle，改 /etc/starwoven/app.env 後重啟服務即生效。
    // 功能前綴不得使用 PUBLIC_／AI_／ASTRO_（Astro 自身使用）／NODE_。
    schema: {
      // ---- 共用：AI 供應商（唯一讀取者 src/lib/ai/server/config.ts） ----
      AI_PROVIDER: envField.enum({ ...serverSecret, values: ['openai-compatible'], default: 'openai-compatible' }),
      AI_BASE_URL: envField.string({ ...serverSecret, url: true, default: 'https://api.minimax.io/v1' }),
      AI_MODEL: envField.string({ ...serverSecret, default: 'MiniMax-M3.1-Flash' }),
      // 選填、無預設：缺少即全部 AI 功能停用（DISABLED），不讓金鑰成為全站 build 的前置條件
      AI_API_KEY: envField.string({ ...serverSecret, optional: true }),
      // none ＝ 不送出 reasoning_effort（本系統自訂哨兵值，不轉送供應商）
      AI_REASONING_EFFORT: envField.enum({
        ...serverSecret,
        values: ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
        default: 'low',
      }),
      // ---- 線上塔羅抽卡（唯一讀取者 src/lib/tarot/server-config.ts） ----
      TAROT_ENABLED: envField.boolean({ ...serverSecret, default: true }),
      TAROT_DAILY_LIMIT: envField.number({ ...serverSecret, int: true, min: 0, default: 300 }),
      TAROT_IP_DAILY_LIMIT: envField.number({ ...serverSecret, int: true, min: 0, default: 10 }),
    },
    validateSecrets: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
