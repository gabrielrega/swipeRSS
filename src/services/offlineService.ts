import axios from 'axios';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'isomorphic-dompurify';
import { db } from '../db';
import type { SavedArticle } from '../db';
import type { Entry } from './minifluxService';

const CORS_PROXY = import.meta.env.VITE_CORS_PROXY_URL;

export const offlineService = {
  async saveArticle(entry: Entry): Promise<void> {
    const existing = await db.saved_articles.get(entry.id);
    if (existing) return;

    // Initial save with pending status
    const article: SavedArticle = {
      id: entry.id,
      title: entry.title,
      original_content: entry.content,
      extracted_content: '',
      text_content: '',
      url: entry.url,
      feed_title: entry.feed.title,
      author: entry.author || '',
      published_at: entry.published_at,
      saved_at: Date.now(),
      extraction_status: 'pending',
    };
    
    await db.saved_articles.add(article);

    // Fetch in background (or immediately here)
    this.extractContent(entry.id, entry.url).catch(console.error);
  },

  async extractContent(id: number, url: string): Promise<void> {
    try {
      // Use CORS Proxy
      const proxyUrl = `${CORS_PROXY}${url}`;
      const response = await axios.get(proxyUrl, { responseType: 'text' });
      const html = response.data;

      // Parse HTML string to Document
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Run Readability
      const reader = new Readability(doc);
      const article = reader.parse();

      if (article && article.content) {
        // Sanitize content
        const cleanHtml = DOMPurify.sanitize(article.content);
        
        await db.saved_articles.update(id, {
          extracted_content: cleanHtml,
          text_content: article.textContent || '', // Handle null textContent
          extraction_status: 'success',
        });
      } else {
        throw new Error('Readability failed to parse');
      }
    } catch (error) {
      console.error(`Failed to extract content for ${url}:`, error);
      await db.saved_articles.update(id, {
        extraction_status: 'failed',
      });
    }
  },

  async getSavedArticles(): Promise<SavedArticle[]> {
    return await db.saved_articles.orderBy('saved_at').reverse().toArray();
  },

  async deleteArticle(id: number): Promise<void> {
    await db.saved_articles.delete(id);
  }
};
