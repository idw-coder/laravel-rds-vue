import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface Post {
  id?: number;
  title: string;
  content: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  user_id?: number;
  user?: {
    id?: number;
    name?: string;
    avatar?: string | null;
  };
}

/**
 * postsApi
 * @description 投稿API
 */
export const postsApi = {
  // 一覧取得
  async getAll(): Promise<Post[]> {
    const response = await fetchWithAuth(`${API_BASE}/posts`);
    return response.json();
  },

  // 詳細取得
  async getById(id: number): Promise<Post> {
    const response = await fetchWithAuth(`${API_BASE}/posts/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(errorData.message || `投稿の取得に失敗しました (${response.status})`)
      // 403エラーの場合、エラーオブジェクトにstatusを追加
      if (response.status === 403) {
        (error as any).status = 403
      }
      throw error
    }
    return response.json();
  },

  // 作成
  async create(post: Omit<Post, "id">): Promise<Post> {
    const response = await fetchWithAuth(`${API_BASE}/posts`, {
      method: "POST",
      body: JSON.stringify(post),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `投稿の作成に失敗しました (${response.status})`);
      if (response.status === 403) {
        (error as any).status = 403;
      }
      throw error;
    }
    return response.json();
  },

  // 削除
  async delete(id: number): Promise<void> {
    await fetchWithAuth(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
    });
  },

  // 更新
  async update(id: number, post: Partial<Post>): Promise<Post> {
    console.log('postsApi.update called', { id, post, url: `${API_BASE}/posts/${id}` })
    const response = await fetchWithAuth(`${API_BASE}/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(post),
    });
    console.log('postsApi.update response', { status: response.status, ok: response.ok })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('postsApi.update error', errorData)
      throw new Error(errorData.message || `更新に失敗しました (${response.status})`)
    }
    return response.json();
  },

  // 画像アップロード
  async uploadImage(file: File): Promise<{ url: string; path: string }> {
    // ファイルサイズチェック（5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('画像サイズは5MB以下にしてください');
    }

    // 画像形式チェック
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('画像ファイルのみアップロード可能です（JPEG、PNG、GIF、WebP）');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetchWithAuth(`${API_BASE}/posts/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = '画像のアップロードに失敗しました';
      
      if (response.status === 401) {
        errorMessage = '認証エラーが発生しました。再度ログインしてください';
      } else if (response.status === 403) {
        errorMessage = '画像をアップロードする権限がありません（paidまたはadminロールが必要です）';
      } else if (response.status === 422) {
        errorMessage = errorData.message || 'バリデーションエラーが発生しました';
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },
};
