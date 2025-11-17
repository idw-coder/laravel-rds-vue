const API_BASE = "http://localhost/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // サーバーからのエラーメッセージを取得
        // Laravelが message フィールドを含まない形式で返すはず？
        let errorData: { 
          message?: string 
          error?: string
        } = {};
        try {
          errorData = await res.json();
        } catch {
          // エラーが発生した場合は空のオブジェクト
        }
        console.error("Login error:", errorData);
        
        // errorフィールドが存在する場合はシステムエラーとして扱う
        // 詳細はコンソールで確認可能
        if (errorData.error) {
          throw new Error("システムエラーです");
        }
        
        // messageのみの場合は通常のログイン失敗として表示
        const errorMessage = errorData.message || "サーバーからのエラーメッセージが取得できませんでした";
        throw new Error(errorMessage);
      }

      return res.json();
    } catch (error) {
      // ネットワークエラー or タイムアウト
      console.error("Network error:", error);
      if (error instanceof TypeError) {
        // fetch自体が失敗（サーバーに到達できない、タイムアウトなど）
        throw new Error("サーバーに接続できません");
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("token");

    try {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

      localStorage.removeItem("token");
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("ログアウトに失敗しました");
    }
  },
};
