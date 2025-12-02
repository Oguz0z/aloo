/**
 * Transcript chunking utilities for reliable LLM processing
 */

// Target chunk size in words (roughly 3000-4000 tokens)
// This leaves room for system prompt, context, and response
const TARGET_CHUNK_WORDS = 2500;

// Overlap size - how many words from the end of the repurposed chunk
// to pass as context to the next chunk
const CONTEXT_OVERLAP_WORDS = 200;

export interface TranscriptChunk {
  index: number;
  content: string;
  wordCount: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Split transcript into chunks at sentence boundaries
 */
export function chunkTranscript(transcript: string): TranscriptChunk[] {
  const totalWords = countWords(transcript);

  // If transcript is small enough, return as single chunk
  if (totalWords <= TARGET_CHUNK_WORDS) {
    return [
      {
        index: 0,
        content: transcript.trim(),
        wordCount: totalWords,
        isFirst: true,
        isLast: true,
      },
    ];
  }

  // Split into sentences (handling various sentence endings)
  const sentences = transcript.match(/[^.!?]+[.!?]+[\s]*/g) || [transcript];

  const chunks: TranscriptChunk[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceWords = countWords(sentence);

    // If adding this sentence would exceed the target, start a new chunk
    if (currentWordCount + sentenceWords > TARGET_CHUNK_WORDS && currentChunk.length > 0) {
      chunks.push({
        index: chunks.length,
        content: currentChunk.join('').trim(),
        wordCount: currentWordCount,
        isFirst: chunks.length === 0,
        isLast: false,
      });
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(sentence);
    currentWordCount += sentenceWords;
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push({
      index: chunks.length,
      content: currentChunk.join('').trim(),
      wordCount: currentWordCount,
      isFirst: chunks.length === 0,
      isLast: true,
    });
  }

  // Mark the last chunk
  if (chunks.length > 0) {
    chunks[chunks.length - 1].isLast = true;
  }

  return chunks;
}

/**
 * Extract context from the end of a repurposed chunk for continuity
 */
export function extractContextBridge(repurposedText: string): string {
  const words = repurposedText.trim().split(/\s+/);

  if (words.length <= CONTEXT_OVERLAP_WORDS) {
    return repurposedText.trim();
  }

  // Get the last N words, but try to start at a sentence boundary
  const lastWords = words.slice(-CONTEXT_OVERLAP_WORDS);
  const contextText = lastWords.join(' ');

  // Try to find the start of a sentence within this context
  const sentenceStart = contextText.search(/[.!?]\s+[A-Z]/);
  if (sentenceStart !== -1) {
    // Start from the next sentence
    return contextText.slice(sentenceStart + 2).trim();
  }

  return contextText;
}

/**
 * Extract the first hook/opening from a transcript
 */
export function extractOriginalHook(transcript: string): string {
  // Get the first 1-2 sentences as the hook
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];

  if (sentences.length === 0) {
    return transcript.slice(0, 200).trim();
  }

  // Take up to 2 sentences or 100 words, whichever is less
  let hook = sentences[0].trim();
  if (sentences.length > 1 && countWords(hook) < 50) {
    hook += ' ' + sentences[1].trim();
  }

  // Limit to ~100 words
  const words = hook.split(/\s+/);
  if (words.length > 100) {
    hook = words.slice(0, 100).join(' ') + '...';
  }

  return hook;
}
