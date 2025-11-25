export async function fetchWithAuth(
    url: string,
    options: RequestInit = {} // TODO: このオプション理解できていない
  ) {
    // Laravel Sanctum の認証トークンを取得
    const token = localStorage.getItem("authToken");
  
    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    const isFormData = options.body instanceof FormData;
  
    // HTTPリクエストのヘッダーを構築
    const headers = new Headers(options.headers);
    
    // FormDataでない場合のみJSON形式のコンテンツタイプを設定
    if (!isFormData) {
      headers.set("Content-Type", "application/json");
    }
    
    // トークンが存在する場合、AuthorizationヘッダーにBearerトークンを追加
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    // 認証エラーなら強制ログアウトしてログイン画面へリダイレクト
    if (response.status === 401) {
      console.warn("Token expired or invalid. Logging out.");
      // Laravel Sanctum の認証トークンを削除
      localStorage.removeItem("authToken");
      // API呼び出し後の401エラー時は、ログイン画面へ強制リダイレクト
      // （ルーターガードはページ遷移前の防御、こちらはAPI呼び出し後の防御）
      window.location.href = "/login";
    }

    // 403エラー（権限不足）は呼び出し側で処理するため、そのまま返す
    // 呼び出し側で適切なエラーメッセージを表示できるようにする

    return response;
  }