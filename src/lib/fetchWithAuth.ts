export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ) {
    const token = localStorage.getItem("token");
  
    // HTTPリクエストのヘッダーを構築
    const headers = {
      // デフォルトでJSON形式のコンテンツタイプを設定
      "Content-Type": "application/json",
      // オプションで渡された既存のヘッダーを展開してマージ（上書き可能）
      ...(options.headers || {}),
      // トークンが存在する場合、AuthorizationヘッダーにBearerトークンを追加
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    // 認証エラーなら強制ログアウトしてログイン画面へリダイレクト
    if (response.status === 401) {
      console.warn("Token expired or invalid. Logging out.");
      localStorage.removeItem("token");
      // API呼び出し後の401エラー時は、ログイン画面へ強制リダイレクト
      // （ルーターガードはページ遷移前の防御、こちらはAPI呼び出し後の防御）
      window.location.href = "/login";
    }

    // 403エラー（権限不足）は呼び出し側で処理するため、そのまま返す
    // 呼び出し側で適切なエラーメッセージを表示できるようにする

    return response;
  }