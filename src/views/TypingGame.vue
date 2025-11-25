<template>
  <div class="typing-game-container">
    <h2 class="game-title">
      プログラミングタイピングゲーム
    </h2>
    
    <div class="typing-game">
      <!-- カテゴリー選択 -->
      <div class="category-grid">
        <template
          v-for="[key, category] in Object.entries(categories)"
          :key="key"
        >
          <button
            v-if="key !== 'none'"
            @click="selectCategory(key)"
            :class="[
              'category-btn',
              { 'category-btn-selected': selectedCategory === key },
              getCategoryColorClass(key, selectedCategory === key)
            ]"
          >
            <i :class="getCategoryIcon(key)"></i>
            {{ category.name }}
          </button>
        </template>
      </div>

      <!-- スコアとタイマー -->
      <div class="game-stats">
        <div class="stats-left">
          <span class="stats-label">
            <i class="fas fa-star"></i>
            Score
          </span>
          <span class="stats-value">{{ score }}</span>
          <span class="stats-label">
            <i class="fas fa-times-circle"></i>
            Miss
          </span>
          <span class="stats-value">{{ missCount }}</span>
        </div>
        <div class="stats-right">
          <span class="timer-label">
            <i class="fas fa-clock"></i>
            残り時間
          </span>
          <span class="timer-value">{{ timeLeft }}</span>
        </div>
      </div>

      <!-- ゲーム画面 -->
      <div class="game-content">
        <!-- 準備画面 -->
        <div v-if="gameStatus === 'ready'" class="ready-screen">
          <p class="ready-message">
            <template v-if="selectedCategory === 'none'">
              カテゴリーを選択してください
            </template>
            <template v-else>
              <span class="category-name">{{ categories[selectedCategory]?.name }}</span>で開始します
            </template>
          </p>
          <button
            @click="startGame"
            :disabled="selectedCategory === 'none' || !categories[selectedCategory]?.data.length"
            class="start-btn"
            :class="{ 'start-btn-disabled': selectedCategory === 'none' || !categories[selectedCategory]?.data.length }"
          >
            <i class="fas fa-play"></i>
            ゲーム開始
          </button>
        </div>

        <!-- プレイ中画面 -->
        <div v-if="gameStatus === 'playing'" class="playing-screen">
          <div class="description">{{ currentDescription }}</div>
          <div
            v-if="currentWord"
            class="input-area"
            :class="{
              'input-area-miss': inputStatus === 'miss',
              'input-area-correct': inputStatus === 'correct'
            }"
            tabindex="0"
            @keydown="handleKeyDown"
            ref="inputRef"
          >
            <span class="typed-text">{{ typed }}</span>
            <span class="remaining-text">{{ currentCommand.slice(typed.length) }}</span>
          </div>
        </div>

        <!-- 終了画面 -->
        <div v-if="gameStatus === 'end'" class="end-screen">
          <div class="end-stats">
            <div class="end-stat-item">
              <span class="end-stat-label">Score</span>
              <span class="end-stat-value">{{ score }}</span>
            </div>
            <div class="end-stat-item">
              <span class="end-stat-label">Miss</span>
              <span class="end-stat-value">{{ missCount }}</span>
            </div>
          </div>
          <button @click="() => resetGame()" class="retry-btn">
            <i class="fas fa-redo"></i>
            もう一度プレイ
          </button>
        </div>
      </div>
    </div>

    <!-- Googleアドセンスをページ最下部に表示 -->
    <div v-if="!isLocalhost" class="ad-container">
      <GoogleAdsense ad-slot="7947018211" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { typingGameApi, type WordEntry, type CategoryData } from '@/api/typingGame'
import GoogleAdsense from '@/components/GoogleAdsense.vue'

type GameStatus = 'ready' | 'playing' | 'end'
type InputStatus = 'normal' | 'miss' | 'correct'

const defaultTime = 120

// 状態管理
const categories = ref<{ [key: string]: CategoryData }>({
  none: { name: 'None', data: [] }
})
const selectedCategory = ref<string>('none')
const gameStatus = ref<GameStatus>('ready')
const shuffledList = ref<WordEntry[]>([])
const currentWordIndex = ref(0)
const typed = ref('')
const inputStatus = ref<InputStatus>('normal')
const timeLeft = ref(defaultTime)
const score = ref(0)
const missCount = ref(0)
const inputRef = ref<HTMLElement | null>(null)
let timerInterval: number | null = null

const isLocalhost = computed(() => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost'
})

// 現在の単語情報
const currentWord = computed(() => shuffledList.value[currentWordIndex.value])
const currentCommand = computed(() => currentWord.value?.command || '')
const currentDescription = computed(() => currentWord.value?.description || '')

