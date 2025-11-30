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
          <template v-if="gameStatus === 'playing' && combo > 1">
            <span class="combo-label">
              <i class="fas fa-fire"></i>
              Combo
            </span>
            <span class="combo-value">{{ combo }}</span>
          </template>
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
            class="input-area-wrapper"
            :class="{
              'input-area-miss': inputStatus === 'miss',
              'input-area-correct': inputStatus === 'correct'
            }"
          >
            <div
              class="input-area"
              tabindex="0"
              @keydown="handleKeyDown"
              ref="inputRef"
            >
              <span 
                v-for="(char, index) in currentCommand.split('')" 
                :key="index"
                class="char"
                :class="{
                  'char-typed': index < typed.length,
                  'char-current': index === typed.length,
                  'char-remaining': index > typed.length,
                  'char-space': char === ' '
                }"
              >{{ char === ' ' ? '\u00A0' : char }}</span>
            </div>
            
            <!-- 単語制限時間バー -->
            <div class="word-timer-bar">
              <div 
                class="word-timer-progress" 
                :style="{ transform: `scaleX(${wordTimePercent / 100})` }"
                :class="{ 'word-timer-warning': wordTimePercent < 30 }"
              ></div>
            </div>
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
            <div class="end-stat-item">
              <span class="end-stat-label">Max Combo</span>
              <span class="end-stat-value">{{ maxCombo }}</span>
            </div>
          </div>
          <button @click="() => resetGame()" class="retry-btn">
            <i class="fas fa-redo"></i>
            もう一度プレイ
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { typingGameApi, type WordEntry, type CategoryData } from '@/api/typingGame'

type GameStatus = 'ready' | 'playing' | 'end'
type InputStatus = 'normal' | 'miss' | 'correct'

const DEFAULT_GAME_TIME = 120
const WORD_TIME_LIMIT = 10

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
const timeLeft = ref(DEFAULT_GAME_TIME)
const score = ref(0)
const missCount = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const wordTimeLeft = ref(WORD_TIME_LIMIT)

const inputRef = ref<HTMLElement | null>(null)
let gameTimerInterval: number | null = null
let wordTimerInterval: number | null = null


// 現在の単語情報
const currentWord = computed(() => shuffledList.value[currentWordIndex.value])
const currentCommand = computed(() => currentWord.value?.command || '')
const currentDescription = computed(() => currentWord.value?.description || '')
const wordTimePercent = computed(() => (wordTimeLeft.value / WORD_TIME_LIMIT) * 100)

// カテゴリーの色を取得
const getCategoryColorClass = (slug: string, isSelected: boolean): string => {
  const colorMap: { [key: string]: { normal: string; selected: string } } = {
    git: { normal: 'category-git', selected: 'category-git-selected' },
    docker: { normal: 'category-docker', selected: 'category-docker-selected' },
    javascript: { normal: 'category-javascript', selected: 'category-javascript-selected' },
    laravel: { normal: 'category-laravel', selected: 'category-laravel-selected' },
    aichat: { normal: 'category-aichat', selected: 'category-aichat-selected' },
    sql: { normal: 'category-sql', selected: 'category-sql-selected' },
  }
  const colors = colorMap[slug]
  if (colors) {
    return isSelected ? colors.selected : colors.normal
  }
  return isSelected ? 'category-default-selected' : 'category-default'
}

