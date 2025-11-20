<template>
  <div ref="containerRef" class="adsense-container">
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
import { onMounted, nextTick, ref } from 'vue'

interface Props {
  adClient?: string
  adSlot?: string
  adFormat?: string
  fullWidthResponsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  adClient: 'ca-pub-9549397935875160',
  adSlot: '',
  adFormat: 'auto',
  fullWidthResponsive: true
})

const containerRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  
  // Google AdSense スクリプトの読み込みを待つ
  const waitForAdSenseScript = () => {
    return new Promise<void>((resolve) => {
      if ((window as any).adsbygoogle) {
        resolve()
        return
      }
      
      // スクリプトが読み込まれるまで待機（最大10秒）
      let attempts = 0
      const checkInterval = setInterval(() => {
        attempts++
        if ((window as any).adsbygoogle || attempts > 100) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }
  
  await waitForAdSenseScript()
  
  // DOMが完全にレンダリングされ、要素のサイズが確定するまで待つ
  const initAdSense = () => {
    return new Promise<void>((resolve) => {
      let attempts = 0
      const checkSize = () => {
        attempts++
        if (containerRef.value) {
          const width = containerRef.value.offsetWidth
          if (width > 0) {
            resolve()
            return
          }
        }
        // 最大5秒待機
        if (attempts < 50) {
          requestAnimationFrame(checkSize)
        } else {
          resolve() // タイムアウトしても初期化を試みる
        }
      }
      requestAnimationFrame(checkSize)
    })
  }
  
  await initAdSense()
  
  // さらに少し待機してから初期化（レイアウトが完全に確定するまで）
  await new Promise(resolve => setTimeout(resolve, 200))
  
  try {
    // Google AdSense の標準的な初期化方法
    // adsbygoogle が存在しない場合は配列として初期化
    if (!(window as any).adsbygoogle) {
      ;(window as any).adsbygoogle = []
    }
    
    // 広告を初期化
    ;(window as any).adsbygoogle.push({})
    
    console.log('AdSense initialized successfully')
  } catch (e) {
    console.error('AdSense error:', e)
  }
})
</script>

<style scoped>
.adsense-container {
  margin: 1rem 0;
}
</style>

