const API_BASE = 'http://localhost/api'

export interface Post {
  id?: number
  title: string
  content: string
  status: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const postsApi = {
  // 一覧取得
  async getAll(): Promise<Post[]> {
    const response = await fetch(`${API_BASE}/posts`)
    return response.json()
  },

  // 作成
  async create(post: Omit<Post, 'id'>): Promise<Post> {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
    return response.json()
  }
}