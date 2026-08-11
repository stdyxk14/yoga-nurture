export type RadarTopicSourceKind = "practice" | "safety" | "knowledge";

export type RadarTopicSignal = {
  text: string;
  kind: RadarTopicSourceKind;
  weight?: number;
  recentUseCount?: number;
};

export type GeneratedRadarTopic = {
  topicKey: string;
  labelJa: string;
  labelEn: string;
  searchQueries: string[];
  sourceKind: RadarTopicSourceKind;
  priority: number;
  evidence: {
    practiceSignals: number;
    safetySignals: number;
    knowledgeSignals: number;
    recentUseCount: number;
  };
};

export type TeachingInsight = {
  id: string;
  kind: "usage" | "duration" | "reaction" | "reuse" | "quality" | "adaptation" | "knowledge";
  eyebrow: string;
  title: string;
  description: string;
  metric: string;
  href: string;
  actionLabel: string;
  tone: "sage" | "sand" | "sky" | "rose";
};

export type TeachingInsightInput = {
  topBlocks: Array<{ id: string; name: string; usedCount: number }>;
  topPlans: Array<{ id: string; name: string; lessonCount: number }>;
  duration: { averageDifferenceMinutes: number | null; samples: number };
  evaluatedBlocks: Array<{ id: string; name: string; evaluatedCount: number; goodRate: number | null }>;
  unusedBlocks: Array<{ id: string; name: string }>;
  dataQuality: {
    recordedLessons: number;
    totalLessons: number;
    unevaluatedBlocks: number;
    missingActualMinutes: number;
    legacyUnclassifiedItems: number;
  };
  changes: {
    confirmedPlanned: number;
    adjusted: number;
    skipped: number;
    replaced: number;
    added: number;
  };
  knowledgeTopic?: { label: string; documentCount: number } | null;
};

type TopicDefinition = {
  key: string;
  labelJa: string;
  labelEn: string;
  patterns: RegExp[];
  jaQuery: string;
  enQuery: string;
};

