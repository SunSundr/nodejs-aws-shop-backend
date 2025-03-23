export function splitAndCleanText(text: string): string[] {
  const cleanedText = text.replace(/[^\w\s]/g, '').toLowerCase();
  const words = cleanedText.split(/\s+/);
  const filteredWords = words.filter((word) => word.length > 0);
  return filteredWords;
}
