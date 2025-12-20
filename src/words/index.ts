export { basicWords, basicSetInfo } from './basic';
export { adjectiveWords, adjectivesSetInfo } from './adjectives';
export { verbWords, verbsSetInfo } from './verbs';

import { basicWords, basicSetInfo } from './basic';
import { adjectiveWords, adjectivesSetInfo } from './adjectives';
import { verbWords, verbsSetInfo } from './verbs';

export interface WordSet {
  id: string;
  name: string;
  description: string;
  words: [string, string][];
}

export const allWordSets: WordSet[] = [
  { ...basicSetInfo, words: basicWords },
  { ...adjectivesSetInfo, words: adjectiveWords },
  { ...verbsSetInfo, words: verbWords },
];

// Получить все уникальные слова из выбранных наборов
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

// Получить все уникальные слова из всех наборов
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
