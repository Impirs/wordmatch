import { memo } from "react";

interface WordCardProps {
  boardId: number;
  word: string;
  Status: "normal" | "selected" | "matched" | "mismatched";
  isFading: boolean;
  onCardClick: (boardId: number) => void;
}

export const WordCard = memo(function WordCard({
  boardId,
  word,
  Status,
  isFading,
  onCardClick,
}: WordCardProps) {
  let stateClass = "bg-secondary border-2 border-primary";

  if (Status === "matched") {
    stateClass = "bg-done/30 border-2 border-done";
  } else if (Status === "mismatched") {
    stateClass = "bg-error/25 border-2 border-error text-error animate-shake";
  } else if (Status === "selected") {
    stateClass = "bg-accent/25 border-2 border-accent";
  }

  return (
    <button
      onClick={() => onCardClick(boardId)}
      className={`
        h-18 md:h-22 px-4 md:px-6 rounded-xl md:rounded-2xl font-medium text-xl md:text-2xl
        flex items-center justify-center text-center select-none
        ${stateClass} ${isFading ? "transition-opacity duration-500 opacity-0" : "opacity-100"}
    `}
    >
      {word}
    </button>
  );
});
