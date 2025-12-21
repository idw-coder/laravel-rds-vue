const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface SharedDocument {
  room_id: string;
  content: string;
}

export const documentApi = {
  // ドキュメント取得
  async get(roomId: string): Promise<SharedDocument> {
    const response = await fetch(`${API_BASE}/documents/${roomId}`, {
      credentials: 'include', // セッションCookieを送信
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to fetch document (${response.status})`;
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // ドキュメント保存
  async save(roomId: string, content: string): Promise<SharedDocument> {
    const response = await fetch(`${API_BASE}/documents/${roomId}`, {
      method: "POST",
      credentials: 'include', // セッションCookieを送信
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to save document (${response.status})`;
      console.error('Save error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorMessage);
    }
    return response.json();
  },
};

// 個別エクスポート関数（WebSocket対応版で使用）
export const getDocument = (roomId: string): Promise<SharedDocument> => {
  return documentApi.get(roomId);
};

export const updateDocument = (roomId: string, content: string): Promise<SharedDocument> => {
  return documentApi.save(roomId, content);
};

// 画像アップロード
export const uploadImage = async (roomId: string, file: File): Promise<{ url: string; path: string }> => {
  // ファイルサイズチェック（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('画像サイズは5MB以下にしてください');
  }

  // 画像形式チェック
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('画像ファイルのみアップロード可能です（JPEG、PNG、GIF、WebP）');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/documents/${roomId}/images`, {
    method: 'POST',
    credentials: 'include', // セッションCookieを送信
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '画像のアップロードに失敗しました');
  }

  return response.json();
};

// 画像削除
export const deleteImage = async (roomId: string, filename: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/images/${filename}`, {
    method: 'DELETE',
    credentials: 'include', // セッションCookieを送信
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '画像の削除に失敗しました');
  }

  return response.json();
};

// ロック関連のインターフェース
export interface LockStatus {
  is_locked: boolean;
  is_my_lock?: boolean;
  locked_at?: string;
  expires_at?: string;
}

export interface LockResponse {
  success: boolean;
  locked_at?: string;
  expires_at?: string;
  error?: string;
  message?: string;
}

// ロック取得
export const acquireLock = async (roomId: string): Promise<LockResponse> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/lock`, {
    method: 'POST',
    credentials: 'include', // セッションCookieを送信
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || 'ロックの取得に失敗しました';
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ロック解放
export const releaseLock = async (roomId: string): Promise<LockResponse> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/lock`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || 'ロックの解放に失敗しました';
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ロック状態確認
export const checkLockStatus = async (roomId: string): Promise<LockStatus> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/lock`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'ロック状態の確認に失敗しました');
  }

  const data = await response.json();
  return data as LockStatus;
};

// ロック更新（ハートビート）
export const refreshLock = async (roomId: string): Promise<LockResponse> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/lock`, {
    method: 'PUT',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || 'ロックの更新に失敗しました';
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};