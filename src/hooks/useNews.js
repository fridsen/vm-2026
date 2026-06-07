import { useAppData } from './useAppData.js';
import { NEWS_ARTICLE_LIMIT } from '../services/newsService.js';

export function useNews(limit = NEWS_ARTICLE_LIMIT) {
  const { newsArticles, newsLoading } = useAppData();
  return {
    articles: newsArticles.slice(0, limit),
    loading: newsLoading,
  };
}
