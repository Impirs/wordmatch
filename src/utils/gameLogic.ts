import { getUniqueWords, allWordSets } from '../words';

const STORAGE_KEY = 'wordmatch_enabled_sets';

export interface CardData {
  id: number;
  serbian: string;
  russian: string;
  visible: boolean;
  fading: boolean;
}

// Слот для отображения карточки (может содержать карточку или null)
export interface SlotData {
  card: CardData | null;
  fading: boolean;
}

/**
 * Перемешивание массива (Fisher-Yates shuffle)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Получить список включённых наборов из localStorage
 */
export function getEnabledSets(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved) as string[];
  }
  return allWordSets.map(set => set.id);
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
    id: index,
    serbian,
    russian,
    visible: true,
    fading: false,
  }));
}

/**
 * Подготовить начальные слоты и очередь для игры
 *
 * Алгоритм:
 * 1. Первые 5 карточек отображаются сразу (с перемешанными позициями в каждом столбце)
 * 2. Остальные карточки группируются попарно
 * 3. При замене угаданной пары - берём 2 карточки из очереди,
 *    одна встаёт на место сербского, другая - на место русского
 */
export function prepareInitialSlots(cards: CardData[]): {
  serbianSlots: (CardData | null)[];
  russianSlots: (CardData | null)[];
  cardQueue: CardData[];
} {
  // Первые 5 карточек
  const first5 = cards.slice(0, 5);

  // Перемешиваем позиции отдельно для каждого столбца
  const serbianSlots = shuffleArray([...first5]);
  const russianSlots = shuffleArray([...first5]);

  // Остальные карточки - просто очередь
  const cardQueue = cards.slice(5);

  return { serbianSlots, russianSlots, cardQueue };
}

/**
 * Заменить угаданную карточку
 *
 * Алгоритм:
 * - Берём 2 карточки из очереди (card1 и card2)
 * - card1 встаёт на место угаданного сербского слова
 * - card2 встаёт на место угаданного русского слова
 * - Возвращаем обновлённые слоты и остаток очереди
 */
export function replaceCardInSlots(
  cardId: number,
  cardQueue: CardData[],
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[]
): {
  newSerbianSlots: (CardData | null)[];
  newRussianSlots: (CardData | null)[];
  newCardQueue: CardData[];
} {
  const newSerbianSlots = [...serbianSlots];
  const newRussianSlots = [...russianSlots];
  let newCardQueue = [...cardQueue];

  // Находим индексы угаданной карточки
  const serbianIdx = serbianSlots.findIndex(c => c?.id === cardId);
  const russianIdx = russianSlots.findIndex(c => c?.id === cardId);

  // Берём 2 карточки из очереди
  const card1 = newCardQueue[0];
  const card2 = newCardQueue[1];

  if (card1 && card2) {
    // Есть 2 карточки - ставим их на места угаданных
    if (serbianIdx !== -1) {
      newSerbianSlots[serbianIdx] = card1;
    }
    if (russianIdx !== -1) {
      newRussianSlots[russianIdx] = card2;
    }
    newCardQueue = newCardQueue.slice(2);
  } else if (card1) {
    // Осталась 1 карточка - ставим её в один из слотов, другой очищаем
    if (serbianIdx !== -1) {
      newSerbianSlots[serbianIdx] = card1;
    }
    if (russianIdx !== -1) {
      newRussianSlots[russianIdx] = null;
    }
    newCardQueue = [];
  } else {
    // Очередь пуста - просто убираем карточки
    if (serbianIdx !== -1) {
      newSerbianSlots[serbianIdx] = null;
    }
    if (russianIdx !== -1) {
      newRussianSlots[russianIdx] = null;
    }
  }

  return { newSerbianSlots, newRussianSlots, newCardQueue };
}

/**
 * Форматирование времени (секунды -> MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
