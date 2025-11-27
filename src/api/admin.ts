import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { User } from "./user";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface AdminUser extends User {
  deleted_at?: string | null;
}

export const adminApi = {
  // ユーザー一覧取得（論理削除済みも含む）
  async getUsers(): Promise<AdminUser[]> {
    const response = await fetchWithAuth(`${API_BASE}/admin/users`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'ユーザー一覧の取得に失敗しました' }));
      throw new Error(errorData.message || 'ユーザー一覧の取得に失敗しました');
    }
    return response.json();
  },

  // ユーザーを論理削除
  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await fetchWithAuth(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'ユーザーの削除に失敗しました');
    }
    return responseData;
  },

  // ユーザーを復元
  async restoreUser(userId: number): Promise<{ message: string }> {
    const response = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/restore`, {
      method: "POST",
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'ユーザーの復元に失敗しました');
    }
    return responseData;
  },
};