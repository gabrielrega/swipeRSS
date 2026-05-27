import axios from 'axios';
import { differenceInDays, parseISO } from 'date-fns';

const MINIFLUX_URL = import.meta.env.DEV
  ? '/miniflux'
  : import.meta.env.VITE_MINIFLUX_URL;
const API_KEY = import.meta.env.VITE_MINIFLUX_API_KEY;

const api = axios.create({
  baseURL: MINIFLUX_URL,
  headers: {
    'X-Auth-Token': API_KEY,
  },
});

export interface Entry {
  id: number;
  title: string;
  url: string;
  author: string;
  content: string;
  published_at: string;
  status: string;
  hash: string;
  feed: {
    id: number;
    title: string;
    site_url: string;
    feed_url: string;
  };
}

export const minifluxService = {
  async fetchEntries(): Promise<Entry[]> {
    const response = await api.get('/v1/entries', {
      params: {
        status: 'unread',
        direction: 'desc',
        limit: 100,
      },
    });

    const entries: Entry[] = response.data.entries;
    const now = new Date();
    
    const tooOldIds: number[] = [];
    const freshEntries: Entry[] = [];

    entries.forEach((entry) => {
      const publishedDate = parseISO(entry.published_at);
      if (differenceInDays(now, publishedDate) > 14) {
        tooOldIds.push(entry.id);
      } else {
        freshEntries.push(entry);
      }
    });

    if (tooOldIds.length > 0) {
      await this.markAsRead(tooOldIds);
    }

    return freshEntries;
  },

  async markAsRead(entryIds: number[]): Promise<void> {
    await api.put('/v1/entries', {
      entry_ids: entryIds,
      status: 'read',
    });
  },

  async bookmark(entryId: number): Promise<void> {
    await api.put(`/v1/entries/${entryId}/bookmark`);
  },
};
