import Dexie, { type EntityTable } from 'dexie';

export interface SavedArticle {
  id: number;
  title: string;
  original_content: string; // The Miniflux short content
  extracted_content: string; // The full Readability content
  text_content: string; // Plain text for search (optional)
  url: string;
  feed_title: string;
  author: string;
  published_at: string;
  saved_at: number;
  extraction_status: 'pending' | 'success' | 'failed';
}

export const db = new Dexie('SwipeRSSDatabase') as Dexie & {
  saved_articles: EntityTable<SavedArticle, 'id'>;
};

// Schema declaration:
db.version(1).stores({
  saved_articles: 'id, saved_at, extraction_status' // Primary key and indexed props
});
