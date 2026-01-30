import { commonWords } from './word-list';

export { generateId };

function generateId() {
  // Generate a random word from the common words list
  const randomIndex = Math.floor(Math.random() * commonWords.length);
  return commonWords[randomIndex];
}
