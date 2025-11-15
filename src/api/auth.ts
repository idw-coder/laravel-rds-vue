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
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("ログインに失敗しました");
    }

    return res.json();
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.removeItem("token");
  },
};