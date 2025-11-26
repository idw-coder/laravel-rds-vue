<template>
    <div>
      <div class="header">
        <h2>技術書レビュー</h2>
      </div>
  
      <ul v-if="books.length">
        <li v-for="book in books" :key="book.id" class="book-item">
          <div class="book-content">
            <div class="book-cover">
              <img 
                v-if="book.cover_url" 
                :src="book.cover_url" 
                :alt="book.title"
              />
              <div v-else class="no-cover">
                <i class="fas fa-book"></i>
              </div>
            </div>
            <div class="book-info">
              <h3>{{ book.title }}</h3>
              <p class="author">{{ book.author }}</p>
              <div class="rating">
                <span v-for="n in 5" :key="n" class="star">
                  <i :class="n <= book.rating ? 'fas fa-star' : 'far fa-star'"></i>
                </span>
              </div>
              <p class="review">{{ book.review }}</p>
            </div>
          </div>
  
          <div class="book-meta">
            <div class="book-meta-left">
              <span class="user-info">
                <i class="fas fa-user"></i>
                {{ book.user?.name || '不明' }}
              </span>
              <span class="status-label">{{ book.status }}</span>
            </div>
            <div class="book-meta-right">
              <span><i class="fas fa-edit"></i> {{ formatDate(book.created_at) }}</span>
            </div>
          </div>
        </li>
      </ul>
      <p v-else>レビューがありません</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  
  interface BookReview {
    id: number
    isbn: string
    title: string
    author: string
    cover_url: string
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
  
  const books = ref<BookReview[]>([
    {
      id: 1,
      isbn: "9784802615112",
      title: "Laravelの教科書 バージョン12対応",
      author: "加藤じゅんこ",
      cover_url: "",
      rating: 4,
      review: "Laravel12の基礎から実践まで学べる良書。初心者にもおすすめ。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-15",
      updated_at: "2025-01-15"
    },
    {
      id: 2,
      isbn: "9784873116860",
      title: "Web API: The Good Parts",
      author: "水野貴明",
      cover_url: "",
      rating: 5,
      review: "API設計の基本が学べる。実務で役立つ知識が詰まっている。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-10",
      updated_at: "2025-01-10"
    },
    {
      id: 3,
      isbn: "9784774142043",
      title: "Webを支える技術 -HTTP、URI、HTML、そしてREST",
      author: "山本陽平",
      cover_url: "",
      rating: 5,
      review: "Web技術の根本を理解できる名著。エンジニア必読。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-05",
      updated_at: "2025-01-05"
    },
    {
      id: 4,
      isbn: "9784798168494",
      title: "独習PHP 第4版",
      author: "山田祥寛",
      cover_url: "",
      rating: 4,
      review: "PHPの基礎を体系的に学べる。リファレンスとしても使える。",
      status: "published",
      user: { id: 1, name: "テストユーザー" },
      created_at: "2025-01-01",
      updated_at: "2025-01-01"
    }
  ])
  
  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ja-JP')
  }

  const fetchBookCovers = async () => {
    for (const book of books.value) {
      try {
        // 1. まずGoogle Books APIで検索
        const googleResponse = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`
        )
        const googleData = await googleResponse.json()
        
        if (googleData.items && googleData.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
          book.cover_url = googleData.items[0].volumeInfo.imageLinks.thumbnail
          continue
        }

        // 2. Google Booksで見つからない場合、楽天ブックスAPIで検索
        const RAKUTEN_APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID
        const rakutenResponse = await fetch(
          `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?applicationId=${RAKUTEN_APP_ID}&isbn=${book.isbn}`
        )
        const rakutenData = await rakutenResponse.json()

        if (rakutenData.Items && rakutenData.Items[0]?.Item?.largeImageUrl) {
          book.cover_url = rakutenData.Items[0].Item.largeImageUrl
        }
      } catch (error) {
        console.error(`Failed to fetch cover for ${book.title}:`, error)
      }
    }
  }

  onMounted(() => {
    fetchBookCovers()
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
  
  .book-item {
    transition: opacity 0.3s;
  }
  
  .book-item:hover {
    opacity: 0.7;
  }
  
  .book-content {
    display: flex;
    gap: 1rem;
  }
  
  .book-cover {
    flex-shrink: 0;
    width: 80px;
    height: 110px;
  }
  
  .book-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid #ddd;
  }
  
  .no-cover {
    width: 100%;
    height: 100%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
  }
  
  .no-cover i {
    font-size: 2rem;
    color: #999;
  }
  
  .book-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .book-info h3 {
    margin: 0;
    font-size: 1rem;
  }
  
  .author {
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
  
  .book-meta {
    font-size: 0.75rem;
    color: #666;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .book-meta-left,
  .book-meta-right {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .book-meta span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .book-meta i {
    color: #999;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
.status-label {
  background-color: #e8f5ef;
  color: #42b983;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}
  
  @media (max-width: 768px) {
    .book-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  
    .book-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
  </style>