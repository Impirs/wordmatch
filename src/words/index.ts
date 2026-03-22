export { basicWords, basicSetInfo } from "./basic";
export { adjectiveWords, adjectivesSetInfo } from "./adjectives";
export { verbWords, verbsSetInfo } from "./verbs";
export { clothingWords, clothingSetInfo } from "./clothing";
export { itemsWords, itemsSetInfo } from "./items";
export { itemsAdvancedWords, itemsAdvancedSetInfo } from "./itemsAdvanced";
export { relationshipsWords, relationshipsSetInfo } from "./relationships";
export { foodWords, foodSetInfo } from "./food";
export { directionsWords, directionsSetInfo } from "./directions";
export {
  verbsImperfectiveWords,
  verbsImperfectiveSetInfo,
} from "./verbsImperfective";
export {
  verbsPerfectiveWords,
  verbsPerfectiveSetInfo,
} from "./verbsPerfective";

import blok1Data from "./blok_1.json";
import blok2Data from "./blok_2.json";
import blok3Data from "./blok_3.json";
// import { basicWords, basicSetInfo } from './basic';
// import { adjectiveWords, adjectivesSetInfo } from './adjectives';
// import { verbWords, verbsSetInfo } from './verbs';
// import { clothingWords, clothingSetInfo } from './clothing';
// import { itemsWords, itemsSetInfo } from './items';
// import { itemsAdvancedWords, itemsAdvancedSetInfo } from './itemsAdvanced';
// import { relationshipsWords, relationshipsSetInfo } from './relationships';
// import { foodWords, foodSetInfo } from './food';
// import { directionsWords, directionsSetInfo } from './directions';
// import { verbsImperfectiveWords, verbsImperfectiveSetInfo } from './verbsImperfective';
// import { verbsPerfectiveWords, verbsPerfectiveSetInfo } from './verbsPerfective';

export interface WordSet {
  id: string;
  name: string;
  description: string;
  words: [string, string][];
  blockNameLat?: string;
  blockNameCyr?: string;
  partNameLat?: string;
  partNameCyr?: string;
  topicNameLat?: string;
  topicNameCyr?: string;
}

interface JsonEntry {
  sr_lat: string;
  ru: string;
}

interface JsonTopic {
  subtopic?: string;
  subtopic_lat?: string;
  subtopic_cyr?: string;
  name_lat?: string;
  name_cyr?: string;
  entries: JsonEntry[];
}

interface JsonPart {
  title?: string;
  name_lat?: string;
  name_cyr?: string;
  words: JsonTopic[];
}

interface JsonBlock extends Record<string, unknown> {
  block_name_lat?: string;
  block_name_cyr?: string;
}

interface ScriptNames {
  lat: string;
  cyr: string;
}

const BLOCK_NAMES: Record<string, ScriptNames> = {
  "blok-1": { lat: "Blok 1", cyr: "Блок 1" },
  "blok-2": { lat: "Blok 2", cyr: "Блок 2" },
  "blok-3": { lat: "Blok 3", cyr: "Блок 3" },
};

function isJsonEntry(value: unknown): value is JsonEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "sr_lat" in value &&
    typeof value.sr_lat === "string" &&
    "ru" in value &&
    typeof value.ru === "string"
  );
}

function isJsonTopic(value: unknown): value is JsonTopic {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const hasTopicName =
    ("subtopic" in value && typeof value.subtopic === "string") ||
    ("subtopic_lat" in value && typeof value.subtopic_lat === "string") ||
    ("subtopic_cyr" in value && typeof value.subtopic_cyr === "string") ||
    ("name_lat" in value && typeof value.name_lat === "string") ||
    ("name_cyr" in value && typeof value.name_cyr === "string");

  return (
    hasTopicName &&
    "entries" in value &&
    Array.isArray(value.entries) &&
    value.entries.every(isJsonEntry)
  );
}

function isJsonPart(value: unknown): value is JsonPart {
  return (
    typeof value === "object" &&
    value !== null &&
    "words" in value &&
    Array.isArray(value.words) &&
    value.words.every(isJsonTopic)
  );
}

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  return `${trimmed.charAt(0).toLocaleUpperCase()}${trimmed.slice(1)}`;
}

function buildScriptNames(text: string): ScriptNames {
  const value = text.trim();
  if (!value) {
    return { lat: "", cyr: "" };
  }

  return {
    lat: capitalizeFirst(value),
    cyr: capitalizeFirst(value),
  };
}

