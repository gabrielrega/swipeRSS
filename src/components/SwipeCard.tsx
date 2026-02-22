import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { Entry } from '../services/minifluxService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, X, ChevronUp } from 'lucide-react';

interface SwipeCardProps {
  entry: Entry;
  onSwipeLeft: (id: number) => void;
  onSwipeRight: (id: number) => void;
  onSwipeUp: (id: number) => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ entry, onSwipeLeft, onSwipeRight, onSwipeUp }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Visual cues based on position
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const dislikeOpacity = useTransform(x, [-50, -150], [0, 1]);
  const skipOpacity = useTransform(y, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipeRight(entry.id);
    } else if (info.offset.x < -100) {
      onSwipeLeft(entry.id);
    } else if (info.offset.y < -100) {
      onSwipeUp(entry.id);
    }
  };

  const publishedDate = parseISO(entry.published_at);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true, locale: ptBR });

  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      className="absolute w-full h-full max-w-[400px] max-h-[600px] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-zinc-200 dark:border-zinc-800"
    >
      <div className="relative h-full flex flex-col">
        {/* Visual Indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 border-4 border-green-500 rounded-lg p-2 rotate-[-15deg] z-10 pointer-events-none">
          <Heart className="w-12 h-12 text-green-500 fill-green-500" />
        </motion.div>
        <motion.div style={{ opacity: dislikeOpacity }} className="absolute top-10 right-10 border-4 border-red-500 rounded-lg p-2 rotate-[15deg] z-10 pointer-events-none">
          <X className="w-12 h-12 text-red-500" />
        </motion.div>
        <motion.div style={{ opacity: skipOpacity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 border-4 border-blue-500 rounded-lg p-2 z-10 pointer-events-none">
          <ChevronUp className="w-12 h-12 text-blue-500" />
        </motion.div>

        {/* Content */}
        <div className="p-6 flex flex-col h-full">
          <div className="text-sm text-zinc-500 mb-2 flex justify-between">
            <span>{entry.feed.title}</span>
            <span>{timeAgo}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 line-clamp-3">
            {entry.title}
          </h2>
          <div 
            className="text-zinc-600 dark:text-zinc-400 text-base flex-grow overflow-hidden line-clamp-[10]"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
          <div className="mt-auto pt-4 text-xs text-zinc-400">
            {entry.author || 'Autor desconhecido'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
