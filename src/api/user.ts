import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface Role {
  label: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  google_id?: string | null;
  roles?: Role[];
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
}

export const userApi = {
  // プロフィール取得
  async getProfile(): Promise<User> {
    const response = await fetchWithAuth(`${API_BASE}/profile`);
    return response.json();
  },

  // プロフィール更新
  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: User }> {
    const response = await fetchWithAuth(`${API_BASE}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};