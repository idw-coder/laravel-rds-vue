const API_BASE = "http://localhost/api";

export interface Post {
  id?: number;
  title: string;
  content: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export const postsApi = {
  // 一覧取得
  async getAll(): Promise<Post[]> {
    const response = await fetch(`${API_BASE}/posts`);
    return response.json();
  },

  // 作成
  async create(post: Omit<Post, "id">): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    return response.json();
  },

  // 削除
  async delete(id: number): Promise<void> {
    await fetch(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
    });
  },

  // 更新
  async update(id: number, post: Partial<Post>): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    return response.json();
  },
};
