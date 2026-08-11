export type GlobalSearchKind = "student" | "schedule" | "lesson-plan" | "block" | "lesson-record";

export type GlobalSearchItem = {
  id: string;
  kind: GlobalSearchKind;
  href: string;
  title: string;
  description: string;
  meta: string[];
  status?: string;
  flags?: string[];
  matchContext?: string;
};

export type GlobalSearchGroup = {
  items: GlobalSearchItem[];
  hasMore: boolean;
  seeAllHref: string;
};

export type GlobalSearchGroups = {
  students: GlobalSearchGroup;
  schedules: GlobalSearchGroup;
  lessonPlans: GlobalSearchGroup;
  blocks: GlobalSearchGroup;
  lessonRecords: GlobalSearchGroup;
};

export type GlobalSearchResponse = {
  query: string;
  groups: GlobalSearchGroups;
  unavailableGroups: GlobalSearchKind[];
};

const japaneseCharacterPattern = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff々〆ヵヶ]/u;

export function isGlobalSearchQueryReady(value: string) {
  const query = value.trim();
  return Array.from(query).length >= 2 || (Array.from(query).length === 1 && japaneseCharacterPattern.test(query));
}
