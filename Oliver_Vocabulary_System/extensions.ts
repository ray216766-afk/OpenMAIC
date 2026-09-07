/**
 * Extension points for later modules.
 *
 * V1 implements vocabulary only. These hooks exist so V2 Writing and V3 Book
 * Integration can attach without rewriting the daily engine.
 */

import type { BookIntegrationHook, DailyLesson, VocabularyEntry, WritingModuleHook } from './types';

export const PLANNED_BOOK_TITLES = ['Hatchet', 'Nevermoor', 'Wonder'] as const;

export const writingModuleHook: WritingModuleHook = {
  module: 'writing-v2',
  fromLesson(_lesson: DailyLesson): never {
    throw new Error('Writing Module V2 is not implemented in Vocabulary Master V1.0');
  },
};

export const bookIntegrationHook: BookIntegrationHook = {
  module: 'book-v3',
  plannedTitles: PLANNED_BOOK_TITLES,
  attachBookVocabulary(_title: string, _entries: VocabularyEntry[]): never {
    throw new Error('Book Integration V3 is not implemented in Vocabulary Master V1.0');
  },
};

export interface ExtensionRegistry {
  writing?: WritingModuleHook;
  books?: BookIntegrationHook;
}

export const reservedExtensions: ExtensionRegistry = {
  writing: writingModuleHook,
  books: bookIntegrationHook,
};
