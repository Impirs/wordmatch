import type { CardData, QueuePair } from "./gameHelpers";
import { shuffleArray } from "./functions";
import { swapCards } from "./gameHelpers";

/**
 * Подготовить очередь слов для игры
 *
 * Алгоритм:
 * 1. Получаем все слова непопавшие в начальные слоты - очередь
 * 2. Перемешиваем очередь, меняя карточки для переводов попарно,
 *    чтобы слово и его перевод появлялись не одновременно, а с задержкой в слово
 * 3. Проходим по всему массиву, кроме последней пары и возвращаем готовую очередь
 *
 * 30 слов = 30 пар = 5 на экране + 25 в очереди => 24 попарных смены + 1
 * 40 слов = 40 пар = 5 на экране + 35 в очереди => 34 попарных смены + 1
 *
 * Функция логики выбора карточек из следующих пар во время игры
 * чтобы пары не появлялись на месте предыдущей, а менялись перекрестно
 * во время игры, заставляя пользователя вспоминать други слова, а не
 * запоминать расположение карточек или какие либо шаблоны.
 */
export function crissCrossLogic(queue: QueuePair[]): {
  currentQueue: QueuePair[];
} {
  const currentQueue = [...queue];
  for (let i = 0; i < currentQueue.length - 3; i += 2) {
    const [newPair1, newPair2] = swapCards(
      currentQueue[i],
      currentQueue[i + 1],
    );
    currentQueue[i] = newPair1;
    currentQueue[i + 1] = newPair2;
  }

  return { currentQueue };
}

/**
 * Находит карточку по board_id на доске.
 */
export function findCardByBoardId(
  boardId: number,
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[],
): CardData | null {
  return (
    serbianSlots.find((card) => card?.board_id === boardId) ??
    russianSlots.find((card) => card?.board_id === boardId) ??
    null
  );
}

/**
 * Проверяет, что карты выбраны из разных колонок.
 */
export function isCrossColumnPick(card1: CardData, card2: CardData): boolean {
  return card1.column !== card2.column;
}

/**
 * Проверяет, являются ли 2 карточки одной парой по словам.
 */
export function isWordMatch(card1: CardData, card2: CardData): boolean {
  return (
    card1.words.serbian === card2.words.serbian &&
    card1.words.russian === card2.words.russian
  );
}

export function setCardStatusByBoardId(
  boardId: CardData["board_id"],
  status: CardData["status"],
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[],
): {
  newSerbianSlots: (CardData | null)[];
  newRussianSlots: (CardData | null)[];
} {
  const newSerbianSlots = serbianSlots.map((card) => {
    if (!card || card.board_id !== boardId) {
      return card;
    }
    return {
      ...card,
      status,
    };
  });

  const newRussianSlots = russianSlots.map((card) => {
    if (!card || card.board_id !== boardId) {
      return card;
    }
    return {
      ...card,
      status,
    };
  });

  return { newSerbianSlots, newRussianSlots };
}

/**
 * Возвращает копии слотов, где карты с указанными board_id получают нужный статус.
 */
export function setCardsStatusByBoardIds(
  boardIds: number[],
  status: CardData["status"],
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[],
): {
  newSerbianSlots: (CardData | null)[];
  newRussianSlots: (CardData | null)[];
} {
  const targetIds = new Set(boardIds);
  const matched = status === "matched" ? true : false;

  const newSerbianSlots = serbianSlots.map((card) => {
    if (!card || !targetIds.has(card.board_id ?? -1)) {
      return card;
    }
    return { ...card, status, fading: matched };
  });

  const newRussianSlots = russianSlots.map((card) => {
    if (!card || !targetIds.has(card.board_id ?? -1)) {
      return card;
    }
    return { ...card, status, fading: matched };
  });

  return { newSerbianSlots, newRussianSlots };
}

/**
 * Проверяет, очищено ли все поле (конец игры).
 */
export function areAllSlotsCleared(
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[],
): boolean {
  return (
    serbianSlots.every((card) => card === null) &&
    russianSlots.every((card) => card === null)
  );
}

/**
 * Подготовить начальные слоты и очередь для игры.
 * На поле всегда 10 карт: 5 сербских + 5 русских.
 */
export function initialiseGame(queue: QueuePair[]): {
  serbianSlots: (CardData | null)[];
  russianSlots: (CardData | null)[];
  cardQueue: QueuePair[];
} {
  // Первые 5 карточек
  const first5 = queue.slice(0, 5);

  const serbianSlots = shuffleArray(first5.map((pair) => pair.card1)).map(
    (card, index) => ({
      ...card,
      board_id: index * 2,
      column: "serbian" as const,
      status: "normal" as const,
    }),
  );

  const russianSlots = shuffleArray(first5.map((pair) => pair.card2)).map(
    (card, index) => ({
      ...card,
      board_id: index * 2 + 1,
      column: "russian" as const,
      status: "normal" as const,
    }),
  );

  const { currentQueue } = crissCrossLogic(queue.slice(5));
  const cardQueue = currentQueue.map((pair) => ({
    card1: {
      ...pair.card1,
      board_id: null,
      column: "serbian" as const,
      status: "normal" as const,
    },
    card2: {
      ...pair.card2,
      board_id: null,
      column: "russian" as const,
      status: "normal" as const,
    },
  }));

  return { serbianSlots, russianSlots, cardQueue };
}

/**
 * Заменить угаданную пару карт следующей парой из очереди.
 * Если очередь закончилась, слоты очищаются (ставится null).
 */
export function replaceCardInSlots(
  card1BoardId: number,
  card2BoardId: number,
  cardQueue: QueuePair[],
  serbianSlots: (CardData | null)[],
  russianSlots: (CardData | null)[],
): {
  newCardQueue: QueuePair[];
  newSerbianSlots: (CardData | null)[];
  newRussianSlots: (CardData | null)[];
} {
  const newPair = cardQueue[0];
  const newCardQueue = cardQueue.slice(1);

  const serbianBoardId = serbianSlots.some(
    (card) => card?.board_id === card1BoardId,
  )
    ? card1BoardId
    : card2BoardId;
  const russianBoardId = russianSlots.some(
    (card) => card?.board_id === card1BoardId,
  )
    ? card1BoardId
    : card2BoardId;

  if (!newPair) {
    const newSerbianSlots = serbianSlots.map((card) =>
      card?.board_id === serbianBoardId ? null : card,
    );
    const newRussianSlots = russianSlots.map((card) =>
      card?.board_id === russianBoardId ? null : card,
    );

    return { newCardQueue: [], newSerbianSlots, newRussianSlots };
  }

  const newSerbianSlots = serbianSlots.map((card) => {
    if (card?.board_id !== serbianBoardId) {
      return card;
    }

    return {
      ...newPair.card1,
      board_id: card.board_id,
      column: "serbian" as const,
      status: "normal" as const,
      fading: false,
    };
  });

  const newRussianSlots = russianSlots.map((card) => {
    if (card?.board_id !== russianBoardId) {
      return card;
    }

    return {
      ...newPair.card2,
      board_id: card.board_id,
      column: "russian" as const,
      status: "normal" as const,
      fading: false,
    };
  });

  return { newCardQueue, newSerbianSlots, newRussianSlots };
}
