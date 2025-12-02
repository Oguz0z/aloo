/**
 * Main repurposing service - orchestrates transcript repurposing
 */

import { createChatCompletion } from '@/lib/openrouter';
import { prisma } from '@/lib/db';
import {
  REPURPOSE_SYSTEM_PROMPT,
  REPURPOSE_FIRST_CHUNK_PROMPT,
  REPURPOSE_CHUNK_PROMPT,
  HOOKS_SYSTEM_PROMPT,
  HOOKS_PROMPT,
} from './prompts';
import { chunkTranscript, extractContextBridge, extractOriginalHook } from './chunker';

export interface RepurposeResult {
  repurposedScript: string;
  hooks: string[];
  chunksProcessed: number;
}

/**
 * Get user's selected model
 */
async function getUserModel(userId: string): Promise<string> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings?.selectedModelId) {
    throw new Error('No LLM model selected. Please select a model in Settings.');
  }

  return settings.selectedModelId;
}

/**
 * Generate 3 hooks from the original opening
 */
async function generateHooks(
  userId: string,
  model: string,
  originalHook: string
): Promise<string[]> {
  const prompt = HOOKS_PROMPT.replace('{originalHook}', originalHook);

  const response = await createChatCompletion({
    userId,
    model,
    messages: [
      { role: 'system', content: HOOKS_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8, // Slightly higher for creative variation
  });

  const content = response.choices[0]?.message?.content || '[]';

  // Parse the JSON array
  try {
    // Clean up the response - remove any markdown code blocks
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const hooks = JSON.parse(cleanedContent);

    if (Array.isArray(hooks) && hooks.length === 3) {
      return hooks;
    }

    // If parsing succeeded but format is wrong, try to extract
    if (Array.isArray(hooks)) {
      return hooks.slice(0, 3);
    }

    throw new Error('Invalid hooks format');
  } catch {
    // Fallback: try to extract hooks from text
    console.error('Failed to parse hooks JSON, attempting text extraction');
    const lines = content.split('\n').filter((line) => line.trim().length > 10);
    return lines.slice(0, 3).map((line) => line.replace(/^[\d.\-*]+\s*/, '').trim());
  }
}

/**
 * Repurpose a single chunk
 */
async function repurposeChunk(
  userId: string,
  model: string,
  chunk: string,
  previousContext: string | null,
  isFirst: boolean
): Promise<string> {
  let userPrompt: string;

  if (isFirst) {
    userPrompt = REPURPOSE_FIRST_CHUNK_PROMPT.replace('{chunk}', chunk);
  } else {
    userPrompt = REPURPOSE_CHUNK_PROMPT.replace('{previousContext}', previousContext || '').replace(
      '{chunk}',
      chunk
    );
  }

  const response = await createChatCompletion({
    userId,
    model,
    messages: [
      { role: 'system', content: REPURPOSE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Main function to repurpose a transcript
 */
export async function repurposeTranscript(
  userId: string,
  transcript: string
): Promise<RepurposeResult> {
  // Get user's selected model
  const model = await getUserModel(userId);

  // Chunk the transcript
  const chunks = chunkTranscript(transcript);

  // Process chunks sequentially to maintain flow
  const repurposedParts: string[] = [];
  let previousContext: string | null = null;

  for (const chunk of chunks) {
    const repurposedChunk = await repurposeChunk(
      userId,
      model,
      chunk.content,
      previousContext,
      chunk.isFirst
    );

    repurposedParts.push(repurposedChunk);

    // Extract context for the next chunk
    if (!chunk.isLast) {
      previousContext = extractContextBridge(repurposedChunk);
    }
  }

  // Combine all repurposed parts
  const repurposedScript = repurposedParts.join('\n\n');

  // Generate hooks from the original opening
  const originalHook = extractOriginalHook(transcript);
  const hooks = await generateHooks(userId, model, originalHook);

  return {
    repurposedScript,
    hooks,
    chunksProcessed: chunks.length,
  };
}

/**
 * Repurpose a script by ID
 */
export async function repurposeScriptById(
  userId: string,
  scriptId: string
): Promise<RepurposeResult> {
  // Fetch the script
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
  });

  if (!script) {
    throw new Error('Script not found');
  }

  if (script.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Repurpose the transcript
  const result = await repurposeTranscript(userId, script.script);

  // Update the script with repurposed content
  await prisma.script.update({
    where: { id: scriptId },
    data: {
      repurposedScript: result.repurposedScript,
      hooks: result.hooks,
      status: 'in_progress',
    },
  });

  return result;
}
