import { getUniqueWords, allWordSets } from "../words";
import { shuffleArray } from "./functions";

const STORAGE_KEY = "wordmatch_enabled_sets";

/**
 * Тип данных для карточки в игре:
 * {
 *   pair_id - уникальный идентификатор пары слов в массиве пар для упражнения (сербское и русское)
 *   board_id - уникальный идентификатор карточки на игровом поле (может быть null для карточек в очереди)
 *   words - сами слова из, берем сербское и русское в зависимости от column
 *   column - на какой стороне поля находится карточка ("serbian" или "russian")
 *   status - статус карточки ("normal", "selected", "matched", "mismatched")
 * }
 */
export interface CardData {
    pair_id: number;
  board_id: number | null;
  words: { serbian: string; russian: string };
  column: "serbian" | "russian" | null;
  status: "normal" | "selected" | "matched" | "mismatched";
}

// Элемент очереди: пара карточек, которые добавляются перекрёстно
export interface QueuePair {
  card1: CardData;
  card2: CardData;
}

/**
 * Получить список включённых наборов из localStorage
 */
export function getEnabledSets(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved) as string[];
  }
  return allWordSets.map((set) => set.id);
}

/**
 * Подготовить слова для игры:
 * 1. Берём все слова из включённых наборов
 * 2. Если слов меньше требуемого - добавляем наборы повторно
 * 3. Перемешиваем и берём нужное количество
 */
export function prepareGameWords(cardCount: number): [string, string][] | null {
  const enabledSets = getEnabledSets();
  let words = getUniqueWords(enabledSets);

  if (words.length === 0) {
    return null;
  }

  // Если слов не хватает, добавляем наборы повторно
  while (words.length < cardCount) {
    words = [...words, ...getUniqueWords(enabledSets)];
  }

  // Перемешиваем и берём нужное количество
  const shuffled = shuffleArray(words);
  return shuffled.slice(0, cardCount);
}

/**
 * Создать карточки из слов
 */
export function createCards(words: [string, string][]): CardData[] {
  return words.map(([serbian, russian], index) => ({
    pair_id: index,
    board_id: null,
    words: { serbian, russian },
    column: null,
    status: "normal",
  }));
}

/**
 * Создаем очередь из пар карточек из изначатльного массива пар слов
 */
export function createQueue(words: [string, string][]): QueuePair[] {
  return words.map(([serbian, russian], index) => ({
    card1: {
      pair_id: index,
      board_id: null,
      words: { serbian, russian },
      column: "serbian",
      status: "normal",
    },
    card2: {
      pair_id: index,
      board_id: null,
      words: { serbian, russian },
      column: "russian",
      status: "normal",
    },
  }));
}

export function swapCards(
  qp1: QueuePair,
  qp2: QueuePair,
): [QueuePair, QueuePair] {
  return [
    {
      card1: qp1.card1,
      card2: qp2.card2,
    },
    {
      card1: qp2.card1,
      card2: qp1.card2,
    },
  ];
}
