import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, WordCard } from '../components';
import type { CardData } from '../utils';
import {
  prepareGameWords,
  createCards,
  prepareInitialSlots,
  replaceCardInSlots,
  formatTime,
} from '../utils';

type GameState = 'setup' | 'playing' | 'victory' | 'defeat';

export function Quiz() {
  const navigate = useNavigate();

  // Настройки игры
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(120); // 2 минуты
  const [cardCount, setCardCount] = useState(60);

  // Состояние игры
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedCard, setSelectedCard] = useState<{ id: number; type: 'serbian' | 'russian' } | null>(null);
  const [errorCards, setErrorCards] = useState<Set<number>>(new Set());
  const [correctCards, setCorrectCards] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);

  // Для отзывчивости: отслеживаем карточки в процессе исчезновения
  const [fadingCards, setFadingCards] = useState<Set<number>>(new Set());

  // Очередь карточек (простой массив CardData)
  const [cardQueue, setCardQueue] = useState<CardData[]>([]);

  // Текущие 5 отображаемых слотов (сербские)
  const [serbianSlots, setSerbianSlots] = useState<(CardData | null)[]>([]);
  // Текущие 5 отображаемых слотов (русские)
  const [russianSlots, setRussianSlots] = useState<(CardData | null)[]>([]);

  // Таймер
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);

      if (timerEnabled) {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameState('defeat');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timerEnabled]);

  // Начать игру
  const startGame = useCallback(() => {
    const words = prepareGameWords(cardCount);

    if (!words) {
      alert('Выберите хотя бы один набор слов в настройках!');
      return;
    }

    const gameCards = createCards(words);
    const { serbianSlots: initialSerbian, russianSlots: initialRussian, cardQueue: queue } =
      prepareInitialSlots(gameCards);

    setSerbianSlots(initialSerbian);
    setRussianSlots(initialRussian);
    setCardQueue(queue);

    setSelectedCard(null);
    setErrorCards(new Set());
    setCorrectCards(new Set());
    setTimeRemaining(timeLimit);
    setElapsedTime(0);
    setCombo(0);
    setMaxCombo(0);
    setCompletedCards(0);
    setFadingCards(new Set());
    setGameState('playing');
  }, [cardCount, timeLimit]);

  // Заменить угаданную карточку на новую из очереди
  const replaceCard = useCallback((cardId: number) => {
    const { newSerbianSlots, newRussianSlots, newCardQueue } = replaceCardInSlots(
      cardId,
      cardQueue,
      serbianSlots,
      russianSlots
    );

    setSerbianSlots(newSerbianSlots);
    setRussianSlots(newRussianSlots);
    setCardQueue(newCardQueue);
  }, [cardQueue, serbianSlots, russianSlots]);

  // Обработка клика по карточке
  const handleCardClick = useCallback((card: CardData, type: 'serbian' | 'russian') => {
    // Игнорируем клики по исчезающим карточкам
    if (fadingCards.has(card.id)) return;

    // Очищаем ошибки при новом клике (быстрее через функцию)
    setErrorCards(prev => prev.size > 0 ? new Set() : prev);
    setCorrectCards(prev => prev.size > 0 ? new Set() : prev);

    setSelectedCard(prevSelected => {
      if (!prevSelected) {
        // Первый выбор
        return { id: card.id, type };
      } else if (prevSelected.id === card.id && prevSelected.type === type) {
        // Клик по той же карточке - снять выбор
        return null;
      } else if (prevSelected.type === type) {
        // Клик по карточке того же типа - сменить выбор
        return { id: card.id, type };
      } else {
        // Клик по карточке другого типа - проверяем пару
        if (prevSelected.id === card.id) {
          // Правильная пара! Обрабатываем синхронно для отзывчивости
          setFadingCards(prev => new Set([...prev, card.id]));

          // Помечаем как правильные для визуального фидбека
          setCorrectCards(new Set([card.id]));

          setCompletedCards(prev => {
            const newCount = prev + 1;

            // Запускаем замену/победу с небольшой задержкой для анимации
            setTimeout(() => {
              setFadingCards(prev => {
                const next = new Set(prev);
                next.delete(card.id);
                return next;
              });
              setCorrectCards(new Set());

              if (newCount >= cardCount) {
                setGameState('victory');
              } else {
                // Помечаем карточки как исчезающие
                setSerbianSlots(slots => slots.map(c =>
                  c?.id === card.id ? { ...c, fading: true } : c
                ));
                setRussianSlots(slots => slots.map(c =>
                  c?.id === card.id ? { ...c, fading: true } : c
                ));

                // Заменяем карточки
                setTimeout(() => {
                  replaceCard(card.id);
                }, 250);
              }
            }, 300);

            return newCount;
          });

          setCombo(prev => {
            const newCombo = prev + 1;
            setMaxCombo(current => Math.max(current, newCombo));
            return newCombo;
          });

          return null;
        } else {
          // Неправильная пара
          setErrorCards(new Set([prevSelected.id, card.id]));
          setCombo(0);

          // Автоматически убираем ошибку через короткое время
          setTimeout(() => {
            setErrorCards(new Set());
          }, 400);

          return null;
        }
      }
    });
  }, [cardCount, replaceCard, fadingCards]);

  // Экран настроек
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-background text-text">
        <Header />

        <div className="flex px-4 py-8 justify-between items-center flex-row w-full">
            <button
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={() => navigate('/')}
              className="text-accent bg-secondary hover:bg-hover rounded-lg
                        transition-colors flex items-center justify-center"
            >
              <img src="/icons/undo.svg" alt="go_back" className="h-12 w-12" />
            </button>
            <h1 className="text-2xl font-bold text-center flex-1">Найди пару</h1>
            <div className="h-8 w-8"></div>
        </div>

        <div className="max-w-md mx-auto space-y-4 px-4 mt-8 ">
          {/* Настройка таймера */}
          <div className="bg-secondary p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Таймер</span>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className="w-14 h-8 rounded-full transition-colors relative bg-primary"
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                  timerEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {timerEnabled && (
              <div className="flex items-center justify-between bg-secondary rounded-xl p-3 mt-3">
                <button
                  onClick={() => setTimeLimit(prev => Math.max(5, prev - 5))}
                  className="w-12 h-12 bg-white/15 rounded-xl hover:bg-accent transition-colors text-2xl font-bold"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-cyan">{formatTime(timeLimit)}</span>
                <button
                  onClick={() => setTimeLimit(prev => prev + 5)}
                  className="w-12 h-12 bg-white/15 rounded-xl hover:bg-accent transition-colors text-2xl font-bold"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Настройка количества карточек */}
          <div className="bg-secondary p-5 rounded-2xl">
            <div className="justify-between mb-4">
              <span className="font-semibold text-lg">Количество карточек</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCardCount(prev => Math.max(10, prev - 10))}
                className="w-12 h-12 bg-white/15 rounded-xl hover:bg-accent transition-colors text-2xl font-bold"
              >
                −
              </button>
              <span className="text-2xl font-bold text-cyan">{cardCount}</span>
              <button
                onClick={() => setCardCount(prev => prev + 10)}
                className="w-12 h-12 bg-white/15 rounded-xl hover:bg-accent transition-colors text-2xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-secondary text-text rounded-2xl font-bold text-xl hover:bg-accent transition-colors shadow-lg"
          >
            Играть
          </button>
        </div>
      </div>
    );
  }

  // Экран игры
  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col">
        {/* Верхняя панель */}
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Кнопка закрытия */}
          <button
            onClick={() => setGameState('setup')}
            className="text-text-secondary hover:text-text transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Прогресс */}
          <div className="flex-1 text-center">
            <span className="font-bold text-xl">{completedCards}/{cardCount}</span>
          </div>

          {/* Таймер */}
          {timerEnabled && (
            <span className={`font-bold text-xl ${timeRemaining <= 10 ? 'text-error' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          )}
        </div>

        {/* Комбо */}
        <div className="px-4 pb-2">
          <span className="text-text-secondary text-lg">Комбо: <span className="text-accent font-bold">{combo}</span></span>
        </div>

        {/* Карточки - по центру */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="flex gap-3 w-full max-w-md">
            {/* Левый столбец */}
            <div className="flex-1 flex flex-col gap-2">
              {serbianSlots.map((card, idx) => (
                card ? (
                  <WordCard
                    key={`serbian-${card.id}-${idx}`}
                    word={card.serbian}
                    isSelected={selectedCard?.id === card.id && selectedCard.type === 'serbian'}
                    isError={errorCards.has(card.id)}
                    isCorrect={correctCards.has(card.id)}
                    isFading={card.fading || fadingCards.has(card.id)}
                    onClick={() => handleCardClick(card, 'serbian')}
                  />
                ) : (
                  <div key={`empty-serbian-${idx}`} className="h-14" />
                )
              ))}
            </div>

            {/* Правый столбец */}
            <div className="flex-1 flex flex-col gap-2">
              {russianSlots.map((card, idx) => (
                card ? (
                  <WordCard
                    key={`russian-${card.id}-${idx}`}
                    word={card.russian}
                    isSelected={selectedCard?.id === card.id && selectedCard.type === 'russian'}
                    isError={errorCards.has(card.id)}
                    isCorrect={correctCards.has(card.id)}
                    isFading={card.fading || fadingCards.has(card.id)}
                    onClick={() => handleCardClick(card, 'russian')}
                  />
                ) : (
                  <div key={`empty-russian-${idx}`} className="h-14" />
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Экран победы/поражения
  return (
    <div className="min-h-screen bg-background text-text p-6 flex flex-col items-center justify-center">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          {gameState === 'victory' ? (
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-done/20 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#76FF03" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          )}
          <h1 className={`text-4xl font-bold ${gameState === 'victory' ? 'text-done' : 'text-error'}`}>
            {gameState === 'victory' ? 'Отлично!' : 'Время вышло!'}
          </h1>
          {gameState === 'victory' && (
            <p className="text-text-secondary mt-2">Все пары найдены!</p>
          )}
        </div>

        <div className="bg-primary p-6 rounded-2xl mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Время</span>
            <span className="font-bold text-xl">{formatTime(elapsedTime)}</span>
          </div>
          <div className="h-px bg-card-border" />
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Пройдено</span>
            <span className="font-bold text-xl">{completedCards}/{cardCount}</span>
          </div>
          <div className="h-px bg-card-border" />
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Макс. комбо</span>
            <span className="font-bold text-xl text-cyan">{maxCombo}x</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={startGame}
            className="w-full py-4 bg-cyan text-background rounded-2xl font-bold text-lg hover:bg-cyan/90 transition-colors shadow-lg"
          >
            Играть ещё
          </button>
          <button
            onClick={() => setGameState('setup')}
            className="w-full py-4 bg-primary text-text rounded-2xl font-bold text-lg hover:bg-hover transition-colors border-2 border-card-border"
          >
            Настройки
          </button>
          <button
            onClick={() => void navigate('/')}
            className="w-full py-3 text-text-secondary font-medium hover:text-text transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
