import { getUniqueWords, allWordSets } from '../words';

const STORAGE_KEY = 'wordmatch_enabled_sets';

export interface CardData {
    id: number;
    serbian: string;
    russian: string;
    visible: boolean;
    fading: boolean;
}

// Элемент очереди: пара карточек, которые добавляются перекрёстно
export interface QueuePair {
    card1: CardData;
    card2: CardData;
}

// Ожидающие "половинки" карточек (сербская или русская часть уже на поле)
export interface PendingHalf {
    card: CardData;
    type: 'serbian' | 'russian'; // какая часть ещё НЕ на поле
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
 * 2. Остальные карточки группируются попарно в очередь
 * 3. При замене - берём пару из очереди и добавляем перекрёстно
 */
export function prepareInitialSlots(cards: CardData[]): {
    serbianSlots: (CardData | null)[];
    russianSlots: (CardData | null)[];
    cardQueue: QueuePair[];
    pendingHalves: PendingHalf[];
} {
    // Первые 5 карточек
    const first5 = cards.slice(0, 5);

    // Перемешиваем позиции отдельно для каждого столбца
    const serbianSlots = shuffleArray([...first5]);
    const russianSlots = shuffleArray([...first5]);

    // Остальные карточки группируем попарно
    const remaining = cards.slice(5);
    const cardQueue: QueuePair[] = [];

    for (let i = 0; i < remaining.length; i += 2) {
        const card1 = remaining[i];
        const card2 = remaining[i + 1];

        if (card1 && card2) {
            cardQueue.push({ card1, card2 });
        } else if (card1) {
            // Нечётное количество - последняя карточка добавляется как пара с самой собой
            // (она появится целиком)
            cardQueue.push({ card1, card2: card1 });
        }
    }

    return { serbianSlots, russianSlots, cardQueue, pendingHalves: [] };
}

/**
 * Заменить угаданную карточку
 *
 * Алгоритм перекрёстной замены:
 * 
 * Пример с 10 карточками:
 * - Начало: карточки 1-5 на поле (позиции перемешаны)
 * - Угадали пару 1: 
 *   - На место сербского слова 1 ставим сербское слово 6
 *   - На место русского слова 1 ставим русское слово 7
 *   - Теперь карточка 6 "ждёт" свой русский перевод, а 7 - свой сербский
 * - Угадали следующую пару (например 3):
 *   - На место сербского слова 3 ставим сербское слово 7 (из ожидающих)
 *   - На место русского слова 3 ставим русское слово 6 (из ожидающих)
 *   - Теперь карточки 6 и 7 полностью на поле
 * - И так далее...
 * 
 * Последняя пара (если нечётное количество после первых 5) добавляется целиком.
 */
export function replaceCardInSlots(
    cardId: number,
    cardQueue: QueuePair[],
    pendingHalves: PendingHalf[],
    serbianSlots: (CardData | null)[],
    russianSlots: (CardData | null)[]
): {
    newSerbianSlots: (CardData | null)[];
    newRussianSlots: (CardData | null)[];
    newCardQueue: QueuePair[];
    newPendingHalves: PendingHalf[];
} {
    const newSerbianSlots = [...serbianSlots];
    const newRussianSlots = [...russianSlots];
    let newCardQueue = [...cardQueue];
    let newPendingHalves = [...pendingHalves];

    // Находим индексы угаданной карточки
    const serbianIdx = serbianSlots.findIndex(c => c?.id === cardId);
    const russianIdx = russianSlots.findIndex(c => c?.id === cardId);

    // Проверяем, есть ли ожидающие половинки
    const pendingSerbianIdx = newPendingHalves.findIndex(p => p.type === 'serbian');
    const pendingRussianIdx = newPendingHalves.findIndex(p => p.type === 'russian');

    if (pendingSerbianIdx !== -1 && pendingRussianIdx !== -1) {
        // Есть обе ожидающие половинки - добавляем их
        const pendingSerbian = newPendingHalves[pendingSerbianIdx];
        const pendingRussian = newPendingHalves[pendingRussianIdx];

        if (serbianIdx !== -1) {
            newSerbianSlots[serbianIdx] = pendingSerbian.card;
        }
        if (russianIdx !== -1) {
            newRussianSlots[russianIdx] = pendingRussian.card;
        }

        // Убираем использованные половинки
        newPendingHalves = newPendingHalves.filter((_, i) =>
            i !== pendingSerbianIdx && i !== pendingRussianIdx
        );
    } else if (newCardQueue.length > 0) {
        // Берём пару из очереди
        const pair = newCardQueue[0];
        newCardQueue = newCardQueue.slice(1);

        if (pair.card1.id === pair.card2.id) {
            // Это последняя одиночная карточка - добавляем целиком
            if (serbianIdx !== -1) {
                newSerbianSlots[serbianIdx] = pair.card1;
            }
            if (russianIdx !== -1) {
                newRussianSlots[russianIdx] = pair.card1;
            }
        } else {
            // Перекрёстная замена:
            // - card1.serbian на место сербского
            // - card2.russian на место русского
            if (serbianIdx !== -1) {
                newSerbianSlots[serbianIdx] = pair.card1;
            }
            if (russianIdx !== -1) {
                newRussianSlots[russianIdx] = pair.card2;
            }

            // Добавляем ожидающие половинки:
            // - card1 ждёт свой russian
            // - card2 ждёт свой serbian
            newPendingHalves.push({ card: pair.card1, type: 'russian' });
            newPendingHalves.push({ card: pair.card2, type: 'serbian' });
        }
    } else {
        // Очередь пуста и нет ожидающих - просто убираем карточки
        if (serbianIdx !== -1) {
            newSerbianSlots[serbianIdx] = null;
        }
        if (russianIdx !== -1) {
            newRussianSlots[russianIdx] = null;
        }
    }

    return { newSerbianSlots, newRussianSlots, newCardQueue, newPendingHalves };
}

/**
 * Форматирование времени (секунды -> MM:SS)
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
