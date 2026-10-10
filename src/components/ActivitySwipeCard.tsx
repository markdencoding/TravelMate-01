import React, { useState } from 'react';

interface ActivitySwipeCardProps {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  duration?: string;
  location?: string;
  category: string;
  badgeStyle?: string;
  dotColor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ActivitySwipeCard: React.FC<ActivitySwipeCardProps> = ({
  title,
  time,
  duration,
  location,
  category,
  badgeStyle = 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  dotColor = 'bg-teal-500',
  onEdit,
  onDelete,
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const diff = e.touches[0].clientX - startX;
    // Bound swipe between -100px (swipe left to delete) and +100px (swipe right to edit)
    if (diff > -120 && diff < 120) {
      setOffsetX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (offsetX < -70 && onDelete) {
      onDelete();
    } else if (offsetX > 70 && onEdit) {
      onEdit();
    }
    setOffsetX(0);
    setStartX(null);
    setIsSwiping(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl w-full my-1 select-none">
      {/* Background Action Underlays */}
      <div className="absolute inset-0 flex items-center justify-between px-5 rounded-2xl">
        {/* Swipe Right to Edit (Green/Teal) */}
        <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold text-xs">
          <span className="material-symbols-outlined text-[22px]">edit</span>
          <span>Edit</span>
        </div>
        {/* Swipe Left to Delete (Red/Rose) */}
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs">
          <span>Delete</span>
          <span className="material-symbols-outlined text-[22px]">delete</span>
        </div>
      </div>

      {/* Foreground Draggable Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeStyle}`}>
              {category}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {time}
            </span>
          </div>
          {duration && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {duration}
            </span>
          )}
        </div>

        <div>
          <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
            {title}
          </h4>
          {location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-teal-600 dark:text-teal-400">
                location_on
              </span>
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        {/* Subtle swipe hint indicators for mobile accessibility */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit();
            }}
            className="flex items-center gap-0.5 hover:text-teal-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[12px]">edit</span>
            <span>Swipe right / Tap to edit</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
            className="flex items-center gap-0.5 hover:text-rose-600 cursor-pointer"
          >
            <span>Swipe left / Tap to delete</span>
            <span className="material-symbols-outlined text-[12px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
