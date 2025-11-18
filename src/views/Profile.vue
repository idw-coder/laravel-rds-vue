<template>
  <div class="profile">
    <h2>プロフィール</h2>

    <div v-if="isLoading">読み込み中...</div>

    <form v-else @submit.prevent="handleSubmit" class="profile-form">
      <div class="form-group">
        <label>名前</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>メールアドレス</label>
        <input v-model="form.email" type="email" required />
      </div>

      <div class="form-group">
        <label>新しいパスワード（変更する場合のみ）</label>
        <input v-model="form.password" type="password" autocomplete="new-password" />
      </div>

      <div class="form-group">
        <label>パスワード確認</label>
        <input v-model="form.password_confirmation" type="password" autocomplete="new-password" />
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <div class="button-group">
        <button type="submit" :disabled="isSaving">
          {{ isSaving ? "保存中..." : "保存" }}
        </button>
        <button type="button" @click="goBack">キャンセル</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, type UpdateProfileData } from '@/api/user'

const router = useRouter()
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive<UpdateProfileData>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

onMounted(async () => {
  try {
    const user = await userApi.getProfile()
    form.name = user.name
    form.email = user.email
  } catch (error) {
    errorMessage.value = 'プロフィールの取得に失敗しました'
  } finally {
    isLoading.value = false
  }
})

const handleSubmit = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    isSaving.value = true

    // パスワードが入力されていない場合は削除
    const data: UpdateProfileData = {
      name: form.name,
      email: form.email,
    }

    if (form.password) {
      data.password = form.password
      data.password_confirmation = form.password_confirmation
    }

    const response = await userApi.updateProfile(data)
    successMessage.value = response.message

    // パスワードフィールドをクリア
    form.password = ''
    form.password_confirmation = ''
  } catch (error: any) {
    errorMessage.value = error.message || 'プロフィールの更新に失敗しました'
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.push('/posts')
}
</script>

<style scoped>
.profile {
  max-width: 600px;
  margin: 0 auto;
}

h2 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.profile-form {
  border: 1px solid #ddd;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  box-sizing: border-box;
}

.error {
  color: #e74c3c;
  margin: 0.5rem 0;
}

.success {
  color: #41B883;
  margin: 0.5rem 0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

button[type="submit"] {
  background-color: #41B883;
  color: white;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button[type="submit"]:hover:not(:disabled) {
  opacity: 0.8;
}

button[type="button"] {
  background-color: #95a5a6;
  color: white;
}

button[type="button"]:hover {
  opacity: 0.8;
}
</style>