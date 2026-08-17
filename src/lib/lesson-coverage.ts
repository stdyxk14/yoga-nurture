export type LessonCoverageKey =
  | "breath_focus"
  | "neck_shoulders"
  | "chest_back"
  | "spine_core"
  | "hips_pelvis"
  | "legs_feet"
  | "balance"
  | "strength_stability"
  | "relax_recovery"
  | "whole_body_flow"
  | "unclassified";

export type LessonCoverageDefinition = {
  key: LessonCoverageKey;
  label: string;
  color: string;
};

type ClassifiedCoverageKey = Exclude<LessonCoverageKey, "unclassified">;

type CoverageRule = LessonCoverageDefinition & {
  key: ClassifiedCoverageKey;
  keywords: readonly string[];
};

const COVERAGE_RULES: readonly CoverageRule[] = [
  {
    key: "breath_focus",
    label: "呼吸・集中",
    color: "#5f8f79",
    keywords: ["呼吸", "プラーナ", "瞑想", "集中", "マインドフル", "ナーディ", "ナディ", "カパーラバーティ"],
  },
  {
    key: "neck_shoulders",
    label: "首・肩",
    color: "#7b9c68",
    keywords: ["首", "肩", "肩甲骨", "肩まわり", "肩周り", "ショルダー", "巻肩"],
  },
  {
    key: "chest_back",
    label: "胸・背中",
    color: "#c67f63",
    keywords: ["胸", "胸郭", "背中", "背面", "背側", "大胸筋", "胸椎", "後屈", "コブラ", "ブジャンガ", "ウシュトラ", "ラクダ", "ダヌール", "シャラバ", "セツヴァンダ", "橋を架ける"],
  },
  {
    key: "spine_core",
    label: "背骨・体幹",
    color: "#9672a0",
    keywords: ["背骨", "脊柱", "体幹", "コア", "腹部", "腹筋", "ツイスト", "ねじり", "ねじれ", "回旋", "側屈", "後屈", "胸椎", "キャットカウ", "キャット&カウ", "cat&cow", "cat & cow", "ジャタラ", "パリブルッタ", "パリヴルッタ", "マッチェンドラ", "ワニのポーズ"],
  },
  {
    key: "hips_pelvis",
    label: "股関節・骨盤",
    color: "#b47e62",
    keywords: ["股関節", "骨盤", "臀部", "お尻", "腸腰筋", "大殿筋", "ヒップ", "ハッピーベイビー", "ゴームカ", "バッタコーナ", "マラーサナ", "マラ―サナ", "アンジャネーヤ", "ランジ"],
  },
  {
    key: "legs_feet",
    label: "脚・足",
    color: "#5d83a7",
    keywords: ["脚", "足", "足裏", "足首", "ふくらはぎ", "ハムストリング", "大腿", "太腿", "腿裏", "腿", "つま先", "足指", "膝", "腓腹筋", "ヒラメ筋", "前脛骨筋", "ランジ"],
  },
  {
    key: "balance",
    label: "バランス",
    color: "#bd9137",
    keywords: ["バランス", "片脚", "片足立ち", "立ち木", "木のポーズ", "ブルクシャ", "ガルーダ", "ヴィラiii", "ヴィラ3", "戦士のポーズ3", "つま先立ち"],
  },
  {
    key: "strength_stability",
    label: "筋力・安定",
    color: "#6c6e91",
    keywords: ["筋力", "安定", "トレーニング", "プランク", "支える", "強化", "鍛える", "腹筋", "チャトランガ", "ナヴァ", "スーパーマン"],
  },
  {
    key: "relax_recovery",
    label: "リラックス・回復",
    color: "#659895",
    keywords: ["リラックス", "回復", "休息", "シャヴァ", "シャバ", "クールダウン", "リストラティブ", "お休み", "休める", "落ち着", "チャイルドポーズ", "屍のポーズ"],
  },
  {
    key: "whole_body_flow",
    label: "全身・フロー",
    color: "#bd687b",
    keywords: ["全身", "フロー", "ヴィンヤサ", "ビンヤサ", "スーリャ", "太陽礼拝", "サンサルテーション"],
  },
] as const;

const UNCLASSIFIED_DEFINITION: LessonCoverageDefinition = {
  key: "unclassified",
  label: "未分類",
  color: "#888d86",
};

