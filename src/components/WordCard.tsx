interface WordCardProps {
  word: string;
  isSelected: boolean;
  isError: boolean;
  isFading: boolean;
  onClick: () => void;
}

export function WordCard({ word, isSelected, isError, isFading, onClick }: WordCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg font-medium transition-all duration-300 text-sm ${
        isFading
          ? 'opacity-0 scale-95'
          : isError
          ? 'bg-error/30 border-2 border-error'
          : isSelected
          ? 'bg-accent/30 border-2 border-accent'
          : 'bg-primary hover:bg-hover border-2 border-transparent'
      }`}
    >
      {word}
    </button>
  );
}
