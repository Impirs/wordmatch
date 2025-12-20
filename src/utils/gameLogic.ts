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

// Очередь карточек для добавления попарно
export interface CardQueueItem {
  card: CardData;
  partnerCard: CardData; // Карточка-партнёр (добавляется в другой столбец на другую позицию)
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
 * Подготовить слова для игры
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
 * 3. При замене угаданной пары - сербская карточка встаёт на место сербской,
 *    а русская карточка партнёра встаёт на место русской (и наоборот)
 */
export function prepareInitialSlots(cards: CardData[]): {
  serbianSlots: (CardData | null)[];
  russianSlots: (CardData | null)[];
  cardQueue: CardQueueItem[];
} {
  // Первые 5 карточек
  const first5 = cards.slice(0, 5);
  
  // Перемешиваем позиции отдельно для каждого столбца
  const serbianSlots = shuffleArray([...first5]);
  const russianSlots = shuffleArray([...first5]);
  
  // Остальные карточки группируем попарно
  const remaining = cards.slice(5);
  const cardQueue: CardQueueItem[] = [];
  
  // Группируем по 2 карточки (они будут добавляться с перемешанными позициями)
  for (let i = 0; i < remaining.length; i += 2) {
    const card1 = remaining[i];
    const card2 = remaining[i + 1];
    
    if (card2) {
      // Две карточки - они партнёры (позиции перемешиваются)
      cardQueue.push({ card: card1, partnerCard: card2 });
      cardQueue.push({ card: card2, partnerCard: card1 });
    } else {
      // Последняя одиночная карточка (если количество нечётное)
      // Добавляем как обычную пару с самой собой
      cardQueue.push({ card: card1, partnerCard: card1 });
    }
  }
  
  return { serbianSlots, russianSlots, cardQueue };
}

/**
 * Заменить угаданную карточку
 * 
 * Новый алгоритм:
 * - При замене берём карточку из очереди
 * - Сербское слово текущей карточки встаёт на место угаданного сербского
 * - Русское слово партнёра встаёт на место угаданного русского
 */
export function replaceCardInSlots(
  cardId: number,
  queueItem: CardQueueItem | undefined,
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[]
): {
  newSerbianSlots: (CardData | null)[];
  newRussianSlots: (CardData | null)[];
} {
  const newSerbianSlots = [...serbianSlots];
  const newRussianSlots = [...russianSlots];
  
  // Находим индексы угаданной карточки
  const serbianIdx = serbianSlots.findIndex(c => c?.id === cardId);
  const russianIdx = russianSlots.findIndex(c => c?.id === cardId);
  
  if (queueItem) {
    // На место сербского слова ставим сербское слово текущей карточки
    if (serbianIdx !== -1) {
      newSerbianSlots[serbianIdx] = queueItem.card;
    }
    // На место русского слова ставим русское слово партнёра
    if (russianIdx !== -1) {
      newRussianSlots[russianIdx] = queueItem.partnerCard;
    }
  } else {
    // Очередь пуста - просто убираем карточки
    if (serbianIdx !== -1) {
      newSerbianSlots[serbianIdx] = null;
    }
    if (russianIdx !== -1) {
      newRussianSlots[russianIdx] = null;
    }
  }
  
  return { newSerbianSlots, newRussianSlots };
}

/**
 * Форматирование времени (секунды -> MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
