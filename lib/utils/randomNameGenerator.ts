import { promises as fs } from 'node:fs';

export async function generateRandomName() {
  const [adjectivesList, nounsList] = (await fs.readFile('../src/words.csv', 'utf8')).split('\n');
  if (!adjectivesList || !nounsList) {
    throw new Error('Words file is not formatted correctly.');
  }

  const adjectives = adjectivesList.split(',');
  const nouns = nounsList.split(',');

  const word1 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const word2 = nouns[Math.floor(Math.random() * nouns.length)];

  return `${word1} ${word2}`;
}
