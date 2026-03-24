import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header, WordCard } from "../components";
import type { CardData, QueuePair } from "../utils";
import {
  prepareGameWords,
  createQueue,
  initialiseGame,
  replaceCardInSlots,
  // findCardByBoardId,
  isCrossColumnPick,
  isWordMatch,
  setCardsStatusByBoardIds,
  areAllSlotsCleared,
  formatTime,
  getAssetPath,
  setCardStatusByBoardId,
} from "../utils";

type GameState = "setup" | "playing" | "victory" | "defeat";

export function Quiz() {
  const navigate = useNavigate();

  // Настройки игры
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(120); // 2 минуты
  const [cardCount, setCardCount] = useState(60);

  // Состояние игры
  const [gameState, setGameState] = useState<GameState>("setup");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);

  const [cardQueue, setCardQueue] = useState<QueuePair[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [serbianSlots, setSerbianSlots] = useState<(CardData | null)[]>([]);
  const [russianSlots, setRussianSlots] = useState<(CardData | null)[]>([]);

  // Таймер
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);

      if (timerEnabled) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameState("defeat");
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
      alert("Выберите хотя бы один набор слов в настройках!");
      return;
    }

    const gameQueue = createQueue(words);
    const {
      serbianSlots: initialSerbian,
      russianSlots: initialRussian,
      cardQueue: queue,
    } = initialiseGame(gameQueue);

    setSerbianSlots(initialSerbian);
    setRussianSlots(initialRussian);
    setCardQueue(queue);
    setSelectedCard(null);

    setTimeRemaining(timeLimit);
    setElapsedTime(0);
    setMaxCombo(0);
    setCompletedCards(0);
    setGameState("playing");
  }, [cardCount, timeLimit]);

  // Заменить угаданные карточки на новые из очереди
  const replaceCard = useCallback(
    (card1BoardId: number, card2BoardId: number) => {
      const result = replaceCardInSlots(
        card1BoardId,
        card2BoardId,
        cardQueue,
        serbianSlots,
        russianSlots,
      );

      setSerbianSlots(result.newSerbianSlots);
      setRussianSlots(result.newRussianSlots);

      setCardQueue(result.newCardQueue);

      if (
        result.newCardQueue.length === 0 &&
        areAllSlotsCleared(result.newSerbianSlots, result.newRussianSlots)
      ) {
        setGameState("victory");
      }
    },
    [cardQueue, serbianSlots, russianSlots],
  );

  const handleCardClick = useCallback(
    (card: CardData) => {
      if ( card.board_id === null || card.status === "matched") {
        return;
      }

      if (!selectedCard) {
        // Если это первый выбор, просто сохраняем его
        const result = setCardStatusByBoardId(
          card.board_id,
          "selected",
          serbianSlots,
          russianSlots,
        );
        setSerbianSlots(result.newSerbianSlots);
        setRussianSlots(result.newRussianSlots);
        setSelectedCard(card);
      }
      else if (card.board_id === selectedCard.board_id) {
        // Если кликнули по той же карточке, снимаем выбор
        const result = setCardStatusByBoardId(
          card.board_id,
          "normal",
          serbianSlots,
          russianSlots,
        );
        setSerbianSlots(result.newSerbianSlots);
        setRussianSlots(result.newRussianSlots);
        setSelectedCard(null);
      }
      else if (card.column === selectedCard.column) {
        // Если выбрали карточку из того же столбца, переключаем выбор на неё
        const prev: CardData = selectedCard;
        const resetPrevResult = setCardStatusByBoardId(
          prev.board_id,
          "normal",
          serbianSlots,
          russianSlots,
        );
        const setCurrentResult = setCardStatusByBoardId(
          card.board_id,
          "selected",
          resetPrevResult.newSerbianSlots,
          resetPrevResult.newRussianSlots,
        );
        setSerbianSlots(setCurrentResult.newSerbianSlots);
        setRussianSlots(setCurrentResult.newRussianSlots);
        setSelectedCard(card);
      } else {
        if (isCrossColumnPick(card, selectedCard)) {
          if (isWordMatch(card, selectedCard)) {
            // Правильная пара
            const boardIds = [card.board_id, selectedCard.board_id].filter(
              (id): id is number => id !== null,
            );
            const matchedResult = setCardsStatusByBoardIds(
              boardIds,
              "matched",
              serbianSlots,
              russianSlots,
            );
            setSerbianSlots(matchedResult.newSerbianSlots);
            setRussianSlots(matchedResult.newRussianSlots);
            setCompletedCards((prev) => prev + 1);
            setMaxCombo((prev) => prev + 1);
            setSelectedCard(null);

            setTimeout(() => {
              // Заменяем угаданные карточки новыми из очереди
              replaceCard(card.board_id!, selectedCard.board_id!);
            }, 500);

          } else {
            // Неправильная пара
            const boardIds = [card.board_id, selectedCard.board_id].filter(
              (id): id is number => id !== null,
            );
            const mismatchResult = setCardsStatusByBoardIds(
              boardIds,
              "mismatched",
              serbianSlots,
              russianSlots,
            );
            setSerbianSlots(mismatchResult.newSerbianSlots);
            setRussianSlots(mismatchResult.newRussianSlots);
            setMaxCombo(0);
            setSelectedCard(null);

            // Сбрасываем статус обратно через 300ms
            setTimeout(() => {
              const resetResult = setCardsStatusByBoardIds(
                boardIds,
                "normal",
                serbianSlots,
                russianSlots,
              );
              setSerbianSlots(resetResult.newSerbianSlots);
              setRussianSlots(resetResult.newRussianSlots);
            }, 300);
          }
        }
      }
    },
    [
      selectedCard,
      serbianSlots,
      russianSlots,
      replaceCard,
    ],
  );

  // Экран настроек
  if (gameState === "setup") {
    return (
      <div className="min-h-screen bg-background text-text">
        <Header />

        <div className="flex px-4 py-8 justify-between items-center flex-row w-full">
          <button
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={() => navigate("/")}
            className="text-accent bg-secondary hover:bg-hover rounded-lg
                        transition-colors flex items-center justify-center"
          >
            <img
              src={getAssetPath("/icons/undo.svg")}
              alt="go_back"
              className="h-12 w-12"
            />
          </button>
          <h1 className="text-2xl font-bold text-center flex-1">Найди пару</h1>
          <div className="h-8 w-8"></div>
        </div>

        <div className="max-w-md md:max-w-xl mx-auto space-y-4 md:space-y-5 px-4 md:px-6 mt-8">
          {/* Настройка таймера */}
          <div className="bg-secondary p-5 md:p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg md:text-xl">Таймер</span>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className="w-14 md:w-16 h-8 md:h-9 rounded-full transition-colors relative bg-primary"
              >
                <div
                  className={`absolute top-1 w-6 h-6 md:w-7 md:h-7 bg-white rounded-full transition-transform shadow-md ${
                    timerEnabled ? "left-7 md:left-8" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between bg-secondary rounded-xl py-3 md:py-4 mt-3 md:mt-4">
              <button
                onClick={() => setTimeLimit((prev) => Math.max(5, prev - 5))}
                className={`w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-xl hover:bg-accent
                          transition-colors text-2xl md:text-3xl font-bold ${timerEnabled ? "" : "opacity-50 cursor-not-allowed"}`}
                disabled={!timerEnabled}
              >
                −
              </button>
              <span
                className={`text-2xl md:text-3xl font-bold ${timerEnabled ? "text-text" : "text-white/50"}`}
              >
                {formatTime(timeLimit)}
              </span>
              <button
                onClick={() => setTimeLimit((prev) => prev + 5)}
                className={`w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-xl hover:bg-accent
                          transition-colors text-2xl md:text-3xl font-bold ${timerEnabled ? "" : "opacity-50 cursor-not-allowed"}`}
                disabled={!timerEnabled}
              >
                +
              </button>
            </div>
          </div>

          {/* Настройка количества карточек */}
          <div className="bg-secondary p-5 md:p-6 rounded-2xl">
            <div className="justify-between mb-4">
              <span className="font-semibold text-lg md:text-xl">
                Количество карточек
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCardCount((prev) => Math.max(10, prev - 10))}
                className="w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-xl
                         hover:bg-accent transition-colors text-2xl md:text-3xl font-bold"
              >
                −
              </button>
              <span className="text-2xl md:text-3xl font-bold text-cyan">
                {cardCount}
              </span>
              <button
                onClick={() => setCardCount((prev) => prev + 10)}
                className="w-12 h-12 md:w-14 md:h-14 bg-white/15 rounded-xl
                         hover:bg-accent transition-colors text-2xl md:text-3xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 md:py-5 bg-secondary text-text rounded-2xl font-bold text-xl md:text-2xl hover:bg-accent transition-colors shadow-lg"
          >
            Играть
          </button>
        </div>
      </div>
    );
  }

  // Экран игры
  if (gameState === "playing") {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col">
        <Header />

        {/* Верхняя панель */}
        <div className="flex px-4 py-8 justify-between items-center flex-row w-full">
          <button
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={() => navigate("/")}
            className="text-accent bg-secondary hover:bg-hover rounded-lg
                        transition-colors flex items-center justify-center"
          >
            <img
              src={getAssetPath("/icons/undo.svg")}
              alt="go_back"
              className="h-12 w-12"
            />
          </button>

          {/* Таймер */}
          <div className="flex-1 text-center">
            {timerEnabled && (
              <span
                className={`font-bold text-xl md:text-2xl ${timeRemaining <= 10 ? "text-error" : ""}`}
              >
                {formatTime(timeRemaining)}
              </span>
            )}
          </div>

          {/* Прогресс */}
          <div className="text-center">
            <span className="font-bold text-xl md:text-2xl">
              {completedCards}/{cardCount}
            </span>
          </div>
        </div>

        {/* Комбо */}
        {/* <div className="px-4 md:px-6 pb-2 text-center">
          <div className="inline-block px-4 py-2 bg-accent/20 rounded-full">
            <span className="text-lg md:text-xl">
              🔥 Комбо: <span className="text-accent font-bold">{combo}</span>
            </span>
          </div>
        </div> */}

        {/* Карточки - по центру */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-6 pb-8">
          <div className="flex gap-3 md:gap-4 w-full max-w-md md:max-w-lg">
            {/* Левый столбец */}
            <div className="flex-1 flex flex-col gap-2 md:gap-3">
              {serbianSlots.map((card, idx) =>
                card ? (
                  <WordCard
                    key={`serbian-${card.board_id}-${idx}`}
                    word={card.words.serbian}
                    Status={card.status}
                    isFading={card.fading}
                    onClick={() => handleCardClick(card)}
                  />
                ) : (
                  <div key={`empty-serbian-${idx}`} className="h-14 md:h-20" />
                ),
              )}
            </div>

            {/* Правый столбец */}
            <div className="flex-1 flex flex-col gap-2 md:gap-3">
              {russianSlots.map((card, idx) =>
                card ? (
                  <WordCard
                    key={`russian-${card.board_id}-${idx}`}
                    word={card.words.russian}
                    Status={card.status}
                    isFading={card.fading}
                    onClick={() => handleCardClick(card)}
                  />
                ) : (
                  <div key={`empty-russian-${idx}`} className="h-14 md:h-20" />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Экран победы/поражения
  return (
    <div className="min-h-screen bg-background text-text p-6 md:p-8 flex flex-col items-center justify-center">
      <div className="text-center max-w-md md:max-w-lg w-full">
        <div className="mb-8 md:mb-10">
          {gameState === "victory" ? (
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8 rounded-full bg-done/20 flex items-center justify-center">
              <svg
                width="48"
                height="48"
                className="md:w-16 md:h-16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#76FF03"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8 rounded-full bg-error/20 flex items-center justify-center">
              <svg
                width="48"
                height="48"
                className="md:w-16 md:h-16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF5252"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          )}
          <h1
            className={`text-4xl md:text-5xl font-bold ${gameState === "victory" ? "text-done" : "text-error"}`}
          >
            {gameState === "victory" ? "Отлично!" : "Время вышло!"}
          </h1>
          {gameState === "victory" && (
            <p className="text-text-secondary mt-2 md:text-lg">
              Все пары найдены!
            </p>
          )}
        </div>

        <div className="bg-primary p-6 md:p-8 rounded-2xl mb-6 md:mb-8 space-y-4 md:space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary md:text-lg">Время</span>
            <span className="font-bold text-xl md:text-2xl">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="h-px bg-card-border" />
          <div className="flex justify-between items-center">
            <span className="text-text-secondary md:text-lg">Пройдено</span>
            <span className="font-bold text-xl md:text-2xl">
              {completedCards}/{cardCount}
            </span>
          </div>
          <div className="h-px bg-card-border" />
          <div className="flex justify-between items-center">
            <span className="text-text-secondary md:text-lg">Макс. комбо</span>
            <span className="font-bold text-xl md:text-2xl text-cyan">
              {maxCombo}x
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          <button
            onClick={startGame}
            className="w-full py-4 md:py-5 bg-cyan text-background rounded-2xl font-bold text-lg md:text-xl hover:bg-cyan/90 transition-colors shadow-lg"
          >
            Играть ещё
          </button>
          <button
            onClick={() => setGameState("setup")}
            className="w-full py-4 md:py-5 bg-primary text-text rounded-2xl font-bold text-lg md:text-xl hover:bg-hover transition-colors border-2 border-card-border"
          >
            Настройки
          </button>
          <button
            onClick={() => void navigate("/")}
            className="w-full py-3 md:py-4 text-text-secondary font-medium md:text-lg hover:text-text transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