// カテゴリーの色を取得
const getCategoryColorClass = (slug: string, isSelected: boolean): string => {
  const colorMap: { [key: string]: { normal: string; selected: string } } = {
    git: { normal: 'category-git', selected: 'category-git-selected' },
    docker: { normal: 'category-docker', selected: 'category-docker-selected' },
    javascript: { normal: 'category-javascript', selected: 'category-javascript-selected' },
    laravel: { normal: 'category-laravel', selected: 'category-laravel-selected' },
  }

  if (colorMap[slug]) {
    return isSelected ? colorMap[slug].selected : colorMap[slug].normal
  }

  // デフォルトの色
  return isSelected ? 'category-default-selected' : 'category-default'
}

// カテゴリーのアイコンを取得
const getCategoryIcon = (slug: string): string => {
  const iconMap: { [key: string]: string } = {
    git: 'fab fa-git-alt',
    docker: 'fab fa-docker',
    javascript: 'fab fa-js',
    laravel: 'fab fa-laravel',
  }

  return iconMap[slug] || 'fas fa-code'
}

// カテゴリーとコマンドを読み込む
const loadCategories = async () => {
  try {
    const categoriesData = await typingGameApi.getCategories()
    const newCategories: { [key: string]: CategoryData } = {
      none: { name: 'None', data: [] }
    }

    for (const category of categoriesData) {
      try {
        const commands = await typingGameApi.getCommands(category.slug)
        newCategories[category.slug] = {
          name: category.name,
          data: commands
        }
      } catch (error) {
        console.error(`Error loading commands for ${category.slug}:`, error)
        newCategories[category.slug] = {
          name: category.name,
          data: []
        }
      }
    }

    categories.value = newCategories
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

// Fisher-Yatesアルゴリズムでシャッフル
const shuffleList = (list: WordEntry[]): WordEntry[] => {
  const array = [...list]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]!
    array[i] = array[j]!
    array[j] = temp
  }
  return array
}

// カテゴリー選択
const selectCategory = (categorySlug: string) => {
  selectedCategory.value = categorySlug
  resetGame('ready', categorySlug)
  if (categorySlug !== 'none' && categories.value[categorySlug]?.data) {
    const selectedCategoryList = categories.value[categorySlug].data
    const shuffled = shuffleList(selectedCategoryList)
    shuffledList.value = shuffled
  }
}

// ゲーム開始
const startGame = () => {
  if (selectedCategory.value === 'none' || !categories.value[selectedCategory.value]?.data.length) {
    return
  }
  if (shuffledList.value.length === 0) {
    const categoryData = categories.value[selectedCategory.value]
    if (categoryData) {
      const selectedCategoryList = categoryData.data
      const shuffled = shuffleList(selectedCategoryList)
      shuffledList.value = shuffled
    }
  }
  gameStatus.value = 'playing'
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// ゲームリセット
const resetGame = (status: GameStatus = 'ready', category: string = 'none') => {
  gameStatus.value = status
  currentWordIndex.value = 0
  if (status === 'ready') {
    shuffledList.value = []
    typed.value = ''
    timeLeft.value = defaultTime
    score.value = 0
    missCount.value = 0
    selectedCategory.value = category
  } else {
    typed.value = ''
    timeLeft.value = defaultTime
  }
}

// キー入力処理
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === ' ') {
    e.preventDefault()
  }
  if (e.key === 'Shift') {
    return
  }

  const expectedChar = currentCommand.value[typed.value.length]
  if (e.key === expectedChar) {
    const newTyped = typed.value + e.key
    typed.value = newTyped
    score.value += 1

    // 単語完成時
    if (newTyped.length === currentCommand.value.length) {
      currentWordIndex.value += 1
      typed.value = ''
      score.value += 5
      inputStatus.value = 'correct'
      setTimeout(() => {
        inputStatus.value = 'normal'
      }, 500)

      // リストが終わったら再シャッフルして追加
      if (currentWordIndex.value === shuffledList.value.length) {
        const categoryData = categories.value[selectedCategory.value]
        if (categoryData) {
          const selectedCategoryList = categoryData.data
          const newShuffledList = shuffleList(selectedCategoryList)
          shuffledList.value = [...shuffledList.value, ...newShuffledList]
        }
      }
    }
  } else {
    // ミスタイピング
    score.value = Math.max(score.value - 2, 0)
    missCount.value += 1
    inputStatus.value = 'miss'
    setTimeout(() => {
      inputStatus.value = 'normal'
    }, 500)
  }
}

