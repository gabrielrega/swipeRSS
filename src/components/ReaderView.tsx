import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { SavedArticle } from '../db';
import { db } from '../db';
import { minifluxService } from '../services/minifluxService';
import { X, CheckCheck, ArrowLeft, ExternalLink } from 'lucide-react';

interface ReaderViewProps {
  article: SavedArticle;
  onClose: () => void;
  onComplete: (id: number) => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({ article, onClose, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  // Swipe to back physics (iOS style)
  const opacity = useTransform(x, [0, 200], [1, 0.5]);
  const scale = useTransform(x, [0, 200], [1, 0.95]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Only close if swipe is predominantly horizontal and past threshold
    if (info.offset.x > 150 && Math.abs(info.velocity.y) < 500) {
      onClose();
    } else {
      x.set(0);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark as read in Miniflux and unstar
      await minifluxService.markAsRead([article.id]);
      // Remove from local storage
      await db.saved_articles.delete(article.id);
      onComplete(article.id);
    } catch (err) {
      console.error('Error completing reading:', err);
      // Still close even if API fails, to not block user
      onComplete(article.id);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.5 }}
      style={{ x, opacity, scale }}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 z-50 bg-white dark:bg-black overflow-y-auto overscroll-none"
    >
      <div ref={containerRef} className="max-w-2xl mx-auto min-h-screen flex flex-col px-6 py-12 pb-32 font-serif">
        {/* Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-between px-6 z-10 border-b border-zinc-100 dark:border-zinc-900 font-sans">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ExternalLink className="w-5 h-5 text-zinc-400" />
            </a>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="mt-10">
          <p className="text-sm font-sans font-bold uppercase tracking-widest text-orange-500 mb-4">
            {article.feed_title}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 leading-tight mb-6">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 mb-10 font-sans text-sm text-zinc-500">
            <span>{article.author || 'Autor Desconhecido'}</span>
            <span>•</span>
            <time>{new Date(article.published_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          </div>

          <div 
            className="reader-content prose prose-zinc dark:prose-invert prose-lg max-w-none 
              prose-headings:font-sans prose-headings:font-black
              prose-p:leading-relaxed prose-p:mb-6
              prose-img:rounded-3xl prose-img:shadow-lg
              text-zinc-800 dark:text-zinc-200"
            dangerouslySetInnerHTML={{ 
              __html: article.extracted_content || article.original_content 
            }}
          />
        </div>

        {/* Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white dark:from-black dark:via-black to-transparent pointer-events-none flex justify-center">
          <button 
            onClick={handleComplete}
            className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-sans font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <CheckCheck className="w-6 h-6" />
            CONCLUIR LEITURA
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReaderView;
