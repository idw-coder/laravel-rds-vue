<template>
  <div ref="containerRef" class="adsense-container">
    <ins
      ref="insRef"
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
const insRef = ref<HTMLElement | null>(null)

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
  const waitForElementSize = () => {
    return new Promise<void>((resolve) => {
      let attempts = 0
      const checkSize = () => {
        attempts++
        
        // ins要素とコンテナの両方を確認
        const insElement = insRef.value
        const containerElement = containerRef.value
        
        if (insElement && containerElement) {
          // getBoundingClientRect で実際のサイズを確認
          const containerRect = containerElement.getBoundingClientRect()
          const insRect = insElement.getBoundingClientRect()
          
          // コンテナの幅が300px以上あることを確認（広告の最小幅）
          if (containerRect.width >= 300 || containerElement.offsetWidth >= 300) {
            console.log('AdSense element size confirmed:', {
              containerWidth: containerRect.width,
              containerOffsetWidth: containerElement.offsetWidth,
              insWidth: insRect.width
            })
            resolve()
            return
          }
        }
        
        // 最大10秒待機（100回 × 100ms）
        if (attempts < 100) {
          requestAnimationFrame(checkSize)
        } else {
          console.warn('AdSense size check timeout, attempting initialization anyway')
          resolve() // タイムアウトしても初期化を試みる
        }
      }
      requestAnimationFrame(checkSize)
    })
  }
  
  await waitForElementSize()
  
  // さらに少し待機してから初期化（レイアウトが完全に確定するまで）
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 再度サイズを確認
  if (containerRef.value) {
    const finalWidth = containerRef.value.getBoundingClientRect().width
    console.log('Final container width before init:', finalWidth)
    
    if (finalWidth === 0) {
      console.error('Container width is still 0, cannot initialize AdSense')
      return
    }
  }
  
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
  width: 100%;
  min-width: 300px;
  min-height: 100px;
  display: block;
}
</style>