export const LESSON_COVERAGE_DEFINITIONS: readonly LessonCoverageDefinition[] = [
  ...COVERAGE_RULES.map(({ key, label, color }) => ({ key, label, color })),
  UNCLASSIFIED_DEFINITION,
];

export type LessonCoverageTextSource = {
  displayNameSnapshot?: string | null;
  categoryNameSnapshot?: string | null;
  subcategoryNameSnapshot?: string | null;
  purposeSnapshot?: string | null;
  tagsSnapshot?: string[] | null;
  block?: {
    name?: string | null;
    purpose?: string | null;
    category?: { name?: string | null } | null;
    subcategory?: { name?: string | null } | null;
    blockTemplateTags?: Array<{ tag?: { name?: string | null } | null }> | null;
  } | null;
};

export type LessonCoverageSourceItem = LessonCoverageTextSource & {
  id: string;
  blockTemplateId: string | null;
  itemSource: "planned" | "library" | "improvised";
  changeType: "as_planned" | "adjusted" | "skipped" | "replaced" | "added" | null;
  done: boolean | null;
  actualDurationMinutes: number | null;
};

export type LessonCoverageSourceLesson = {
  lessonRecordId: string;
  scheduleId: string | null;
  lessonName: string;
  dateIso: string;
  scheduleStatus: string | null;
  closed: boolean;
  items: LessonCoverageSourceItem[];
};

export type LessonCoverageOccurrence = {
  id: string;
  lessonRecordId: string;
  scheduleId: string;
  lessonName: string;
  date: string;
  dateIso: string;
  monthKey: string;
  blockTemplateId: string | null;
  blockName: string;
  actualDurationMinutes: number | null;
  coverageKeys: LessonCoverageKey[];
};

export type LessonCoverageSummaryRow = LessonCoverageDefinition & {
  occurrenceCount: number;
  lessonCount: number;
  lessonRate: number;
};

export type LessonCoverageLessonColumn = {
  lessonRecordId: string;
  scheduleId: string;
  lessonName: string;
  date: string;
  dateIso: string;
  counts: Record<LessonCoverageKey, number>;
};

export type LessonCoverageMonthColumn = {
  monthKey: string;
  label: string;
  lessonCount: number;
  counts: Record<LessonCoverageKey, number>;
};

export type LessonCoverageUnclassifiedBlock = {
  key: string;
  blockTemplateId: string | null;
  blockName: string;
  useCount: number;
  latestDate: string;
};

export type LessonCoverageTrend = {
  recentLessonCount: number;
  absentRecent: LessonCoverageDefinition[];
  consecutive: Array<LessonCoverageDefinition & { lessonCount: number }>;
  mostUsed: LessonCoverageSummaryRow[];
  timingSparse: Array<LessonCoverageDefinition & { recordedCount: number; totalCount: number; recordedRate: number }>;
};

export type LessonCoverageReport = {
  totalLessons: number;
  totalExecutedItems: number;
  categoryDefinitions: LessonCoverageDefinition[];
  summary: LessonCoverageSummaryRow[];
  lessons: LessonCoverageLessonColumn[];
  months: LessonCoverageMonthColumn[];
  occurrences: LessonCoverageOccurrence[];
  trends: LessonCoverageTrend;
  unclassifiedBlocks: LessonCoverageUnclassifiedBlock[];
};

export function classifyLessonCoverage(source: LessonCoverageTextSource): LessonCoverageKey[] {
  const normalized = normalizeCoverageText([
    source.displayNameSnapshot,
    source.categoryNameSnapshot,
    source.subcategoryNameSnapshot,
    source.purposeSnapshot,
    ...(source.tagsSnapshot ?? []),
    source.block?.name,
    source.block?.category?.name,
    source.block?.subcategory?.name,
    source.block?.purpose,
    ...(source.block?.blockTemplateTags ?? []).map((item) => item.tag?.name),
  ]);

  const matches = COVERAGE_RULES
    .filter((rule) => matchesCoverageRule(rule, normalized))
    .map((rule) => rule.key);

  return matches.length ? matches : ["unclassified"];
}

export function isExecutedCoverageItem(item: Pick<LessonCoverageSourceItem, "itemSource" | "changeType" | "done">) {
  return item.done === true && !(item.itemSource === "planned" && item.changeType === "replaced");
}

