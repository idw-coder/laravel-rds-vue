import { fetchWithAuth } from "@/lib/fetchWithAuth";
import mockDataGit from "./mockData-git.json";
import mockDataDocker from "./mockData-docker.json";
import mockDataJavascript from "./mockData-javascript.json";
import mockDataLaravel from "./mockData-laravel.json";
import mockDataAichat from "./mockData-aichat.json";
import mockDataSql from "./mockData-sql.json";
import mockDataSvn from "./mockData-svn.json";

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
    { slug: "laravel", name: "Laravel" },
    { slug: "aichat", name: "AIチャット" },
    { slug: "sql", name: "SQL" },
    { slug: "svn", name: "SVN" },
  ];
}

// モックコマンドデータ
function getMockCommands(categorySlug: string): WordEntry[] {
  const mockDataMap: { [key: string]: WordEntry[] } = {
    git: mockDataGit as WordEntry[],
    docker: mockDataDocker as WordEntry[],
    javascript: mockDataJavascript as WordEntry[],
    laravel: mockDataLaravel as WordEntry[],
    aichat: mockDataAichat as WordEntry[],
    sql: mockDataSql as WordEntry[],
    svn: mockDataSvn as WordEntry[],
  };
  return mockDataMap[categorySlug] || [];
}

