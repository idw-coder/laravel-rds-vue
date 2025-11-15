export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ) {
    const token = localStorage.getItem("token");
  
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    // 認証エラーなら強制ログアウト（必要であれば）
    if (response.status === 401) {
      console.warn("Token expired or invalid. Logging out.");
      localStorage.removeItem("token");
      // 必要ならリダイレクト:
      // window.location.href = "/login";
    }
  
    return response;
  }