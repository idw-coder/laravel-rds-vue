<template>
  <div class="adsense-container">
    <ins
      class="adsbygoogle"
      style="display:block"
      :data-ad-client="adClient"
      :data-ad-slot="adSlot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="fullWidthResponsive"
    ></ins>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'

interface Props {
  adClient?: string
  adSlot?: string
  adFormat?: string
  fullWidthResponsive?: boolean
}

withDefaults(defineProps<Props>(), {
  adClient: 'ca-pub-9549397935875160',
  adSlot: '',
  adFormat: 'auto',
  fullWidthResponsive: true
})

onMounted(async () => {
  await nextTick()
  
  // Google AdSense スクリプトの読み込みを待つ
  const waitForAdSense = () => {
    return new Promise<void>((resolve) => {
      if ((window as any).adsbygoogle) {
        resolve()
        return
      }
      
      // スクリプトが読み込まれるまで待機（最大5秒）
      let attempts = 0
      const checkInterval = setInterval(() => {
        attempts++
        if ((window as any).adsbygoogle || attempts > 50) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }
  
  await waitForAdSense()
  
  try {
    // Google AdSense の標準的な初期化方法
    // adsbygoogle が存在しない場合は配列として初期化
    if (!(window as any).adsbygoogle) {
      ;(window as any).adsbygoogle = []
    }
    // 広告を初期化
    ;(window as any).adsbygoogle.push({})
  } catch (e) {
    // 開発環境でのエラーは無視
    console.error('AdSense error:', e)
  }
})
</script>

<style scoped>
.adsense-container {
  margin: 1rem 0;
}
</style>