const topicDefinitions: TopicDefinition[] = [
  {
    key: "breath_pranayama",
    labelJa: "呼吸とプラーナヤーマ",
    labelEn: "Breathwork and pranayama",
    patterns: [/呼吸|プラーナヤーマ|breath|pranayama/i],
    jaQuery: "ヨガ 呼吸法 プラーナヤーマ 指導 安全",
    enQuery: "yoga breathwork pranayama teaching safety evidence",
  },
  {
    key: "relaxation_rest",
    labelJa: "リラックスと休息",
    labelEn: "Relaxation and restorative yoga",
    patterns: [/リラックス|休息|夜|睡眠|シャヴァーサナ|ヨガニドラ|restorative|relax|sleep|savasana|nidra/i],
    jaQuery: "リラックス ヨガ 休息 指導",
    enQuery: "restorative yoga relaxation teaching evidence",
  },
  {
    key: "shoulders_chest",
    labelJa: "肩・胸まわり",
    labelEn: "Shoulders and chest",
    patterns: [/肩|胸|肩甲骨|首まわり|shoulder|chest|scapula|upper back/i],
    jaQuery: "ヨガ 肩 胸 肩甲骨 指導 安全",
    enQuery: "yoga shoulders chest mobility teaching safety",
  },
  {
    key: "lower_back",
    labelJa: "腰・背中への配慮",
    labelEn: "Lower-back mindful yoga",
    patterns: [/腰|腰痛|背中|脊柱|lower back|back pain|spine/i],
    jaQuery: "ヨガ 腰 背中 安全 公的 医療",
    enQuery: "yoga lower back safety clinical guidance",
  },
  {
    key: "hips_pelvis",
    labelJa: "股関節と骨盤",
    labelEn: "Hips and pelvis",
    patterns: [/股関節|骨盤|臀部|お尻|hip|pelvis|glute/i],
    jaQuery: "ヨガ 股関節 骨盤 指導 安全",
    enQuery: "yoga hips pelvis mobility teaching safety",
  },
  {
    key: "knees",
    labelJa: "膝への配慮",
    labelEn: "Knee-aware yoga",
    patterns: [/膝|ひざ|knee/i],
    jaQuery: "ヨガ 膝 安全 公的 医療",
    enQuery: "yoga knee safety clinical guidance",
  },
  {
    key: "wrists",
    labelJa: "手首への配慮",
    labelEn: "Wrist-aware yoga",
    patterns: [/手首|手のひら|wrist/i],
    jaQuery: "ヨガ 手首 安全 指導",
    enQuery: "yoga wrist safety teaching modifications",
  },
  {
    key: "balance",
    labelJa: "バランスと安定",
    labelEn: "Balance and stability",
    patterns: [/バランス|片足|安定|balance|stability/i],
    jaQuery: "ヨガ バランス 安定 指導",
    enQuery: "yoga balance stability teaching evidence",
  },
  {
    key: "backbends",
    labelJa: "後屈",
    labelEn: "Backbends",
    patterns: [/後屈|コブラ|ブジャンガ|橋|ウールドヴァ|backbend|cobra|bridge pose/i],
    jaQuery: "ヨガ 後屈 指導 安全",
    enQuery: "yoga backbends teaching safety biomechanics",
  },
  {
    key: "forward_folds",
    labelJa: "前屈",
    labelEn: "Forward folds",
    patterns: [/前屈|パスチモッターナ|ウッターナ|forward fold/i],
    jaQuery: "ヨガ 前屈 指導 安全",
    enQuery: "yoga forward folds teaching safety biomechanics",
  },
  {
    key: "twists",
    labelJa: "ねじり",
    labelEn: "Yoga twists",
    patterns: [/ねじり|ツイスト|回旋|twist|rotation/i],
    jaQuery: "ヨガ ねじり 指導 安全",
    enQuery: "yoga twists rotation teaching safety",
  },
  {
    key: "beginners",
    labelJa: "初心者向け指導",
    labelEn: "Beginner yoga teaching",
    patterns: [/初心者|初回|入門|やさしい|beginner|introductory|gentle/i],
    jaQuery: "初心者 ヨガ 指導 安全",
    enQuery: "beginner yoga teaching safety guidance",
  },
];

const fallbackTopics = ["beginners", "breath_pranayama", "relaxation_rest", "balance"];

export function generateRadarTopics(signals: RadarTopicSignal[], limit = 4): GeneratedRadarTopic[] {
  const boundedLimit = Math.max(0, Math.min(4, Math.floor(limit)));
  const scored = topicDefinitions.map((definition) => {
    const evidence = {
      practiceSignals: 0,
      safetySignals: 0,
      knowledgeSignals: 0,
      recentUseCount: 0,
    };
    let score = 0;

    for (const signal of signals) {
      const normalized = sanitizeForExternalPrompt(signal.text);
      if (!normalized || !definition.patterns.some((pattern) => pattern.test(normalized))) continue;
      const weight = Math.max(0, Math.min(5, signal.weight ?? 1));
      score += weight + Math.min(2, Math.max(0, signal.recentUseCount ?? 0) * 0.15);
      evidence.recentUseCount += Math.max(0, signal.recentUseCount ?? 0);
      if (signal.kind === "safety") evidence.safetySignals += 1;
      else if (signal.kind === "knowledge") evidence.knowledgeSignals += 1;
      else evidence.practiceSignals += 1;
    }

    const sourceKind: RadarTopicSourceKind = evidence.safetySignals > 0
      ? "safety"
      : evidence.knowledgeSignals > evidence.practiceSignals
        ? "knowledge"
        : "practice";

    return {
      definition,
      score,
      sourceKind,
      evidence,
    };
  });

  const matched = scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.definition.key.localeCompare(b.definition.key));
  const selected = [...matched];

  for (const key of fallbackTopics) {
    if (selected.length >= boundedLimit) break;
    if (selected.some((row) => row.definition.key === key)) continue;
    const definition = topicDefinitions.find((row) => row.key === key);
    if (!definition) continue;
    selected.push({
      definition,
      score: 0.5,
      sourceKind: "practice",
      evidence: { practiceSignals: 0, safetySignals: 0, knowledgeSignals: 0, recentUseCount: 0 },
    });
  }

  return selected.slice(0, boundedLimit).map(({ definition, score, sourceKind, evidence }) => ({
    topicKey: definition.key,
    labelJa: definition.labelJa,
    labelEn: definition.labelEn,
    searchQueries: [definition.jaQuery, definition.enQuery],
    sourceKind,
    priority: Math.round(Math.min(10, Math.max(0.5, score)) * 1000) / 1000,
    evidence,
  }));
}