export function buildLessonCoverage(sourceLessons: LessonCoverageSourceLesson[]): LessonCoverageReport {
  const eligibleLessons = sourceLessons
    .filter((lesson) => lesson.scheduleStatus === "recorded" && !lesson.closed && Boolean(lesson.scheduleId))
    .sort((a, b) => Date.parse(a.dateIso) - Date.parse(b.dateIso));

  const occurrences: LessonCoverageOccurrence[] = [];
  for (const lesson of eligibleLessons) {
    const date = toTokyoDate(lesson.dateIso);
    for (const item of lesson.items) {
      if (!isExecutedCoverageItem(item)) continue;
      occurrences.push({
        id: item.id,
        lessonRecordId: lesson.lessonRecordId,
        scheduleId: lesson.scheduleId!,
        lessonName: lesson.lessonName.trim() || "名称未設定",
        date,
        dateIso: lesson.dateIso,
        monthKey: date.slice(0, 7),
        blockTemplateId: item.blockTemplateId,
        blockName: item.displayNameSnapshot?.trim() || item.block?.name?.trim() || "名称未設定",
        actualDurationMinutes: item.actualDurationMinutes,
        coverageKeys: classifyLessonCoverage(item),
      });
    }
  }

  const occurrenceByLesson = groupBy(occurrences, (occurrence) => occurrence.lessonRecordId);
  const newestLessons = [...eligibleLessons].sort((a, b) => Date.parse(b.dateIso) - Date.parse(a.dateIso));
  const lessons = newestLessons
    .slice(0, 12)
    .sort((a, b) => Date.parse(a.dateIso) - Date.parse(b.dateIso))
    .map((lesson) => ({
      lessonRecordId: lesson.lessonRecordId,
      scheduleId: lesson.scheduleId!,
      lessonName: lesson.lessonName.trim() || "名称未設定",
      date: toTokyoDate(lesson.dateIso),
      dateIso: lesson.dateIso,
      counts: countCoverage(occurrenceByLesson.get(lesson.lessonRecordId) ?? []),
    }));

  const lessonsByMonth = groupBy(eligibleLessons, (lesson) => toTokyoDate(lesson.dateIso).slice(0, 7));
  const occurrenceByMonth = groupBy(occurrences, (occurrence) => occurrence.monthKey);
  const months = Array.from(lessonsByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, monthLessons]) => ({
      monthKey,
      label: `${Number(monthKey.slice(0, 4))}年${Number(monthKey.slice(5, 7))}月`,
      lessonCount: monthLessons.length,
      counts: countCoverage(occurrenceByMonth.get(monthKey) ?? []),
    }));

  const summary = buildSummary(eligibleLessons, occurrences);
  const recentLessons = newestLessons.slice(0, 5);
  const recentCounts = new Map(recentLessons.map((lesson) => [lesson.lessonRecordId, countCoverage(occurrenceByLesson.get(lesson.lessonRecordId) ?? [])]));
  const knownDefinitions = LESSON_COVERAGE_DEFINITIONS.filter((definition) => definition.key !== "unclassified");
  const absentRecent = recentLessons.length
    ? knownDefinitions.filter((definition) => recentLessons.every((lesson) => (recentCounts.get(lesson.lessonRecordId)?.[definition.key] ?? 0) === 0))
    : [];
  const consecutive = knownDefinitions.flatMap((definition) => {
    let lessonCount = 0;
    for (const lesson of newestLessons) {
      if ((occurrenceByLesson.get(lesson.lessonRecordId) ?? []).some((occurrence) => occurrence.coverageKeys.includes(definition.key))) lessonCount += 1;
      else break;
    }
    return lessonCount >= 3 ? [{ ...definition, lessonCount }] : [];
  });
  const knownSummary = summary.filter((row) => row.key !== "unclassified");
  const highestCount = knownSummary.reduce((highest, row) => Math.max(highest, row.occurrenceCount), 0);
  const mostUsed = highestCount ? knownSummary.filter((row) => row.occurrenceCount === highestCount) : [];
  const timingSparse = knownDefinitions
    .map((definition) => {
      const matching = occurrences.filter((occurrence) => occurrence.coverageKeys.includes(definition.key));
      const recordedCount = matching.filter((occurrence) => occurrence.actualDurationMinutes !== null).length;
      return {
        ...definition,
        recordedCount,
        totalCount: matching.length,
        recordedRate: percent(recordedCount, matching.length),
      };
    })
    .filter((row) => row.totalCount > 0 && row.recordedCount < row.totalCount)
    .sort((a, b) => a.recordedRate - b.recordedRate || b.totalCount - a.totalCount || definitionIndex(a.key) - definitionIndex(b.key))
    .slice(0, 3);

  return {
    totalLessons: eligibleLessons.length,
    totalExecutedItems: occurrences.length,
    categoryDefinitions: LESSON_COVERAGE_DEFINITIONS.map((definition) => ({ ...definition })),
    summary,
    lessons,
    months,
    occurrences,
    trends: {
      recentLessonCount: recentLessons.length,
      absentRecent,
      consecutive,
      mostUsed,
      timingSparse,
    },
    unclassifiedBlocks: buildUnclassifiedBlocks(occurrences),
  };
}

