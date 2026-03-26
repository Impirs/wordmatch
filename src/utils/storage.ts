import { allWordSets } from "../words";
import { normalizeText } from "./functions";

const STORAGE_SETS_KEY = "wordmatch_enabled_sets";
const STORAGE_SETTINGS_KEY = "wordmatch_settings";

type BlockStorageKey = "Blok1" | "Blok2" | "Blok3";

/**
 * Тип данных для настроек пользователя, которые будут храниться в localstorage:
 * {
 *   timerEnabled - состояние таймера (вкл/выкл)
 *   timerLimit - количество времени, уделяемое прохождению
 *   wordsLimit - количетво слов, которым нужно подобрать пары для окончания упражнения
 *   autoLimitWords - автоматически рассчитывать количество слов на упражнение
 *   mistakeRepeat - повторять ошибки после окончания задания, для закрепления
 * }
 */
export interface GameSettings {
  timerEnabled: boolean;
  timerLimit: number;
  wordsLimit: number;
  autoLimitWords: boolean;
  mistakeRepeat: boolean;
}

export interface EnabledSetsByBlock {
  Blok1: string[];
  Blok2: string[];
  Blok3: string[];
}

const defaultGameSettings: GameSettings = {
  timerEnabled: false,
  timerLimit: 90,
  wordsLimit: 40,
  autoLimitWords: false,
  mistakeRepeat: false,
};

function getBlockStorageKeyBySetId(setId: string): BlockStorageKey | null {
  if (setId.startsWith("blok-1-")) {
    return "Blok1";
  }

  if (setId.startsWith("blok-2-")) {
    return "Blok2";
  }

  if (setId.startsWith("blok-3-")) {
    return "Blok3";
  }

  return null;
}

function getDefaultEnabledSetsByBlock(): EnabledSetsByBlock {
  const defaultSets: EnabledSetsByBlock = {
    Blok1: ["blok-1-part_1-1"],
    Blok2: [],
    Blok3: [],
  };

  const blok1Sets = allWordSets.filter((set) => set.id.startsWith("blok-1-"));

  const opsteSet = blok1Sets.find((set) => {
    const names = [set.topicNameLat, set.topicNameCyr, set.name].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    return names.some((name) => normalizeText(name) === "opste");
  });

  if (opsteSet) {
    defaultSets.Blok1 = [opsteSet.id];
    return defaultSets;
  }

  if (blok1Sets.length > 0) {
    defaultSets.Blok1 = [blok1Sets[0].id];
  }

  return defaultSets;
}

function normalizeEnabledSetsValue(
  value: unknown,
  defaultValue: EnabledSetsByBlock,
): EnabledSetsByBlock {
  if (!value) {
    return defaultValue;
  }

  if (Array.isArray(value)) {
    const migrated: EnabledSetsByBlock = {
      Blok1: [],
      Blok2: [],
      Blok3: [],
    };

    for (const item of value) {
      if (typeof item !== "string") {
        continue;
      }

      const blockKey = getBlockStorageKeyBySetId(item);
      if (blockKey && !migrated[blockKey].includes(item)) {
        migrated[blockKey].push(item);
      }
    }

    return migrated;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Partial<Record<BlockStorageKey, unknown>>;
    return {
      Blok1: Array.isArray(record.Blok1)
        ? record.Blok1.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      Blok2: Array.isArray(record.Blok2)
        ? record.Blok2.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      Blok3: Array.isArray(record.Blok3)
        ? record.Blok3.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    };
  }

  return defaultValue;
}

function isValidGameSettings(value: unknown): value is GameSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const settings = value as Partial<GameSettings>;
  return (
    typeof settings.timerEnabled === "boolean" &&
    typeof settings.timerLimit === "number" &&
    typeof settings.wordsLimit === "number" &&
    typeof settings.autoLimitWords === "boolean" &&
    typeof settings.mistakeRepeat === "boolean"
  );
}

/**
 * Инициализация настроек в localhost для их сохранения между сессиями.
 */
export function initGameSettings(): void {
  const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
  if (!savedSettings) {
    localStorage.setItem(
      STORAGE_SETTINGS_KEY,
      JSON.stringify(defaultGameSettings),
    );
  } else {
    try {
      const parsed = JSON.parse(savedSettings) as unknown;
      if (!isValidGameSettings(parsed)) {
        localStorage.setItem(
          STORAGE_SETTINGS_KEY,
          JSON.stringify(defaultGameSettings),
        );
      }
    } catch {
      localStorage.setItem(
        STORAGE_SETTINGS_KEY,
        JSON.stringify(defaultGameSettings),
      );
    }
  }

  const savedSets = localStorage.getItem(STORAGE_SETS_KEY);
  const defaultSets = getDefaultEnabledSetsByBlock();

  if (!savedSets) {
    localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(defaultSets));
    return;
  }

  try {
    const parsed = JSON.parse(savedSets) as unknown;
    const normalized = normalizeEnabledSetsValue(parsed, defaultSets);
    localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(normalized));
  } catch {
    localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(defaultSets));
  }
}

export function getGameSettings(): GameSettings {
  initGameSettings();

  const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
  if (!saved) {
    return defaultGameSettings;
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (isValidGameSettings(parsed)) {
      return parsed;
    }
  } catch {
    return defaultGameSettings;
  }

  return defaultGameSettings;
}

export function setGameSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

export function getEnabledSetsByBlock(): EnabledSetsByBlock {
  initGameSettings();

  const defaultSets = getDefaultEnabledSetsByBlock();
  const saved = localStorage.getItem(STORAGE_SETS_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(defaultSets));
    return defaultSets;
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    const normalized = normalizeEnabledSetsValue(parsed, defaultSets);
    localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(defaultSets));
    return defaultSets;
  }
}

export function setEnabledSetsByBlock(value: EnabledSetsByBlock): void {
  localStorage.setItem(STORAGE_SETS_KEY, JSON.stringify(value));
}

/**
 * Получить список включённых наборов из localStorage.
 */
export function getEnabledSets(): string[] {
  const grouped = getEnabledSetsByBlock();
  return [...grouped.Blok1, ...grouped.Blok2, ...grouped.Blok3];
}
