import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface Role {
  name: string;
  label: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  google_id?: string | null;
  roles?: Role[];
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  avatar?: string | null;
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
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // プロフィール更新（FormData使用、ファイルアップロード用）
  async updateProfileWithFormData(formData: FormData): Promise<{ message: string; user: User }> {
    const response = await fetchWithAuth(`${API_BASE}/profile`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },
};