export function emptyLessonCoverageReport(): LessonCoverageReport {
  const definitions = LESSON_COVERAGE_DEFINITIONS.map((definition) => ({ ...definition }));
  return {
    totalLessons: 0,
    totalExecutedItems: 0,
    categoryDefinitions: definitions,
    summary: definitions.map((definition) => ({ ...definition, occurrenceCount: 0, lessonCount: 0, lessonRate: 0 })),
    lessons: [],
    months: [],
    occurrences: [],
    trends: { recentLessonCount: 0, absentRecent: [], consecutive: [], mostUsed: [], timingSparse: [] },
    unclassifiedBlocks: [],
  };
}

function buildSummary(lessons: LessonCoverageSourceLesson[], occurrences: LessonCoverageOccurrence[]) {
  const rows = LESSON_COVERAGE_DEFINITIONS.map((definition) => {
    const matching = occurrences.filter((occurrence) => occurrence.coverageKeys.includes(definition.key));
    return {
      ...definition,
      occurrenceCount: matching.length,
      lessonCount: new Set(matching.map((occurrence) => occurrence.lessonRecordId)).size,
      lessonRate: percent(new Set(matching.map((occurrence) => occurrence.lessonRecordId)).size, lessons.length),
    };
  });
  const unclassified = rows.find((row) => row.key === "unclassified")!;
  return [
    ...rows
      .filter((row) => row.key !== "unclassified")
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount || definitionIndex(a.key) - definitionIndex(b.key)),
    unclassified,
  ];
}

function buildUnclassifiedBlocks(occurrences: LessonCoverageOccurrence[]) {
  const grouped = new Map<string, LessonCoverageUnclassifiedBlock>();
  for (const occurrence of occurrences.filter((item) => item.coverageKeys.includes("unclassified"))) {
    const key = occurrence.blockTemplateId ? `block:${occurrence.blockTemplateId}` : `name:${normalizeCoverageText([occurrence.blockName])}`;
    const current = grouped.get(key);
    grouped.set(key, {
      key,
      blockTemplateId: occurrence.blockTemplateId,
      blockName: !current || occurrence.date >= current.latestDate ? occurrence.blockName : current.blockName,
      useCount: (current?.useCount ?? 0) + 1,
      latestDate: !current || occurrence.date > current.latestDate ? occurrence.date : current.latestDate,
    });
  }
  return Array.from(grouped.values()).sort((a, b) => b.useCount - a.useCount || b.latestDate.localeCompare(a.latestDate) || a.blockName.localeCompare(b.blockName, "ja"));
}

function countCoverage(occurrences: LessonCoverageOccurrence[]) {
  const counts = Object.fromEntries(LESSON_COVERAGE_DEFINITIONS.map((definition) => [definition.key, 0])) as Record<LessonCoverageKey, number>;
  for (const occurrence of occurrences) {
    for (const key of occurrence.coverageKeys) counts[key] += 1;
  }
  return counts;
}

function normalizeCoverageText(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ");
}

function matchesCoverageRule(rule: CoverageRule, normalized: string) {
  const searchable = rule.key === "neck_shoulders" ? normalized.replace(/手首|足首/g, "") : normalized;
  return rule.keywords.some((keyword) => searchable.includes(normalizeCoverageText([keyword])));
}

function toTokyoDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function definitionIndex(key: LessonCoverageKey) {
  return LESSON_COVERAGE_DEFINITIONS.findIndex((definition) => definition.key === key);
}

function groupBy<T>(values: T[], key: (value: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const value of values) {
    const groupKey = key(value);
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), value]);
  }
  return grouped;
}
