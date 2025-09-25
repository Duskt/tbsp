import { promises as fs } from 'node:fs'

export async function generateRandomName() {
  const data = (await fs.readFile('../src/words.csv', 'utf8')).split('\n')
  const adjectives = data[0].split(',')
  const nouns = data[1].split(',')
  const word1 = adjectives[Math.floor(Math.random() * adjectives.length)]
  const word2 = nouns[Math.floor(Math.random() * nouns.length)]
  return word1 + word2
}
