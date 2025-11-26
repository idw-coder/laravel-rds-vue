<template>
    <div class="youtuber-page">
      <div class="header">
        <h2>エンジニア系YouTuber</h2>
      </div>
  
      <div v-if="youtubers.length" class="youtuber-grid">
        <article v-for="youtuber in youtubers" :key="youtuber.id" class="youtuber-card">
          <!-- ヘッダー部分：サムネイル + 基本情報 -->
          <div class="card-header">
            <div class="youtuber-thumbnail">
              <img 
                v-if="youtuber.thumbnail_url" 
                :src="youtuber.thumbnail_url" 
                :alt="youtuber.channel_name"
              />
              <div v-else class="no-thumbnail">
                <i class="fab fa-youtube"></i>
              </div>
            </div>
            <div class="header-info">
              <h3>{{ youtuber.channel_name }}</h3>
              <div class="stats">
                <span><i class="fas fa-users"></i> {{ formatCount(youtuber.subscriber_count) }}人</span>
                <span><i class="fas fa-video"></i> {{ formatCount(youtuber.video_count) }}本</span>
                <span><i class="fas fa-calendar-alt"></i> {{ formatPublishedAt(youtuber.published_at) }}開設</span>
              </div>
            </div>
          </div>

          <!-- コンテンツ部分 -->
          <div class="card-body">
            <p class="description" v-if="youtuber.description">{{ truncateText(youtuber.description, 120) }}</p>
            
            <div class="keywords" v-if="youtuber.keywords">
              <span v-for="keyword in parseKeywords(youtuber.keywords)" :key="keyword" class="keyword-tag">
                {{ keyword }}
              </span>
            </div>

            <div class="rating">
              <span v-for="n in 5" :key="n" class="star">
                <i :class="n <= youtuber.rating ? 'fas fa-star' : 'far fa-star'"></i>
              </span>
            </div>

            <a :href="youtuber.channel_url" target="_blank" rel="noopener noreferrer" class="channel-link">
              <i class="fab fa-youtube"></i> チャンネルを見る
            </a>
          </div>

          <!-- フッター部分 -->
          <div class="card-footer">
            <span class="user-info">
              <i class="fas fa-user"></i>
              {{ youtuber.user?.name || '不明' }}
            </span>
            <span class="date-info">
              <i class="fas fa-clock"></i>
              {{ formatDate(youtuber.created_at) }}
            </span>
          </div>
        </article>
      </div>
      <p v-else class="empty-message">YouTuberが登録されていません</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  
  interface YouTuberReview {
    id: number
    channel_id: string
    channel_name: string
    channel_url: string
    thumbnail_url: string
    rating: number
    status: string
    subscriber_count: string
    video_count: string
    description: string
    keywords: string
    published_at: string
    user?: {
      id?: number
      name?: string
    }
    created_at: string
    updated_at: string
  }
  
  const youtubers = ref<YouTuberReview[]>([
    {
      id: 2,
      channel_id: "manzi_tokyo",
      channel_name: "",
      channel_url: "https://www.youtube.com/@manzi_tokyo",
      thumbnail_url: "",
      rating: 5,
      status: "published",
      subscriber_count: "",
      video_count: "",
      description: "",
      keywords: "",
      published_at: "",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-14",
      updated_at: "2025-01-14"
    },
    {
      id: 3,
      channel_id: "makonari_shacho",
      channel_name: "",
      channel_url: "https://www.youtube.com/@makonari_shacho",
      thumbnail_url: "",
      rating: 4,
      status: "published",
      subscriber_count: "",
      video_count: "",
      description: "",
      keywords: "",
      published_at: "",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-13",
      updated_at: "2025-01-13"
    },
    {
      id: 4,
      channel_id: "moozaru",
      channel_name: "",
      channel_url: "https://www.youtube.com/@moozaru",
      thumbnail_url: "",
      rating: 4,
      status: "published",
      subscriber_count: "",
      video_count: "",
      description: "",
      keywords: "",
      published_at: "",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-12",
      updated_at: "2025-01-12"
    },
    {
      id: 5,
      channel_id: "classmethod-yt",
      channel_name: "",
      channel_url: "https://www.youtube.com/@classmethod-yt",
      thumbnail_url: "",
      rating: 5,
      status: "published",
      subscriber_count: "",
      video_count: "",
      description: "",
      keywords: "",
      published_at: "",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-11",
      updated_at: "2025-01-11"
    }
  ])
  
  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ja-JP')
  }
  
  const formatCount = (count: string) => {
    if (!count) return '-'
    const num = parseInt(count)
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toLocaleString()
  }
  
  const formatPublishedAt = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
  }
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }
  
  const parseKeywords = (keywords: string) => {
    if (!keywords) return []
    return keywords.split(/\s+/).slice(0, 5)
  }
  
  const CACHE_KEY = 'youtuber_cache'
  const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間
  
  const fetchYouTuberInfo = async () => {
    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
  
    // キャッシュを取得
    const cachedData = localStorage.getItem(CACHE_KEY)
    const cache: Record<string, {
      channel_name: string
      thumbnail_url: string
      subscriber_count: string
      video_count: string
      description: string
      keywords: string
      published_at: string
      timestamp: number
    }> = cachedData ? JSON.parse(cachedData) : {}
  
    const now = Date.now()
  
    for (const youtuber of youtubers.value) {
      // キャッシュが有効ならAPIを呼ばない
      const cachedChannel = cache[youtuber.channel_id]
      if (cachedChannel && (now - cachedChannel.timestamp) < CACHE_DURATION) {
        youtuber.channel_name = cachedChannel.channel_name
        youtuber.thumbnail_url = cachedChannel.thumbnail_url
        youtuber.subscriber_count = cachedChannel.subscriber_count
        youtuber.video_count = cachedChannel.video_count
        youtuber.description = cachedChannel.description
        youtuber.keywords = cachedChannel.keywords
        youtuber.published_at = cachedChannel.published_at
        continue
      }
  
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&forHandle=${youtuber.channel_id}&key=${API_KEY}`
        )
        const data = await response.json()
  
        if (data.items && data.items[0]) {
          const snippet = data.items[0].snippet
          const stats = data.items[0].statistics
          const branding = data.items[0].brandingSettings?.channel || {}
  
          youtuber.channel_name = snippet.title
          youtuber.thumbnail_url = snippet.thumbnails.medium.url
          youtuber.subscriber_count = stats.subscriberCount
          youtuber.video_count = stats.videoCount
          youtuber.description = snippet.description
          youtuber.keywords = branding.keywords || ''
          youtuber.published_at = snippet.publishedAt
  
          // キャッシュに保存
          cache[youtuber.channel_id] = {
            channel_name: snippet.title,
            thumbnail_url: snippet.thumbnails.medium.url,
            subscriber_count: stats.subscriberCount,
            video_count: stats.videoCount,
            description: snippet.description,
            keywords: branding.keywords || '',
            published_at: snippet.publishedAt,
            timestamp: now
          }
        }
      } catch (error) {
        console.error(`Failed to fetch info for ${youtuber.channel_name}:`, error)
      }
    }
  
    // キャッシュを保存
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  }
  
  onMounted(() => {
    fetchYouTuberInfo()
  })
  </script>
  
<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1rem;
  margin: 0;
}

.youtuber-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.youtuber-card {
  border: 1px solid #ddd;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: opacity 0.3s;
}

.youtuber-card:hover {
  opacity: 0.7;
}

/* ヘッダー部分 */
.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.youtuber-thumbnail {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
}

.youtuber-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.no-thumbnail {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.no-thumbnail i {
  font-size: 2rem;
  color: #ff0000;
}

.header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1rem;
}

.stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #666;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stats i {
  color: #999;
}

/* コンテンツ部分 */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.description {
  margin: 0;
  font-size: 0.85rem;
  color: #555;
  line-height: 1.4;
}

.keywords {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.keyword-tag {
  background-color: #f0f0f0;
  color: #666;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.rating {
  display: flex;
  gap: 0.25rem;
}

.star {
  color: #f5a623;
  font-size: 0.85rem;
}

.channel-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #35495e;
  text-decoration: none;
  font-size: 0.85rem;
}

.channel-link:hover {
  text-decoration: underline;
}

.channel-link i {
  color: #ff0000;
}

/* フッター部分 */
.card-footer {
  font-size: 0.75rem;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.user-info,
.date-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.card-footer i {
  color: #999;
}

.empty-message {
  color: #666;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    text-align: center;
  }

  .header-info {
    align-items: center;
  }

  .stats {
    justify-content: center;
  }

  .card-body {
    align-items: center;
    text-align: center;
  }

  .keywords {
    justify-content: center;
  }

  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>