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
  try {
    // adsbygoogle が配列の場合は push、そうでない場合は適切に初期化
    const adsbygoogle = (window as any).adsbygoogle || []
    if (Array.isArray(adsbygoogle)) {
      adsbygoogle.push({})
    } else if (!adsbygoogle.loaded) {
      adsbygoogle.loaded = true
      adsbygoogle.requestNonPersonalizedAds = 0
    }
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