export function extractAnonymizedSafetySignals(cautions: string[]): RadarTopicSignal[] {
  const signals: RadarTopicSignal[] = [];
  for (const caution of cautions) {
    for (const definition of topicDefinitions) {
      if (!definition.patterns.some((pattern) => pattern.test(caution))) continue;
      signals.push({ text: definition.labelJa, kind: "safety", weight: 2 });
    }
  }
  return signals;
}

export function sanitizeForExternalPrompt(value: string, sensitiveValues: string[] = []): string {
  let sanitized = String(value ?? "");
  for (const sensitive of sensitiveValues.filter((item) => item.trim()).sort((a, b) => b.length - a.length)) {
    sanitized = sanitized.replaceAll(sensitive, "[非公開]");
  }
  return sanitized
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[メール非公開]")
    .replace(/(?:\+?81[-\s]?)?(?:0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/g, "[連絡先非公開]")
    .replace(/https?:\/\/\S+/gi, "[URL省略]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function buildTeachingInsights(input: TeachingInsightInput, limit = 4): TeachingInsight[] {
  const insights: TeachingInsight[] = [];
  const topBlock = input.topBlocks.find((row) => row.usedCount > 0);
  const topPlan = input.topPlans.find((row) => row.lessonCount > 0);
  const rated = input.evaluatedBlocks.find((row) => row.evaluatedCount >= 3 && row.goodRate != null);
  const confirmedChanges = input.changes.adjusted + input.changes.skipped + input.changes.replaced;

  if (topBlock) {
    insights.push({
      id: `block-${topBlock.id}`,
      kind: "usage",
      eyebrow: "よく育っているブロック",
      title: `「${topBlock.name}」がよく使われています`,
      description: "実施済みとして確認できた出現を、そのまま1回ずつ数えています。繰り返し登場する流れは、今の指導の軸になっています。",
      metric: `${topBlock.usedCount}回`,
      href: topBlock.id ? `/blocks/${topBlock.id}` : "/lessons?tab=blocks",
      actionLabel: "ブロックを確認",
      tone: "sage",
    });
  }

  if (topPlan) {
    insights.push({
      id: `plan-${topPlan.id || topPlan.name}`,
      kind: "usage",
      eyebrow: "よく使うプラン",
      title: `「${topPlan.name}」が最近の土台です`,
      description: "予定と実施記録をレッスン単位でまとめた回数です。次の準備で、育てたい部分をひとつだけ見直せます。",
      metric: `${topPlan.lessonCount}回`,
      href: topPlan.id ? `/lessons/${topPlan.id}` : "/lessons?tab=plans",
      actionLabel: "プランを見直す",
      tone: "sand",
    });
  }

  if (input.duration.samples >= 3 && input.duration.averageDifferenceMinutes != null && Math.abs(input.duration.averageDifferenceMinutes) >= 2) {
    const difference = input.duration.averageDifferenceMinutes;
    insights.push({
      id: "duration-trend",
      kind: "duration",
      eyebrow: "予定と実際のリズム",
      title: difference > 0 ? "実施時間は予定より少し長めです" : "実施時間は予定より少しコンパクトです",
      description: "予定分と実時間の両方が入った記録だけで比較しています。良し悪しではなく、現場で生まれた自然なリズムとして見られます。",
      metric: `平均 ${difference > 0 ? "+" : ""}${difference}分`,
      href: "/reports?view=execution&period=3months",
      actionLabel: "実施傾向を見る",
      tone: "sky",
    });
  }

  if (rated) {
    insights.push({
      id: `reaction-${rated.id}`,
      kind: "reaction",
      eyebrow: "評価済みの反応",
      title: `「${rated.name}」は良い反応が多めです`,
      description: "反応が未入力の記録は母数に含めていません。評価済みの範囲だけで見た、小さな手応えです。",
      metric: `良い反応 ${rated.goodRate}%`,
      href: rated.id ? `/blocks/${rated.id}` : "/reports?view=blocks&period=3months",
      actionLabel: "評価を確認",
      tone: "rose",
    });
  }

  if (input.changes.confirmedPlanned >= 8 && confirmedChanges >= 2) {
    insights.push({
      id: "adaptation-trend",
      kind: "adaptation",
      eyebrow: "現場適応の傾向",
      title: "分類済みの変更から、指導の調整が見えています",
      description: "doneとchange_typeが確認できる項目だけを集計しました。未分類の記録を、予定どおり・調整・スキップへ推測していません。",
      metric: `調整等 ${confirmedChanges}件`,
      href: "/reports?view=execution&period=3months",
      actionLabel: "現場適応を見る",
      tone: "sand",
    });
  }

  if (input.unusedBlocks[0] && insights.length < 4) {
    const unused = input.unusedBlocks[0];
    insights.push({
      id: `reuse-${unused.id}`,
      kind: "reuse",
      eyebrow: "久しぶりの選択肢",
      title: `「${unused.name}」を久しぶりに見直せます`,
      description: "この3か月の実施済み記録では登場していません。今の指導に合うなら、次回の代替候補として戻せます。",
      metric: "3か月未使用",
      href: unused.id ? `/blocks/${unused.id}` : "/lessons?tab=blocks",
      actionLabel: "内容を思い出す",
      tone: "sage",
    });
  }

  const qualityCount = input.dataQuality.unevaluatedBlocks + input.dataQuality.missingActualMinutes;
  if (qualityCount > 0 && insights.length < 4) {
    const parts = [];
    if (input.dataQuality.unevaluatedBlocks > 0) parts.push(`未評価 ${input.dataQuality.unevaluatedBlocks}件`);
    if (input.dataQuality.missingActualMinutes > 0) parts.push(`実時間未入力 ${input.dataQuality.missingActualMinutes}件`);
    insights.push({
      id: "record-quality",
      kind: "quality",
      eyebrow: "記録を育てる余地",
      title: "少し記録を足すと、次の発見が明確になります",
      description: "未評価は否定的な評価として数えず、実時間がない項目も時間比較から外しています。必要なときだけ補えます。",
      metric: parts.join("・"),
      href: "/lessons?tab=records",
      actionLabel: "記録を確認",
      tone: "sky",
    });
  }

  if (input.knowledgeTopic && input.knowledgeTopic.documentCount > 0 && insights.length < 4) {
    insights.push({
      id: "knowledge-connection",
      kind: "knowledge",
      eyebrow: "Knowledgeとのつながり",
      title: `保存資料の「${input.knowledgeTopic.label}」が現場テーマと重なっています`,
      description: "保存済みKnowledgeの題名・タグと、最近使うブロックやプランの共通テーマだけを見ています。",
      metric: `${input.knowledgeTopic.documentCount}資料`,
      href: "/settings/knowledge",
      actionLabel: "Knowledgeを見る",
      tone: "rose",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "insight-start",
      kind: "quality",
      eyebrow: "発見の準備",
      title: "実施後記録が増えると、指導の変化が見えてきます",
      description: "まず1回分だけでも、実施・反応・実時間を分かる範囲で残せば十分です。未入力は推測せず、そのまま扱います。",
      metric: "記録から開始",
      href: "/lessons?tab=records",
      actionLabel: "実施後記録を書く",
      tone: "sage",
    });
  }

  return insights.slice(0, Math.max(2, Math.min(4, limit)));
}

export function buildStructuredRelevanceReason(
  topic: Pick<GeneratedRadarTopic, "topicKey" | "labelJa" | "sourceKind" | "evidence">,
): { text: string; evidence: Record<string, string | number> } {
  if (topic.sourceKind === "safety") {
    return {
      text: `次回や最近の記録に、匿名化した「${topic.labelJa}」の安全テーマがあるため表示しています。`,
      evidence: { topicKey: topic.topicKey, sourceKind: topic.sourceKind, safetySignals: topic.evidence.safetySignals },
    };
  }
  if (topic.sourceKind === "knowledge") {
    return {
      text: `保存済みKnowledgeと共通する「${topic.labelJa}」のテーマだから表示しています。`,
      evidence: { topicKey: topic.topicKey, sourceKind: topic.sourceKind, knowledgeSignals: topic.evidence.knowledgeSignals },
    };
  }
  return {
    text: `最近のブロックやプランで「${topic.labelJa}」がよく現れているため表示しています。`,
    evidence: { topicKey: topic.topicKey, sourceKind: topic.sourceKind, recentUseCount: topic.evidence.recentUseCount },
  };
}

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "source",
]);

