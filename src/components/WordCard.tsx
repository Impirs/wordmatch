interface WordCardProps {
  word: string;
  isSelected: boolean;
  isError: boolean;
  isCorrect?: boolean;
  isFading: boolean;
  onClick: () => void;
}

export function WordCard({ word, isSelected, isError, isCorrect, isFading, onClick }: WordCardProps) {
  let stateClass = 'bg-secondary border-2 border-primary';

  if (isFading) {
    stateClass = isCorrect
      ? 'opacity-0 bg-done/30 border-2 border-done'
      : 'opacity-0';
  } else if (isError) {
    stateClass = 'bg-error/25 border-2 border-error text-error animate-shake';
  } else if (isSelected) {
    stateClass = 'bg-accent/25 border-2 border-accent';
  }

  return (
    <button
      onClick={onClick}
      className={`
        h-18 md:h-22 px-4 md:px-6 rounded-xl md:rounded-2xl font-medium text-xl md:text-2xl
        flex items-center justify-center text-center
        transition-all duration-150 select-none
        ${stateClass}
      `}
    >
      {word}
    </button>
  );
}