// タイマー
watch(gameStatus, (newStatus) => {
  // 既存のタイマーをクリア
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (newStatus === 'playing') {
    timerInterval = window.setInterval(() => {
      timeLeft.value -= 1
      if (timeLeft.value <= 0) {
        if (timerInterval !== null) {
          clearInterval(timerInterval)
          timerInterval = null
        }
        resetGame('end')
      }
    }, 1000)
  }
})

// コンポーネントがアンマウントされる際にタイマーをクリア
onUnmounted(() => {
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})

// 初期化
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.typing-game-container {
  margin: 0;
}

.game-title {
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.game-title i {
  color: #35495e;
}

.typing-game {
  min-height: 60vh;
  border: 1px solid #ddd;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.category-btn {
  height: auto;
  padding: 0.5rem;
  font-size: 0.8rem;
  text-align: center;
  white-space: normal;
  line-height: 1.2;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border-radius: 0.25rem;
}

.category-btn i {
  font-size: 0.875rem;
}

.category-btn:hover {
  background-color: rgba(53, 73, 94, 0.1);
}

.category-git {
  background-color: #f0f0f0;
  color: #35495e;
  border-color: #ddd;
}

.category-git-selected {
  background-color: rgba(53, 73, 94, 0.2);
  color: #35495e;
  border-color: #35495e;
}

.category-docker {
  background-color: #f0f0f0;
  color: #35495e;
  border-color: #ddd;
}

.category-docker-selected {
  background-color: rgba(53, 73, 94, 0.2);
  color: #35495e;
  border-color: #35495e;
}

.category-javascript {
  background-color: #f0f0f0;
  color: #35495e;
  border-color: #ddd;
}

.category-javascript-selected {
  background-color: rgba(53, 73, 94, 0.2);
  color: #35495e;
  border-color: #35495e;
}

.category-laravel {
  background-color: #f0f0f0;
  color: #35495e;
  border-color: #ddd;
}

.category-laravel-selected {
  background-color: rgba(255, 45, 32, 0.1);
  color: #ff2d20;
  border-color: #ff2d20;
}

.category-default {
  background-color: white;
  color: #35495e;
}

.category-default-selected {
  background-color: rgba(53, 73, 94, 0.1);
  color: #35495e;
}

.game-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  min-height: 3rem;
}

.stats-left {
  min-width: 200px;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  line-height: 1;
}

.stats-label {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stats-label i {
  font-size: 0.75rem;
  color: #999;
}

.stats-value {
  font-weight: bold;
  font-size: 1rem;
}

.stats-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1;
}

.timer-label {
  font-size: 0.8rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.timer-label i {
  font-size: 0.75rem;
  color: #666;
}

.timer-value {
  font-size: 1rem;
  font-weight: bold;
}

.game-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ready-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.ready-message {
  font-size: 0.8rem;
  text-align: center;
}

.category-name {
  font-size: 1rem;
  font-weight: bold;
}

.start-btn {
  font-weight: bold;
  color: #35495e;
  background-color: white;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  border-radius: 0.25rem;
}

.start-btn i {
  font-size: 0.75rem;
}

.start-btn:hover:not(.start-btn-disabled) {
  background-color: #f0f0f0;
}

.start-btn-disabled {
  background-color: white;
  cursor: not-allowed;
  color: #999;
  opacity: 0.5;
}

.playing-screen {
  width: 100%;
  box-sizing: border-box;
}

.description {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 1rem;
  min-height: 3rem;
  display: flex;
  align-items: flex-end;
}

.input-area {
  font-family: monospace;
  font-size: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  background-color: white;
  outline: none;
  box-sizing: border-box;
  border-radius: 0.25rem;
}

.input-area:focus {
  outline: none;
  border-color: #35495e;
}

.input-area-miss {
  border-color: #e74c3c;
}

.input-area-miss:focus {
  border-color: #e74c3c;
}

.input-area-correct {
  border-color: #27ae60;
}

.input-area-correct:focus {
  border-color: #27ae60;
}

.typed-text {
  color: #27ae60;
  background-color: #f0f0f0;
  padding: 0 0.25rem;
}

.remaining-text {
  color: #666;
}

.end-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.end-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.end-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.end-stat-label {
  font-size: 0.8rem;
  color: #666;
}

.end-stat-value {
  font-size: 1rem;
  font-weight: bold;
}

.retry-btn {
  background-color: white;
  color: #35495e;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  border-radius: 0.25rem;
}

.retry-btn i {
  font-size: 0.75rem;
}

.retry-btn:hover {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .game-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  }

  .input-area {
    font-size: 0.9rem;
  }
}

.ad-container {
  margin: 2rem 0;
  width: 100%;
  min-width: 300px;
  display: block;
}
</style>

