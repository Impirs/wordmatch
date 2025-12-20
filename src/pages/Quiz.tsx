import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, WordCard } from '../components';
import type { CardData, CardQueueItem } from '../utils';
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
  const [cardCount, setCardCount] = useState(80);
  
  // Состояние игры
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedCard, setSelectedCard] = useState<{ id: number; type: 'serbian' | 'russian' } | null>(null);
  const [errorCards, setErrorCards] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);

  // Очередь карточек с партнёрами (для попарного добавления)
  const [cardQueue, setCardQueue] = useState<CardQueueItem[]>([]);
  
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
    setTimeRemaining(timeLimit);
    setElapsedTime(0);
    setCombo(0);
    setMaxCombo(0);
    setCompletedCards(0);
    setGameState('playing');
  }, [cardCount, timeLimit]);

  // Заменить угаданную карточку на новую из очереди
  const replaceCard = useCallback((cardId: number) => {
    const nextQueueItem = cardQueue[0];
    
    const { newSerbianSlots, newRussianSlots } = replaceCardInSlots(
      cardId,
      nextQueueItem,
      serbianSlots,
      russianSlots
    );
    
    setSerbianSlots(newSerbianSlots);
    setRussianSlots(newRussianSlots);
    
    // Убираем карточку из очереди
    if (nextQueueItem) {
      setCardQueue(prev => prev.slice(1));
    }
  }, [cardQueue, serbianSlots, russianSlots]);

  // Обработка клика по карточке
  const handleCardClick = (card: CardData, type: 'serbian' | 'russian') => {
    // Игнорируем клики по исчезающим карточкам
    if (card.fading) return;
    
    // Очищаем ошибки при новом клике
    setErrorCards(new Set());

    if (!selectedCard) {
      // Первый выбор
      setSelectedCard({ id: card.id, type });
    } else if (selectedCard.id === card.id && selectedCard.type === type) {
      // Клик по той же карточке - снять выбор
      setSelectedCard(null);
    } else if (selectedCard.type === type) {
      // Клик по карточке того же типа - сменить выбор
      setSelectedCard({ id: card.id, type });
    } else {
      // Клик по карточке другого типа - проверяем пару
      if (selectedCard.id === card.id) {
        // Правильная пара!
        const newCompletedCount = completedCards + 1;
        setCompletedCards(newCompletedCount);
        setCombo(prev => {
          const newCombo = prev + 1;
          setMaxCombo(current => Math.max(current, newCombo));
          return newCombo;
        });

        // Помечаем карточки как исчезающие
        setSerbianSlots(prev => prev.map(c => 
          c?.id === card.id ? { ...c, fading: true } : c
        ));
        setRussianSlots(prev => prev.map(c => 
          c?.id === card.id ? { ...c, fading: true } : c
        ));

        // Через 450мс заменяем на новые или проверяем победу
        setTimeout(() => {
          if (newCompletedCount >= cardCount) {
            // Все карточки пройдены!
            setGameState('victory');
          } else {
            replaceCard(card.id);
          }
        }, 450);

        setSelectedCard(null);
      } else {
        // Неправильная пара
        setErrorCards(new Set([selectedCard.id, card.id]));
        setCombo(0);
        setSelectedCard(null);
      }
    }
  };

  // Экран настроек
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-background text-text">
        <Header />

        <div className="flex px-4 py-4 justify-between items-center flex-row w-full">
            <button
              onClick={() => navigate('/')}
              className="text-accent bg-secondary hover:bg-hover rounded-lg
                        transition-colors flex items-center justify-center"
            >
                <img src="/icons/undo.svg" alt="go_back" className="h-12 w-12" />
            </button>
            <h1 className="text-3xl font-bold text-center flex-1">Найди пару</h1>
            <div className="h-12 w-12"></div>
        </div>
        {/* <button
                onClick={() => navigate('/settings')}
                className="p-2 bg-primary rounded-lg hover:bg-hover transition-colors"
                title="Настройки"
              >
                <img src="/icons/settings.svg" alt="Настройки" className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/info')}
                className="p-2 bg-primary rounded-lg hover:bg-hover transition-colors"
                title="Информация"
              >
                <img src="/icons/info.svg" alt="Информация" className="h-5 w-5" />
              </button> */}

        <div className="max-w-md mx-auto space-y-6 px-4">
          {/* Настройка таймера */}
          <div className="bg-primary p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Таймер</span>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  timerEnabled ? 'bg-accent' : 'bg-secondary'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  timerEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            
            {timerEnabled && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setTimeLimit(prev => Math.max(5, prev - 5))}
                  className="w-10 h-10 bg-secondary rounded-lg hover:bg-hover transition-colors text-xl"
                >
                  -
                </button>
                <span className="text-xl font-bold">{formatTime(timeLimit)}</span>
                <button
                  onClick={() => setTimeLimit(prev => prev + 5)}
                  className="w-10 h-10 bg-secondary rounded-lg hover:bg-hover transition-colors text-xl"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Настройка количества карточек */}
          <div className="bg-primary p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Количество карточек</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCardCount(prev => Math.max(10, prev - 10))}
                className="w-10 h-10 bg-secondary rounded-lg hover:bg-hover transition-colors text-xl"
              >
                -
              </button>
              <span className="text-xl font-bold">{cardCount}</span>
              <button
                onClick={() => setCardCount(prev => prev + 10)}
                className="w-10 h-10 bg-secondary rounded-lg hover:bg-hover transition-colors text-xl"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-accent text-white rounded-lg font-bold text-lg hover:bg-accent/80 transition-colors shadow-lg"
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
      <div className="min-h-screen bg-background text-text p-4 flex flex-col">
        {/* Хедер с информацией */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">
            <span className="text-text-secondary">Пройдено: </span>
            <span className="font-bold">{completedCards}/{cardCount}</span>
          </div>
          {timerEnabled && (
            <div className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-error' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
          )}
          <div className="text-sm">
            <span className="text-text-secondary">Комбо: </span>
            <span className="font-bold text-accent">{combo}</span>
          </div>
        </div>

        {/* Карточки */}
        <div className="flex-1 flex gap-4">
          {/* Левый столбец - сербские */}
          <div className="flex-1 flex flex-col gap-2">
            {serbianSlots.map((card, idx) => (
              card ? (
                <WordCard
                  key={`serbian-${card.id}-${idx}`}
                  word={card.serbian}
                  isSelected={selectedCard?.id === card.id && selectedCard.type === 'serbian'}
                  isError={errorCards.has(card.id)}
                  isFading={card.fading}
                  onClick={() => handleCardClick(card, 'serbian')}
                />
              ) : (
                <div key={`empty-serbian-${idx}`} className="flex-1" />
              )
            ))}
          </div>

          {/* Правый столбец - русские */}
          <div className="flex-1 flex flex-col gap-2">
            {russianSlots.map((card, idx) => (
              card ? (
                <WordCard
                  key={`russian-${card.id}-${idx}`}
                  word={card.russian}
                  isSelected={selectedCard?.id === card.id && selectedCard.type === 'russian'}
                  isError={errorCards.has(card.id)}
                  isFading={card.fading}
                  onClick={() => handleCardClick(card, 'russian')}
                />
              ) : (
                <div key={`empty-russian-${idx}`} className="flex-1" />
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Экран победы/поражения
  return (
    <div className="min-h-screen bg-background text-text p-6 flex flex-col items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-6">
          {gameState === 'victory' ? (
            <img src="/icons/confetti.svg" alt="" className="h-16 w-16 mx-auto mb-4" />
          ) : (
            <img src="/icons/star.svg" alt="" className="h-16 w-16 mx-auto mb-4 opacity-50" />
          )}
          <h1 className={`text-4xl font-bold ${gameState === 'victory' ? 'text-done' : 'text-error'}`}>
            {gameState === 'victory' ? 'Победа!' : 'Время вышло!'}
          </h1>
        </div>

        <div className="bg-primary p-6 rounded-lg mb-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Время:</span>
            <span className="font-bold">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Пройдено карточек:</span>
            <span className="font-bold">{completedCards}/{cardCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Макс. комбо:</span>
            <span className="font-bold text-accent">{maxCombo}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={startGame}
            className="flex-1 py-3 bg-accent text-white rounded-lg font-bold hover:bg-accent/80 transition-colors"
          >
            Играть ещё
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-primary text-text rounded-lg font-bold hover:bg-hover transition-colors"
          >
            Домой
          </button>
        </div>
      </div>
    </div>
  );
}
