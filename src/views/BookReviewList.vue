<template>
  <div>
    <div class="header">
      <h2>技術書レビュー</h2>
    </div>

    <div v-if="loading" class="loading">読み込み中...</div>

    <ul v-else-if="reviews.length">
      <li v-for="review in reviews" :key="review.id" class="book-item">
        <div class="book-content">
          <div class="book-cover">
            <img 
              v-if="review.book?.cover_url" 
              :src="review.book.cover_url" 
              :alt="review.book.title"
            />
            <div v-else class="no-cover">
              <i class="fas fa-book"></i>
            </div>
          </div>
          <div class="book-info">
            <h3>{{ review.book?.title }}</h3>
            <p class="author">{{ review.book?.author }}</p>
            <div class="rating">
              <span v-for="n in 5" :key="n" class="star">
                <i :class="n <= review.rating ? 'fas fa-star' : 'far fa-star'"></i>
              </span>
            </div>
            <p class="review">{{ review.review }}</p>
          </div>
        </div>

        <div class="book-meta">
          <div class="book-meta-left">
            <span class="user-info">
              <i class="fas fa-user"></i>
              {{ review.user?.name || '不明' }}
            </span>
            <span class="status-label">{{ review.status }}</span>
          </div>
          <div class="book-meta-right">
            <span><i class="fas fa-edit"></i> {{ formatDate(review.created_at) }}</span>
          </div>
        </div>
      </li>
    </ul>
    <p v-else>レビューがありません</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Book {
  id: number
  isbn: string
  title: string
  author: string
  publisher: string | null
  price: number | null
  published_date: string | null
  cover_url: string | null
  description: string | null
}

interface User {
  id: number
  name: string
}

interface BookReview {
  id: number
  user_id: number
  book_id: number
  rating: number
  review: string
  status: string
  created_at: string
  updated_at: string
  book?: Book
  user?: User
}

interface PaginatedResponse {
  data: BookReview[]
  current_page: number
  last_page: number
  total: number
}

const reviews = ref<BookReview[]>([])
const loading = ref(true)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost'

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ja-JP')
}

const fetchReviews = async () => {
  try {
    loading.value = true
    const response = await fetch(`${API_BASE_URL}/book-reviews`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch reviews')
    }
    
    const data: PaginatedResponse = await response.json()
    reviews.value = data.data
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchReviews()
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

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
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