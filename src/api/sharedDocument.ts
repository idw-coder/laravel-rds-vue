/**
 * 共同編集ドキュメント API
 * 
 * リアルタイム共同編集機能で使用するAPI群
 * - ドキュメントの取得・保存
 * - 画像のアップロード・削除
 * - 編集ロックの管理
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

// ============================================================
// 型定義
// ============================================================

/** ドキュメント */
export interface SharedDocument {
  room_id: string;
  content: string;
}

/** ロック状態 */
export interface LockStatus {
  is_locked: boolean;
  is_my_lock?: boolean;
  locked_at?: string;
  expires_at?: string;
}

/** ロック操作のレスポンス */
export interface LockResponse {
  success: boolean;
  session_id?: string;
  locked_at?: string;
  expires_at?: string;
  error?: string;
  message?: string;
}

// ============================================================
// ドキュメント CRUD
// ============================================================

/** ドキュメント取得 */
export const getDocument = async (roomId: string): Promise<SharedDocument> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Failed to fetch document (${response.status})`;
    throw new Error(errorMessage);
  }
  return response.json();
};

/** ドキュメント更新 */
export const updateDocument = async (roomId: string, content: string): Promise<SharedDocument> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
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
};

// ============================================================
// 画像管理
// ============================================================

/** 画像アップロード（最大5MB、JPEG/PNG/GIF/WebP対応） */
export const uploadImage = async (roomId: string, file: File): Promise<{ url: string; path: string }> => {
  const MAX_SIZE = 5 * 1024 * 1024;
  const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > MAX_SIZE) {
    throw new Error('画像サイズは5MB以下にしてください');
  }
  if (!VALID_TYPES.includes(file.type)) {
    throw new Error('画像ファイルのみアップロード可能です（JPEG、PNG、GIF、WebP）');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/documents/${roomId}/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '画像のアップロードに失敗しました');
  }

  return response.json();
};

/** 画像削除 */
export const deleteImage = async (roomId: string, filename: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/images/${filename}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '画像の削除に失敗しました');
  }

  return response.json();
};

// ============================================================
// 編集ロック管理
// ============================================================

/** ロック取得（編集権限を獲得） */
export const acquireLock = async (roomId: string): Promise<LockResponse> => {
  const response = await fetch(`${API_BASE}/documents/${roomId}/lock`, {
    method: 'POST',
    credentials: 'include',
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

/** ロック解放（編集権限を解放） */
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

/** ロック状態確認 */
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