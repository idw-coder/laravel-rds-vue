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
      throw new Error("Failed to fetch document");
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
      throw new Error("Failed to save document");
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