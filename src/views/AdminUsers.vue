<template>
    <div class="admin-users">
      <h2>ユーザー管理</h2>
  
      <div v-if="loading" class="loading">読み込み中...</div>
  
      <div v-else-if="error" class="error-message">{{ error }}</div>
  
      <div v-else>
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名前</th>
              <th>メール</th>
              <th>ロール</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{ 'deleted-row': user.deleted_at }">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span v-for="role in user.roles" :key="role.name" class="role-badge" :class="'role-' + role.name">
                  {{ role.label || role.name }}
                </span>
              </td>
              <td>
                <span v-if="user.deleted_at" class="status-deleted">削除済み</span>
                <span v-else class="status-active">有効</span>
              </td>
              <td>
                <button 
                  v-if="user.deleted_at" 
                  @click="handleRestore(user)" 
                  class="btn btn-restore"
                  :disabled="processing"
                >
                  復元
                </button>
                <button 
                  v-else 
                  @click="handleDelete(user)" 
                  class="btn btn-delete"
                  :disabled="processing || user.id === currentUserId"
                  :title="user.id === currentUserId ? '自分自身は削除できません' : ''"
                >
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { adminApi, type AdminUser } from '@/api/admin';
  
  const users = ref<AdminUser[]>([]);
  const loading = ref(true);
  const error = ref('');
  const processing = ref(false);
  
  // 現在ログイン中のユーザーID
  const currentUserId = ref<number | null>(null);
  
  onMounted(async () => {
    // localStorageからユーザー情報を取得
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        currentUserId.value = user.id;
      }
    } catch {
      // エラーは無視
    }
  
    await fetchUsers();
  });
  
  const fetchUsers = async () => {
    loading.value = true;
    error.value = '';
    try {
      users.value = await adminApi.getUsers();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'ユーザー一覧の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  };
  
  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`「${user.name}」を削除しますか？`)) return;
  
    processing.value = true;
    try {
      await adminApi.deleteUser(user.id);
      await fetchUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      processing.value = false;
    }
  };
  
  const handleRestore = async (user: AdminUser) => {
    if (!confirm(`「${user.name}」を復元しますか？`)) return;
  
    processing.value = true;
    try {
      await adminApi.restoreUser(user.id);
      await fetchUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : '復元に失敗しました');
    } finally {
      processing.value = false;
    }
  };
  </script>
  
  <style scoped>
  .admin-users {
    padding: 1rem 0;
  }
  
  h2 {
    margin-bottom: 1.5rem;
    color: #35495e;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .error-message {
    padding: 1rem;
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c00;
  }
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .users-table th {
    background-color: #f9f9f9;
    font-weight: 600;
    color: #35495e;
  }
  
  .deleted-row {
    background-color: #f9f9f9;
    color: #999;
  }
  
  .role-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    margin-right: 0.25rem;
  }
  
  .role-admin {
    background-color: #e74c3c;
    color: white;
  }
  
  .role-paid {
    background-color: #3498db;
    color: white;
  }
  
  .role-free {
    background-color: #95a5a6;
    color: white;
  }
  
  .status-active {
    color: #27ae60;
  }
  
  .status-deleted {
    color: #e74c3c;
  }
  
  .btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-delete {
    background-color: #e74c3c;
    color: white;
  }
  
  .btn-delete:hover:not(:disabled) {
    background-color: #c0392b;
  }
  
  .btn-restore {
    background-color: #27ae60;
    color: white;
  }
  
  .btn-restore:hover:not(:disabled) {
    background-color: #1e8449;
  }
  </style>