// カテゴリーのアイコンを取得
const getCategoryIcon = (slug: string): string => {
  const iconMap: { [key: string]: string } = {
    git: 'fab fa-git-alt',
    docker: 'fab fa-docker',
    javascript: 'fab fa-js',
    laravel: 'fab fa-laravel',
    aichat: 'fas fa-robot',
    sql: 'fas fa-database',
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
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

// 単語タイマーをリセット
const resetWordTimer = () => {
  wordTimeLeft.value = WORD_TIME_LIMIT
}

// 次の単語へ
const goToNextWord = () => {
  currentWordIndex.value += 1
  typed.value = ''
  resetWordTimer()

  if (currentWordIndex.value === shuffledList.value.length) {
    const categoryData = categories.value[selectedCategory.value]
    if (categoryData) {
      shuffledList.value = [...shuffledList.value, ...shuffleArray(categoryData.data)]
    }
  }
}

// カテゴリー選択
const selectCategory = (categorySlug: string) => {
  selectedCategory.value = categorySlug
  resetGame('ready', categorySlug)
  const categoryData = categories.value[categorySlug]
  if (categorySlug !== 'none' && categoryData?.data) {
    shuffledList.value = shuffleArray(categoryData.data)
  }
}

// ゲーム開始
const startGame = () => {
  const categoryData = categories.value[selectedCategory.value]
  if (selectedCategory.value === 'none' || !categoryData?.data.length) {
    return
  }
  if (shuffledList.value.length === 0) {
    shuffledList.value = shuffleArray(categoryData.data)
  }
  gameStatus.value = 'playing'
  resetWordTimer()
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// タイマーをクリア
const clearTimers = () => {
  if (gameTimerInterval !== null) {
    clearInterval(gameTimerInterval)
    gameTimerInterval = null
  }
  if (wordTimerInterval !== null) {
    clearInterval(wordTimerInterval)
    wordTimerInterval = null
  }
}

// ゲームリセット
const resetGame = (status: GameStatus = 'ready', category: string = 'none') => {
  clearTimers()
  gameStatus.value = status
  currentWordIndex.value = 0
  typed.value = ''
  timeLeft.value = DEFAULT_GAME_TIME
  wordTimeLeft.value = WORD_TIME_LIMIT
  
  if (status === 'ready') {
    shuffledList.value = []
    score.value = 0
    missCount.value = 0
    combo.value = 0
    maxCombo.value = 0
    selectedCategory.value = category
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
    typed.value += e.key
    score.value += 1
    combo.value += 1
    maxCombo.value = Math.max(maxCombo.value, combo.value)

    if (typed.value.length === currentCommand.value.length) {
      score.value += 5 + Math.floor(combo.value / 5)
      inputStatus.value = 'correct'
      setTimeout(() => {
        inputStatus.value = 'normal'
      }, 300)
      goToNextWord()
    }
  } else {
    score.value = Math.max(score.value - 2, 0)
    missCount.value += 1
    combo.value = 0
    inputStatus.value = 'miss'
    setTimeout(() => {
      inputStatus.value = 'normal'
    }, 300)
  }
}

// ゲームタイマー
watch(gameStatus, (newStatus) => {
  clearTimers()

  if (newStatus === 'playing') {
    gameTimerInterval = window.setInterval(() => {
      timeLeft.value -= 1
      if (timeLeft.value <= 0) {
        resetGame('end')
      }
    }, 1000)

    wordTimerInterval = window.setInterval(() => {
      wordTimeLeft.value -= 0.1
      if (wordTimeLeft.value <= 0) {
        combo.value = 0
        goToNextWord()
      }
    }, 100)
  }
})

onUnmounted(() => {
  clearTimers()
})

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

.typing-game {
  min-height: 60vh;
  border: 1px solid #ddd;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 0.25rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
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

.category-git,
.category-docker,
.category-javascript,
.category-laravel,
.category-aichat,
.category-sql {
  background-color: #f0f0f0;
  color: #35495e;
  border-color: #ddd;
}

.category-git-selected,
.category-docker-selected,
.category-javascript-selected {
  background-color: rgba(53, 73, 94, 0.2);
  color: #35495e;
  border-color: #35495e;
}

.category-laravel-selected {
  background-color: rgba(255, 45, 32, 0.1);
  color: #ff2d20;
  border-color: #ff2d20;
}

.category-aichat-selected {
  background-color: rgba(16, 163, 127, 0.1);
  color: #10a37f;
  border-color: #10a37f;
}

.category-sql-selected {
  background-color: rgba(0, 117, 143, 0.1);
  color: #00758f;
  border-color: #00758f;
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

.stats-label,
.combo-label {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stats-label i,
.combo-label i {
  font-size: 0.75rem;
  color: #999;
}

.combo-label {
  color: #e67e22;
}

.combo-label i {
  color: #e67e22;
}

.stats-value,
.combo-value {
  font-weight: bold;
  font-size: 1rem;
}

.combo-value {
  color: #e67e22;
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

.ready-screen,
.end-screen {
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

.start-btn,
.retry-btn {
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

.start-btn i,
.retry-btn i {
  font-size: 0.75rem;
}

.start-btn:hover:not(.start-btn-disabled),
.retry-btn:hover {
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

.input-area-wrapper {
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  overflow: hidden;
  transition: border-color 0.2s;
}

.input-area-wrapper:focus-within {
  border-color: #35495e;
}

.input-area-wrapper.input-area-miss {
  border-color: #e74c3c;
}

.input-area-wrapper.input-area-correct {
  border-color: #27ae60;
}

.input-area {
  font-family: monospace;
  font-size: 1rem;
  padding: 1rem;
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  background-color: white;
  outline: none;
  box-sizing: border-box;
}

.word-timer-bar {
  height: 4px;
  background-color: #f0f0f0;
}

.word-timer-progress {
  height: 100%;
  width: 100%;
  background-color: #35495e;
  transform-origin: right center;
  transition: transform 0.1s linear;
}

.word-timer-progress.word-timer-warning {
  background-color: #e74c3c;
}

.char {
  display: inline-block;
}

.char-space {
  width: 0.5em;
}

.char-typed {
  color: #27ae60;
}

.char-typed.char-space {
  background-color: rgba(39, 174, 96, 0.2);
  border-radius: 2px;
}

.char-current {
  color: #35495e;
  border-bottom: 2px solid #35495e;
}

.char-remaining {
  color: #999;
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

@media (max-width: 768px) {
  .game-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  }

  .input-area {
    font-size: 0.9rem;
  }
}

</style>