export function isSafePublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;
    if (hostname === "0.0.0.0" || hostname === "::" || hostname === "::1") return false;
    if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") return false;
    if (/^10\./.test(hostname) || /^127\./.test(hostname) || /^169\.254\./.test(hostname) || /^192\.168\./.test(hostname)) return false;
    const private172 = hostname.match(/^172\.(\d{1,3})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
    if (/^(?:fc|fd|fe8|fe9|fea|feb)[0-9a-f]*:/i.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function normalizeRadarUrl(value: string): string | null {
  if (!isSafePublicUrl(value)) return null;
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";

  if (url.hostname === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    if (videoId) {
      url.hostname = "www.youtube.com";
      url.pathname = "/watch";
      url.search = "";
      url.searchParams.set("v", videoId);
    }
  }

  const entries = Array.from(url.searchParams.entries())
    .filter(([key]) => !key.toLowerCase().startsWith("utm_") && !trackingParams.has(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));
  url.search = "";
  for (const [key, item] of entries) url.searchParams.append(key, item);
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function dedupeRadarCandidates<T extends { sourceUrl: string; title: string }>(items: T[]): Array<T & { normalizedUrl: string }> {
  const urls = new Set<string>();
  const fingerprints = new Set<string>();
  const result: Array<T & { normalizedUrl: string }> = [];

  for (const item of items) {
    const normalizedUrl = normalizeRadarUrl(item.sourceUrl);
    if (!normalizedUrl || urls.has(normalizedUrl)) continue;
    const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    const titleKey = item.title.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 120);
    const fingerprint = `${hostname}:${titleKey}`;
    if (titleKey.length >= 12 && fingerprints.has(fingerprint)) continue;
    urls.add(normalizedUrl);
    fingerprints.add(fingerprint);
    result.push({ ...item, normalizedUrl });
  }
  return result;
}

export function estimateRadarCost({
  model,
  searchCalls,
  inputTokens,
  outputTokens,
}: {
  model: string;
  searchCalls: number;
  inputTokens: number;
  outputTokens: number;
}): number {
  const rates = model.startsWith("gpt-5.4-nano")
    ? { input: 0.2, output: 1.25 }
    : model.startsWith("gpt-5-nano")
      ? { input: 0.05, output: 0.4 }
      : { input: 1, output: 5 };
  const estimated = (Math.max(0, searchCalls) * 0.01)
    + (Math.max(0, inputTokens) / 1_000_000) * rates.input
    + (Math.max(0, outputTokens) / 1_000_000) * rates.output;
  return Math.round(estimated * 1_000_000) / 1_000_000;
}