function resolveScriptNames(
  lat?: string,
  cyr?: string,
  fallback = "",
): ScriptNames {
  const normalizedLat = typeof lat === "string" ? lat.trim() : "";
  const normalizedCyr = typeof cyr === "string" ? cyr.trim() : "";

  if (normalizedLat && normalizedCyr) {
    return {
      lat: capitalizeFirst(normalizedLat),
      cyr: capitalizeFirst(normalizedCyr),
    };
  }

  if (normalizedLat) {
    return buildScriptNames(normalizedLat);
  }

  if (normalizedCyr) {
    return buildScriptNames(normalizedCyr);
  }

  return buildScriptNames(fallback);
}

function getUniquePairs(words: [string, string][]): [string, string][] {
  const seen = new Set<string>();
  const result: [string, string][] = [];

  for (const [serbian, russian] of words) {
    const normalizedSerbian = serbian.trim().toLocaleLowerCase();
    const normalizedRussian = russian.trim().toLocaleLowerCase();

    if (!normalizedSerbian || !normalizedRussian) {
      continue;
    }

    const key = `${normalizedSerbian}-${normalizedRussian}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push([normalizedSerbian, normalizedRussian]);
    }
  }

  return result;
}

function createJsonWordSets(blockId: string, blockData: JsonBlock): WordSet[] {
  const defaultBlockNames = BLOCK_NAMES[blockId] ?? buildScriptNames(blockId);
  const blockNames = resolveScriptNames(
    blockData.block_name_lat,
    blockData.block_name_cyr,
    defaultBlockNames.lat,
  );

  const parts = Object.entries(blockData).reduce<[string, JsonPart][]>(
    (result, [key, value]) => {
      if (key.startsWith("part_") && isJsonPart(value)) {
        result.push([key, value]);
      }

      return result;
    },
    [],
  );

  return parts
    .sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey, undefined, { numeric: true }),
    )
    .flatMap(([partKey, part]) => {
      const partNames = resolveScriptNames(
        part.name_lat,
        part.name_cyr,
        part.title ?? partKey,
      );

      return part.words.map((topic, topicIndex) => {
        const topicFallback =
          topic.subtopic ?? `${partNames.lat} ${topicIndex + 1}`;
        const topicNames = resolveScriptNames(
          topic.subtopic_lat ?? topic.name_lat,
          topic.subtopic_cyr ?? topic.name_cyr,
          topicFallback,
        );

        return {
          id: `${blockId}-${partKey}-${topicIndex + 1}`,
          name: topicNames.lat,
          description: `${blockNames.lat} / ${partNames.lat}`,
          blockNameLat: blockNames.lat,
          blockNameCyr: blockNames.cyr,
          partNameLat: partNames.lat,
          partNameCyr: partNames.cyr,
          topicNameLat: topicNames.lat,
          topicNameCyr: topicNames.cyr,
          words: getUniquePairs(
            topic.entries.map(
              ({ sr_lat, ru }) => [sr_lat, ru] as [string, string],
            ),
          ),
        };
      });
    })
    .filter((set) => set.words.length > 0);
}

export const blok1WordSets = createJsonWordSets(
  "blok-1",
  blok1Data as JsonBlock,
);
export const blok2WordSets = createJsonWordSets(
  "blok-2",
  blok2Data as JsonBlock,
);
export const blok3WordSets = createJsonWordSets(
  "blok-3",
  blok3Data as JsonBlock,
);

export const allWordSets: WordSet[] = [
  // { ...basicSetInfo, words: basicWords },
  // { ...adjectivesSetInfo, words: adjectiveWords },
  // { ...verbsSetInfo, words: verbWords },
  // { ...clothingSetInfo, words: clothingWords },
  // { ...itemsSetInfo, words: itemsWords },
  // { ...itemsAdvancedSetInfo, words: itemsAdvancedWords },
  // { ...relationshipsSetInfo, words: relationshipsWords },
  // { ...foodSetInfo, words: foodWords },
  // { ...directionsSetInfo, words: directionsWords },
  // { ...verbsImperfectiveSetInfo, words: verbsImperfectiveWords },
  // { ...verbsPerfectiveSetInfo, words: verbsPerfectiveWords },
  ...blok1WordSets,
  ...blok2WordSets,
  ...blok3WordSets,
];

export function getUniqueWords(setIds: string[]): [string, string][] {
  const seen = new Set<string>();
  const result: [string, string][] = [];

  for (const set of allWordSets) {
    if (setIds.includes(set.id)) {
      for (const [serbian, russian] of set.words) {
        const key = `${serbian}-${russian}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push([serbian, russian]);
        }
      }
    }
  }

  return result;
}

export function getAllUniqueWords(): [string, string][] {
  const seen = new Set<string>();
  const result: [string, string][] = [];

  for (const set of allWordSets) {
    for (const [serbian, russian] of set.words) {
      const key = `${serbian}-${russian}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push([serbian, russian]);
      }
    }
  }

  return result;
}
