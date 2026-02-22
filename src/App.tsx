import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from './components/SwipeCard';
import SavedList from './components/SavedList';
import ReaderView from './components/ReaderView';
import { minifluxService } from './services/minifluxService';
import { offlineService } from './services/offlineService';
import type { Entry } from './services/minifluxService';
import type { SavedArticle } from './db';
import { Loader2, RefreshCw, LayoutGrid, CheckCheck, BookOpen } from 'lucide-react';

type View = 'deck' | 'list';

function App() {
  const [view, setView] = useState<View>('deck');
  
  useEffect(() => {
    console.log('SwipeRSS App Montado!');
  }, []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const freshEntries = await minifluxService.fetchEntries();
      setEntries(freshEntries);
    } catch (err) {
      console.error('Erro ao carregar notícias:', err);
      setError('Falha na conexão com o Miniflux. Verifique o .env e o servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSwipeLeft = async (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await minifluxService.markAsRead([id]);
    } catch (err) {
      console.error('Erro ao descartar:', err);
    }
  };

  const handleSwipeRight = async (id: number) => {
    const entry = entries.find((e) => e.id === id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    
    if (entry) {
      try {
        Promise.all([
          minifluxService.bookmark(id),
          offlineService.saveArticle(entry)
        ]).catch(err => console.error('Erro ao salvar:', err));
      } catch (err) {
        console.error('Erro ao iniciar salvamento:', err);
      }
    }
  };

  const handleSwipeUp = (id: number) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (!entry) return prev;
      const rest = prev.filter((e) => e.id !== id);
      return [...rest, entry];
    });
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-orange-500" />
          SwipeRSS
        </h1>
        <div className="flex items-center gap-3">
          {view === 'deck' && (
            <button 
              onClick={loadEntries}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow relative flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {view === 'deck' ? (
            <motion.div 
              key="deck"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex items-center justify-center p-6 relative h-full"
            >
              {loading && entries.length === 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                  <p className="text-zinc-500 font-medium text-center px-6">Limpando 14 dias e buscando novos feeds...</p>
                </div>
              ) : error ? (
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl max-w-sm mx-auto">
                  <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
                  <button 
                    onClick={loadEntries}
                    className="px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : entries.length > 0 ? (
                <div className="relative w-full max-w-[400px] aspect-[2/3]">
                  <AnimatePresence mode="popLayout">
                    {entries.slice(0, 3).reverse().map((entry) => (
                      <SwipeCard
                        key={entry.id}
                        entry={entry}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                        onSwipeUp={handleSwipeUp}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCheck className="w-12 h-12 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Tudo limpo!</h2>
                    <p className="text-zinc-500 max-w-[250px] mx-auto">Você triou todas as suas notícias recentes. Volte mais tarde ou adicione novos feeds.</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-grow h-full overflow-hidden"
            >
              <SavedList onSelectArticle={(a) => setSelectedArticle(a)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reader View Overlay */}
        <AnimatePresence>
          {selectedArticle && (
            <ReaderView 
              article={selectedArticle}
              onClose={() => setSelectedArticle(null)}
              onComplete={() => setSelectedArticle(null)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="px-6 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center shrink-0 pb-safe">
        <button 
          onClick={() => setView('deck')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'deck' ? 'text-orange-500' : 'text-zinc-400'}`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Triagem</span>
        </button>
        <button 
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'text-orange-500' : 'text-zinc-400'}`}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Leitura</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
