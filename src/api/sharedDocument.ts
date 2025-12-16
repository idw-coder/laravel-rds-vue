const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface SharedDocument {
  room_id: string;
  content: string;
}

export const documentApi = {
  // ドキュメント取得
  async get(roomId: string): Promise<SharedDocument> {
    const response = await fetch(`${API_BASE}/documents/${roomId}`);
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
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '画像の削除に失敗しました');
  }

  return response.json();
};