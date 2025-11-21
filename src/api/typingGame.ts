import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export interface WordEntry {
  command: string;
  description: string;
}

export interface Category {
  slug: string;
  name: string;
}

export interface CategoryData {
  name: string;
  data: WordEntry[];
}

/**
 * typingGameApi
 * @description タイピングゲームAPI
 */
export const typingGameApi = {
  // カテゴリー一覧を取得
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/typing-game/categories`);
      if (!response.ok) {
        // APIが存在しない場合はモックデータを返す
        return getMockCategories();
      }
      return response.json();
    } catch (error) {
      console.warn("Categories API not available, using mock data:", error);
      return getMockCategories();
    }
  },

  // カテゴリーごとのコマンドを取得
  async getCommands(categorySlug: string): Promise<WordEntry[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/typing-game/commands/${categorySlug}`);
      if (!response.ok) {
        // APIが存在しない場合はモックデータを返す
        return getMockCommands(categorySlug);
      }
      return response.json();
    } catch (error) {
      console.warn(`Commands API not available for ${categorySlug}, using mock data:`, error);
      return getMockCommands(categorySlug);
    }
  },
};

// モックカテゴリーデータ
function getMockCategories(): Category[] {
  return [
    { slug: "git", name: "Git" },
    { slug: "docker", name: "Docker" },
    { slug: "javascript", name: "JavaScript" },
  ];
}

// モックコマンドデータ
function getMockCommands(categorySlug: string): WordEntry[] {
  const mockData: { [key: string]: WordEntry[] } = {
    git: [
      { command: "git init", description: "リポジトリを初期化する" },
      { command: "git add .", description: "すべての変更をステージングする" },
      { command: "git commit -m", description: "変更をコミットする" },
      { command: "git push", description: "リモートにプッシュする" },
      { command: "git pull", description: "リモートから取得する" },
      { command: "git status", description: "状態を確認する" },
      { command: "git branch", description: "ブランチ一覧を表示する" },
      { command: "git checkout", description: "ブランチを切り替える" },
    ],
    docker: [
      { command: "docker build", description: "イメージをビルドする" },
      { command: "docker run", description: "コンテナを実行する" },
      { command: "docker ps", description: "実行中のコンテナを表示する" },
      { command: "docker stop", description: "コンテナを停止する" },
      { command: "docker images", description: "イメージ一覧を表示する" },
      { command: "docker-compose up", description: "Composeで起動する" },
    ],
    javascript: [
      { command: "console.log", description: "コンソールに出力する" },
      { command: "const", description: "定数を宣言する" },
      { command: "let", description: "変数を宣言する" },
      { command: "function", description: "関数を定義する" },
      { command: "async await", description: "非同期処理を記述する" },
      { command: "Promise", description: "非同期処理のオブジェクト" },
    ],
  };

  return mockData[categorySlug] || [];
}

