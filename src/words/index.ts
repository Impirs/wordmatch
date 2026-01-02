export { basicWords, basicSetInfo } from './basic';
export { adjectiveWords, adjectivesSetInfo } from './adjectives';
export { verbWords, verbsSetInfo } from './verbs';
export { clothingWords, clothingSetInfo } from './clothing';
export { itemsWords, itemsSetInfo } from './items';
export { itemsAdvancedWords, itemsAdvancedSetInfo } from './itemsAdvanced';
export { relationshipsWords, relationshipsSetInfo } from './relationships';
export { foodWords, foodSetInfo } from './food';
export { directionsWords, directionsSetInfo } from './directions';
export { verbsImperfectiveWords, verbsImperfectiveSetInfo } from './verbsImperfective';
export { verbsPerfectiveWords, verbsPerfectiveSetInfo } from './verbsPerfective';

import { basicWords, basicSetInfo } from './basic';
import { adjectiveWords, adjectivesSetInfo } from './adjectives';
import { verbWords, verbsSetInfo } from './verbs';
import { clothingWords, clothingSetInfo } from './clothing';
import { itemsWords, itemsSetInfo } from './items';
import { itemsAdvancedWords, itemsAdvancedSetInfo } from './itemsAdvanced';
import { relationshipsWords, relationshipsSetInfo } from './relationships';
import { foodWords, foodSetInfo } from './food';
import { directionsWords, directionsSetInfo } from './directions';
import { verbsImperfectiveWords, verbsImperfectiveSetInfo } from './verbsImperfective';
import { verbsPerfectiveWords, verbsPerfectiveSetInfo } from './verbsPerfective';

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
  { ...clothingSetInfo, words: clothingWords },
  { ...itemsSetInfo, words: itemsWords },
  { ...itemsAdvancedSetInfo, words: itemsAdvancedWords },
  { ...relationshipsSetInfo, words: relationshipsWords },
  { ...foodSetInfo, words: foodWords },
  { ...directionsSetInfo, words: directionsWords },
  { ...verbsImperfectiveSetInfo, words: verbsImperfectiveWords },
  { ...verbsPerfectiveSetInfo, words: verbsPerfectiveWords },
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
