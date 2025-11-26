<template>
    <div>
      <div class="header">
        <h2>エンジニア系YouTuber</h2>
      </div>
  
      <ul v-if="youtubers.length">
        <li v-for="youtuber in youtubers" :key="youtuber.id" class="youtuber-item">
          <div class="youtuber-content">
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
            <div class="youtuber-info">
              <h3>{{ youtuber.channel_name }}</h3>
              <p class="category">{{ youtuber.category }}</p>
              <div class="rating">
                <span v-for="n in 5" :key="n" class="star">
                  <i :class="n <= youtuber.rating ? 'fas fa-star' : 'far fa-star'"></i>
                </span>
              </div>
              <p class="review">{{ youtuber.review }}</p>
              <a :href="youtuber.channel_url" target="_blank" rel="noopener noreferrer" class="channel-link">
                <i class="fab fa-youtube"></i> チャンネルを見る
              </a>
            </div>
          </div>
  
          <div class="youtuber-meta">
            <div class="youtuber-meta-left">
              <span class="user-info">
                <i class="fas fa-user"></i>
                {{ youtuber.user?.name || '不明' }}
              </span>
              <span class="status-label">{{ youtuber.status }}</span>
            </div>
            <div class="youtuber-meta-right">
              <span><i class="fas fa-edit"></i> {{ formatDate(youtuber.created_at) }}</span>
            </div>
          </div>
        </li>
      </ul>
      <p v-else>YouTuberが登録されていません</p>
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
    category: string
    rating: number
    review: string
    status: string
    user?: {
      id?: number
      name?: string
    }
    created_at: string
    updated_at: string
  }
  
  const youtubers = ref<YouTuberReview[]>([
    {
      id: 1,
      channel_id: "TECHWORLD111",
      channel_name: "TECH WORLD",
      channel_url: "https://www.youtube.com/@TECHWORLD111",
      thumbnail_url: "",
      category: "Web開発全般",
      rating: 5,
      review: "幅広い技術トピックをわかりやすく解説。初心者にもおすすめ。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-15",
      updated_at: "2025-01-15"
    },
    {
      id: 2,
      channel_id: "manzi_tokyo",
      channel_name: "manzi_tokyo",
      channel_url: "https://www.youtube.com/@manzi_tokyo",
      thumbnail_url: "",
      category: "プログラミング・IT",
      rating: 5,
      review: "IT業界やプログラミングについて分かりやすく解説。エンジニア転職の情報も豊富。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-14",
      updated_at: "2025-01-14"
    },
    {
      id: 3,
      channel_id: "makonari_shacho",
      channel_name: "マコなり社長",
      channel_url: "https://www.youtube.com/@makonari_shacho",
      thumbnail_url: "",
      category: "キャリア・ビジネス",
      rating: 4,
      review: "エンジニアのキャリアやビジネススキルについて学べる。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-13",
      updated_at: "2025-01-13"
    },
    {
      id: 4,
      channel_id: "moozaru",
      channel_name: "もーざる",
      channel_url: "https://www.youtube.com/@moozaru",
      thumbnail_url: "",
      category: "Web開発",
      rating: 4,
      review: "実務に近い開発手法を学べる。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-12",
      updated_at: "2025-01-12"
    },
    {
      id: 5,
      channel_id: "classmethod-yt",
      channel_name: "クラスメソッド",
      channel_url: "https://www.youtube.com/@classmethod-yt",
      thumbnail_url: "",
      category: "AWS・クラウド",
      rating: 5,
      review: "AWSを中心にクラウド技術を体系的に学べる。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-11",
      updated_at: "2025-01-11"
    }
  ])
  
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ja-JP')
}

const CACHE_KEY = 'youtuber_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間

const fetchYouTuberInfo = async () => {
  const API_KEY = 'AIzaSyDbmhip8lsfwNXRNf-E1bLa8T8p1o4Xtio'
  
  // キャッシュを取得
  const cachedData = localStorage.getItem(CACHE_KEY)
  const cache: Record<string, { channel_name: string; thumbnail_url: string; timestamp: number }> = 
    cachedData ? JSON.parse(cachedData) : {}
  
  const now = Date.now()
  
  for (const youtuber of youtubers.value) {
    // キャッシュが有効ならAPIを呼ばない
    const cachedChannel = cache[youtuber.channel_id]
    if (cachedChannel && (now - cachedChannel.timestamp) < CACHE_DURATION) {
      youtuber.channel_name = cachedChannel.channel_name
      youtuber.thumbnail_url = cachedChannel.thumbnail_url
      continue
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${youtuber.channel_id}&key=${API_KEY}`
      )
      const data = await response.json()
      
      if (data.items && data.items[0]) {
        const channel = data.items[0].snippet
        youtuber.channel_name = channel.title
        youtuber.thumbnail_url = channel.thumbnails.medium.url

        // キャッシュに保存
        cache[youtuber.channel_id] = {
          channel_name: channel.title,
          thumbnail_url: channel.thumbnails.medium.url,
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
  
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  li {
    border: 1px solid #ddd;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .youtuber-item {
    transition: background-color 0.3s;
  }
  
  .youtuber-item:hover {
    background-color: rgba(53, 73, 94, 0.1);
  }
  
  .youtuber-content {
    display: flex;
    gap: 1rem;
  }
  
  .youtuber-thumbnail {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
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
  
  .youtuber-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .youtuber-info h3 {
    margin: 0;
    font-size: 1rem;
  }
  
  .category {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }
  
  .rating {
    display: flex;
    gap: 0.25rem;
  }
  
  .star {
    color: #f5a623;
    font-size: 0.85rem;
  }
  
  .review {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
  }
  
  .channel-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: #ff0000;
    text-decoration: none;
    font-size: 0.85rem;
  }
  
  .channel-link:hover {
    text-decoration: underline;
  }
  
  .youtuber-meta {
    font-size: 0.75rem;
    color: #666;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .youtuber-meta-left,
  .youtuber-meta-right {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .youtuber-meta span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .youtuber-meta i {
    color: #999;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-label {
    background-color: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
  
  @media (max-width: 768px) {
    .youtuber-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  
    .youtuber-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
  </style>