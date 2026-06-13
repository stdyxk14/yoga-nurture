const tokyoTimeZone = "Asia/Tokyo";

export function getTokyoDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: tokyoTimeZone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
  };
}

export function formatJapaneseDate(date = new Date()) {
  const { year, month, day, weekday } = getTokyoDateParts(date);
  return `${year}年${month}月${day}日（${weekday}）`;
}

export function formatJapaneseMonth(date = new Date()) {
  const { year, month } = getTokyoDateParts(date);
  return `${year}年${month}月`;
}

export function formatDateKeyJa(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return formatJapaneseDate(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

export function formatJapaneseDateTime(date = new Date()) {
  const dateText = formatJapaneseDate(date);
  const timeText = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tokyoTimeZone,
  }).format(date);
  return `${dateText} ${timeText}`;
}
