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

// 初期化済みのスロットを追跡（グローバル）
const initializedSlots = new Set<string>()

onMounted(async () => {
  await nextTick()
  
  // すでに初期化済みの場合はスキップ
  const slotKey = `${props.adClient}-${props.adSlot}`
  if (initializedSlots.has(slotKey)) {
    console.log('AdSense already initialized for slot:', props.adSlot)
    return
  }
  
  // ins要素がすでに初期化済みかチェック（data-ad-status属性）
  if (insRef.value?.getAttribute('data-ad-status')) {
    console.log('AdSense ins element already has status:', insRef.value.getAttribute('data-ad-status'))
    return
  }
  
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
          
          // コンテナの幅が300px以上あることを確認（広告の最小幅）
          if (containerRect.width >= 300 || containerElement.offsetWidth >= 300) {
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
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 再度サイズを確認
  if (containerRef.value) {
    const finalWidth = containerRef.value.getBoundingClientRect().width
    
    if (finalWidth === 0) {
      console.error('Container width is still 0, cannot initialize AdSense')
      return
    }
  }
  
  // 初期化前に再度チェック（非同期処理中に他で初期化された可能性）
  if (insRef.value?.getAttribute('data-ad-status')) {
    console.log('AdSense was initialized during wait')
    return
  }
  
  try {
    // Google AdSense の標準的な初期化方法
    // adsbygoogle が存在しない場合は配列として初期化
    if (!(window as any).adsbygoogle) {
      ;(window as any).adsbygoogle = []
    }
    
    // 広告を初期化
    ;(window as any).adsbygoogle.push({})
    
    // 初期化済みとしてマーク
    initializedSlots.add(slotKey)
    
    console.log('AdSense initialized successfully for slot:', props.adSlot)
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

