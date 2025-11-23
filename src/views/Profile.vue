<template>
  <div class="profile">
    <h2>プロフィール</h2>

    <div v-if="isLoading">読み込み中...</div>

    <form v-else @submit.prevent="handleSubmit" class="profile-form">
      <!-- アバター画像のプレビューとアップロード -->
      <div class="form-group">
        <label>プロフィール画像</label>
        <div class="avatar-section">
          <div class="avatar-preview">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt="Avatar Preview"
              class="avatar-image"
            />
            <div v-else class="avatar-placeholder">画像未設定</div>
          </div>
          <input
            type="file"
            accept="image/*"
            @change="handleFileChange"
            ref="fileInput"
            class="file-input"
          />
          <div class="avatar-buttons">
            <button type="button" @click="selectFile" class="select-file-btn">
              画像を選択
            </button>
            <button 
              v-if="avatarPreview" 
              type="button" 
              @click="handleDeleteAvatar" 
              class="delete-avatar-btn"
            >
              画像を削除
            </button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>名前</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>メールアドレス</label>
        <input v-model="form.email" type="email" required />
      </div>

      <div class="form-group">
        <label>ロール</label>
        <p>
          <span v-for="(role, index) in roles" :key="index" class="role-label">
            {{ role.label }}<span v-if="index < roles.length - 1">, </span>
          </span>
        </p>
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
import { userApi, type UpdateProfileData, type Role } from '@/api/user'

const router = useRouter()
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const roles = ref<Role[]>([])
const avatarPreview = ref<string>('')
const fileInput = ref<HTMLInputElement>()

const form = reactive<UpdateProfileData>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  avatar: '',
})

onMounted(async () => {
  try {
    const user = await userApi.getProfile()
    console.log("===profile===", user)
    form.name = user.name
    form.email = user.email
    roles.value = user.roles || []
    
    // 既存のアバターがあれば表示
    if (user.avatar) {
      avatarPreview.value = `data:image/png;base64,${user.avatar}`
    }
  } catch (error) {
    errorMessage.value = 'プロフィールの取得に失敗しました'
  } finally {
    isLoading.value = false
  }
})

const selectFile = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // ファイルサイズチェック（2MB以下）
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = '画像サイズは2MB以下にしてください'
    return
  }
  
  // 画像をBase64に変換
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    avatarPreview.value = result
    form.avatar = result
  }
  reader.readAsDataURL(file)
}

const handleDeleteAvatar = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    isSaving.value = true

    // アバターをnullに設定して削除
    const data: UpdateProfileData = {
      name: form.name,
      email: form.email,
      avatar: null,
    }

    const response = await userApi.updateProfile(data)
    successMessage.value = response.message || 'アバター画像を削除しました'

    // プレビューとフォームをクリア
    avatarPreview.value = ''
    form.avatar = ''
    
    // ファイル入力もリセット
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'アバター画像の削除に失敗しました'
  } finally {
    isSaving.value = false
  }
}

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

    // アバターが変更されている場合
    if (form.avatar) {
      data.avatar = form.avatar
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

/* アバター関連のスタイル */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border: 2px solid #ddd;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: #999;
  font-size: 0.8rem;
  text-align: center;
}

.file-input {
  display: none;
}

button[type="button"].select-file-btn {
  background-color: transparent;
  color: #41B883;
  border: 1px solid #41B883;
}

button[type="button"].select-file-btn:hover {
  background-color: rgba(65, 184, 131, 0.1);
  opacity: 1;
}

button[type="button"].delete-avatar-btn {
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

button[type="button"].delete-avatar-btn:hover {
  background-color: rgba(231, 76, 60, 0.1);
  opacity: 1;
}

.role-label {
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
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
  font-size: 0.75rem;
  padding: 0.4rem 0.8rem;
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