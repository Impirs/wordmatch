import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, WordCard, Switcher } from "../components";
import type { CardData, QueuePair } from "../utils";
import {
  prepareGameWords,
  createQueue,
  initGameSettings,
  getGameSettings,
  setGameSettings,
  initialiseGame,
  replaceCardInSlots,
  findCardByBoardId,
  isCrossColumnPick,
  isWordMatch,
  areAllSlotsCleared,
  formatTime,
  getAssetPath,
  setCardStatusByBoardId,
  setCardsStatusByBoardIds,
} from "../utils";

type GameState = "setup" | "playing" | "victory" | "defeat";

type BoardState = {
  selectedBoardId: number | null;
  completedCards: number;
  combo: number;
  maxCombo: number;
  cardQueue: QueuePair[];
  serbianSlots: (CardData | null)[];
  russianSlots: (CardData | null)[];
};

const EMPTY_BOARD_STATE: BoardState = {
  selectedBoardId: null,
  completedCards: 0,
  combo: 0,
  maxCombo: 0,
  cardQueue: [],
  serbianSlots: [],
  russianSlots: [],
};

export function Quiz() {
  const navigate = useNavigate();
  const [storedSettings] = useState(() => {
    initGameSettings();
    return getGameSettings();
  });

  // Настройки игры
  const [timerEnabled, setTimerEnabled] = useState(storedSettings.timerEnabled);
  const [timeLimit, setTimeLimit] = useState(storedSettings.timerLimit);
  const [cardCount, setCardCount] = useState(storedSettings.wordsLimit);
  const [autoLimitWords, setAutoLimitWords] = useState(
    storedSettings.autoLimitWords,
  );
  const [mistakeRepeat, setMistakeRepeat] = useState(
    storedSettings.mistakeRepeat,
  );

  // Состояние игры
  const [gameState, setGameState] = useState<GameState>("setup");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [boardState, setBoardState] = useState<BoardState>(EMPTY_BOARD_STATE);
  const boardStateRef = useRef<BoardState>(EMPTY_BOARD_STATE);
  const timeoutIdsRef = useRef<number[]>([]);

  const { maxCombo, completedCards, serbianSlots, russianSlots } = boardState;

  useEffect(() => {
    setGameSettings({
      timerEnabled,
      timerLimit: timeLimit,
      wordsLimit: cardCount,
      autoLimitWords,
      mistakeRepeat,
    });
  }, [timerEnabled, timeLimit, cardCount, autoLimitWords, mistakeRepeat]);

  const clearPendingTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    timeoutIdsRef.current = [];
  }, []);

  const scheduleBoardUpdate = useCallback(
    (callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (storedId) => storedId !== timeoutId,
        );
        callback();
      }, delay);

      timeoutIdsRef.current.push(timeoutId);
    },
    [],
  );

  useEffect(() => clearPendingTimeouts, [clearPendingTimeouts]);

  // Таймер
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);

      if (timerEnabled) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // console.log("Time's up! Setting game state to defeat.");
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

    clearPendingTimeouts();
    const nextBoardState: BoardState = {
      selectedBoardId: null,
      completedCards: 0,
      combo: 0,
      maxCombo: 0,
      serbianSlots: initialSerbian,
      russianSlots: initialRussian,
      cardQueue: queue,
    };
    boardStateRef.current = nextBoardState;
    setBoardState(nextBoardState);

    setTimeRemaining(timeLimit);
    setElapsedTime(0);
    setGameState("playing");
  }, [cardCount, clearPendingTimeouts, timeLimit]);

  // Заменить угаданные карточки на новые из очереди
  const replaceCard = useCallback(
    (card1BoardId: number, card2BoardId: number) => {
      let shouldSetVictory = false;

      setBoardState((prev) => {
        const result = replaceCardInSlots(
          card1BoardId,
          card2BoardId,
          prev.cardQueue,
          prev.serbianSlots,
          prev.russianSlots,
        );

        shouldSetVictory =
          result.newCardQueue.length === 0 &&
          areAllSlotsCleared(result.newSerbianSlots, result.newRussianSlots);

        if (shouldSetVictory) {
          // console.log("All cards matched! Setting game state to victory.");
          setGameState("victory");
        }

        const nextState = {
          ...prev,
          serbianSlots: result.newSerbianSlots,
          russianSlots: result.newRussianSlots,
          cardQueue: result.newCardQueue,
        };

        boardStateRef.current = nextState;

        return nextState;
      });
    },
    [],
  );

  const handleCardClick = useCallback(
    (boardId: number) => {
      if (gameState !== "playing") {
        return;
      }

      const prev = boardStateRef.current;
      const currentCard = findCardByBoardId(
        boardId,
        prev.serbianSlots,
        prev.russianSlots,
      );

      if (
        !currentCard ||
        currentCard.board_id === null ||
        currentCard.status === "matched" ||
        currentCard.status === "mismatched"
      ) {
        return;
      }

      let nextState: BoardState = prev;
      let boardIdsToReplace: [number, number] | null = null;
      let boardIdsToReset: [number, number] | null = null;

      if (prev.selectedBoardId === null) {
        const result = setCardStatusByBoardId(
          boardId,
          "selected",
          prev.serbianSlots,
          prev.russianSlots,
        );

        nextState = {
          ...prev,
          selectedBoardId: boardId,
          serbianSlots: result.newSerbianSlots,
          russianSlots: result.newRussianSlots,
        };
      } else if (boardId === prev.selectedBoardId) {
        const result = setCardStatusByBoardId(
          boardId,
          "normal",
          prev.serbianSlots,
          prev.russianSlots,
        );

        nextState = {
          ...prev,
          selectedBoardId: null,
          serbianSlots: result.newSerbianSlots,
          russianSlots: result.newRussianSlots,
        };
      } else {
        const selectedCard = findCardByBoardId(
          prev.selectedBoardId,
          prev.serbianSlots,
          prev.russianSlots,
        );

        if (!selectedCard || selectedCard.board_id === null) {
          const result = setCardStatusByBoardId(
            boardId,
            "selected",
            prev.serbianSlots,
            prev.russianSlots,
          );

          nextState = {
            ...prev,
            selectedBoardId: boardId,
            serbianSlots: result.newSerbianSlots,
            russianSlots: result.newRussianSlots,
          };
        } else if (currentCard.column === selectedCard.column) {
          const resetPrevResult = setCardStatusByBoardId(
            selectedCard.board_id,
            "normal",
            prev.serbianSlots,
            prev.russianSlots,
          );
          const setCurrentResult = setCardStatusByBoardId(
            boardId,
            "selected",
            resetPrevResult.newSerbianSlots,
            resetPrevResult.newRussianSlots,
          );

          nextState = {
            ...prev,
            selectedBoardId: boardId,
            serbianSlots: setCurrentResult.newSerbianSlots,
            russianSlots: setCurrentResult.newRussianSlots,
          };
        } else if (isCrossColumnPick(currentCard, selectedCard)) {
          const boardIds: [number, number] = [boardId, prev.selectedBoardId];

          if (isWordMatch(currentCard, selectedCard)) {
            const matchedResult = setCardsStatusByBoardIds(
              boardIds,
              "matched",
              prev.serbianSlots,
              prev.russianSlots,
            );
            const nextCombo = prev.combo + 1;

            nextState = {
              ...prev,
              selectedBoardId: null,
              completedCards: prev.completedCards + 1,
              combo: nextCombo,
              maxCombo: Math.max(prev.maxCombo, nextCombo),
              serbianSlots: matchedResult.newSerbianSlots,
              russianSlots: matchedResult.newRussianSlots,
            };
            boardIdsToReplace = boardIds;
          } else {
            const mismatchResult = setCardsStatusByBoardIds(
              boardIds,
              "mismatched",
              prev.serbianSlots,
              prev.russianSlots,
            );

            nextState = {
              ...prev,
              selectedBoardId: null,
              combo: 0,
              serbianSlots: mismatchResult.newSerbianSlots,
              russianSlots: mismatchResult.newRussianSlots,
            };
            boardIdsToReset = boardIds;
          }
        }
      }

      if (nextState !== prev) {
        boardStateRef.current = nextState;
        setBoardState(nextState);
      }

      if (boardIdsToReplace) {
        scheduleBoardUpdate(() => {
          replaceCard(boardIdsToReplace[0], boardIdsToReplace[1]);
        }, 500);
        return;
      }

      if (!boardIdsToReset) {
        return;
      }

      scheduleBoardUpdate(() => {
        setBoardState((prev) => {
          const resetResult = setCardsStatusByBoardIds(
            boardIdsToReset,
            "normal",
            prev.serbianSlots,
            prev.russianSlots,
          );

          const nextState = {
            ...prev,
            serbianSlots: resetResult.newSerbianSlots,
            russianSlots: resetResult.newRussianSlots,
          };

          boardStateRef.current = nextState;

          return nextState;
        });
      }, 300);
    },
    [gameState, replaceCard, scheduleBoardUpdate],
  );

  // Экран настроек
  if (gameState === "setup") {
    return (
      <div className="h-screen bg-background text-text">
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

        <div className="max-w-md md:max-w-xl mx-auto space-y-4 md:space-y-5 px-4 md:px-6">
          {/* Настройка таймера */}
          <div className="bg-secondary p-5 md:p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg md:text-xl">Таймер</span>
              <Switcher
                enabled={timerEnabled}
                onToggle={() => setTimerEnabled((prev) => !prev)}
              />
            </div>

            <div
              className={`flex items-center justify-between bg-secondary rounded-xl transition-all duration-300
                            ${timerEnabled ? "h-fit py-3 md:py-4 mt-3 md:mt-4 " : "h-0 opacity-0 overflow-hidden"}`}
            >
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
                          transition-colors text-2xl md:text-3xl font-bold
                          ${timerEnabled ? "" : "opacity-50 cursor-not-allowed"}`}
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
            className="bg-secondary p-5 md:p-6 rounded-2xl flex items-center justify-between w-full"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={() => navigate("/settings")}
          >
            <span className="font-semibold text-lg md:text-xl">
              Наборы слов
            </span>
            <img
              src={getAssetPath("/icons/settings.svg")}
              alt="settings"
              className="h-10 w-10 md:h-12 md:w-12 mr-2"
            />
          </button>

          {/* Заглушки настроек (логика будет добавлена позже) */}
          <div className="bg-secondary p-5 md:p-6 rounded-2xl space-y-4 hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-lg md:text-xl">
                  Авто-лимит слов
                </span>
              </div>
              <Switcher
                enabled={autoLimitWords}
                onToggle={() => setAutoLimitWords((prev) => !prev)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-lg md:text-xl">
                  Повторять ошибки
                </span>
              </div>
              <Switcher
                enabled={mistakeRepeat}
                onToggle={() => setMistakeRepeat((prev) => !prev)}
              />
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
                    boardId={card.board_id!}
                    word={card.words.serbian}
                    Status={card.status}
                    isFading={card.fading}
                    onCardClick={handleCardClick}
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
                    boardId={card.board_id!}
                    word={card.words.russian}
                    Status={card.status}
                    isFading={card.fading}
                    onCardClick={handleCardClick}
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
  if (gameState === "victory" || gameState === "defeat") {
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
              <span className="text-text-secondary md:text-lg">
                Макс. комбо
              </span>
              <span className="font-bold text-xl md:text-2xl text-cyan">
                {maxCombo}
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
}
