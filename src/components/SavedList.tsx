import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { SavedArticle } from '../db';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, Clock, CircleCheck, Loader2, Trash2 } from 'lucide-react';

interface SavedListProps {
  onSelectArticle: (article: SavedArticle) => void;
}

const SavedList: React.FC<SavedListProps> = ({ onSelectArticle }) => {
  const articles = useLiveQuery(
    () => db.saved_articles.orderBy('saved_at').reverse().toArray()
  );

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Deseja remover este artigo dos salvos?')) {
      await db.saved_articles.delete(id);
    }
  };

  if (!articles) return null;

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60">
        <BookOpen className="w-16 h-16 mb-4 text-zinc-300 dark:text-zinc-700" />
        <p className="text-zinc-500 font-medium">Sua fila de leitura está vazia.</p>
        <p className="text-sm text-zinc-400 mt-2">Salve artigos na triagem para ler offline.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full pb-20">
      <h2 className="text-2xl font-black mb-2 px-2">Fila de Leitura</h2>
      {articles.map((article) => (
        <div
          key={article.id}
          onClick={() => onSelectArticle(article)}
          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 truncate">
                  {article.feed_title}
                </span>
                <span className="text-[10px] text-zinc-400">•</span>
                <span className="text-[10px] text-zinc-400">
                  {formatDistanceToNow(article.saved_at, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                {article.title}
              </h3>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              {article.extraction_status === 'pending' ? (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-[10px] font-bold">A EXTRAIR...</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              ) : article.extraction_status === 'success' ? (
                <div className="flex items-center gap-1.5 text-green-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">OFFLINE</span>
                  <CircleCheck className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">ERRO</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              )}
              
              <button 
                onClick={(e) => handleDelete(e, article.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedList;
