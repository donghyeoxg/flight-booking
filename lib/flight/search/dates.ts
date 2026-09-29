import type { FieldState } from "./types";

export function koreaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function isoDate(year: number, month: number, day: number): string | undefined {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) return;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return;
  return date.toISOString().slice(0, 10);
}
export function isDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return !!match && isoDate(+match[1], +match[2], +match[3]) === value;
}
function addDays(day: string, count: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
function ambiguous(raw: string, candidates: string[] = [], reason = "날짜를 선택해 주세요"): FieldState<string> {
  return { status: "ambiguous", raw, reason, candidates };
}
function range(raw: string, start: string, end: string, today: string): FieldState<string> {
  const first = start < today ? today : start;
  if (first > end) return ambiguous(raw, [], "지난 날짜 범위입니다");
  const days = Math.round((Date.parse(end) - Date.parse(first)) / 86400000);
  return ambiguous(raw, [...new Set([first, addDays(first, Math.floor(days / 2)), end])]);
}

/** Missing year means the next occurrence on/after the reference date (Korea time).
 * A day alone remains ambiguous unless it is an endpoint of an explicit range. */
export function parseDateExpression(raw: string, today: string): FieldState<string> {
  let text = raw.replace(/\s+/g, "");
  const [currentYear, currentMonth] = today.split("-").map(Number);
  text = text.replace(/^(올해|내년|내후년)/, (_, label: string) => `${currentYear + (label === "올해" ? 0 : label === "내년" ? 1 : 2)}년`);
  const exact = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (exact) {
    const value = isoDate(+exact[1], +exact[2], +exact[3]);
    return value ? { status: "resolved", value, source: "query", raw } : ambiguous(raw, [], "존재하지 않는 날짜입니다");
  }
  if (/^(오늘|내일|모레)$/.test(text)) {
    return { status: "resolved", value: addDays(today, text === "오늘" ? 0 : text === "내일" ? 1 : 2), source: "query", raw };
  }
  if (/^(이번주|다음주|다다음주|이번주말|다음주말)$/.test(text)) {
    const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
    const offset = text.startsWith("다다음") ? 14 : text.startsWith("다음") ? 7 : 0;
    const start = addDays(today, -weekday + offset + (text.includes("주말") ? 5 : 0));
    return range(raw, start, addDays(start, text.includes("주말") ? 1 : 6), today);
  }
  if (/^(이번달|다음달)$/.test(text)) {
    const date = new Date(Date.UTC(currentYear, currentMonth - 1 + (text === "다음달" ? 1 : 0), 1));
    const year = date.getUTCFullYear(), month = date.getUTCMonth() + 1;
    return range(raw, isoDate(year, month, 1)!, isoDate(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate())!, today);
  }
  const korean = /^(?:(\d{4})년)?(?:(\d{1,2})월)?(?:(\d{1,2})일)?(초순|중순|하순|초|중|말)?$/.exec(text);
  if (!korean || !korean[0]) return ambiguous(raw);
  const yearGiven = korean[1] ? +korean[1] : undefined;
  const month = korean[2] ? +korean[2] : undefined;
  const day = korean[3] ? +korean[3] : undefined;
  const part = korean[4];
  if (!month) {
    if (day) {
      const candidates: string[] = [];
      for (let offset = 0; offset < 12 && candidates.length < 3; offset++) {
        const date = new Date(Date.UTC(yearGiven ?? currentYear, currentMonth - 1 + offset, 1));
        const value = isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, day);
        if (value && value >= today && (!yearGiven || value.startsWith(String(yearGiven)))) candidates.push(value);
      }
      return ambiguous(raw, candidates);
    }
    if (yearGiven && yearGiven >= currentYear) return ambiguous(raw, [1, 6, 12].map(m => isoDate(yearGiven, m, 1)!).filter(d => d >= today));
    return ambiguous(raw);
  }
  let year = yearGiven ?? currentYear;
  if (!yearGiven && (month < currentMonth || (day && isoDate(year, month, day) && isoDate(year, month, day)! < today))) year++;
  if (day && !part) {
    let value = isoDate(year, month, day);
    if (!value && !yearGiven && month === 2 && day === 29) {
      for (let offset = 1; offset <= 8 && !value; offset++) value = isoDate(year + offset, month, day);
    }
    return value ? { status: "resolved", value, source: "query", raw } : ambiguous(raw, [], "존재하지 않는 날짜입니다");
  }
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay = part?.startsWith("중") ? 11 : part === "말" || part === "하순" ? 21 : 1;
  const endDay = part?.startsWith("초") ? 10 : part?.startsWith("중") ? 20 : last;
  const start = isoDate(year, month, startDay), end = isoDate(year, month, endDay);
  return start && end ? range(raw, start, end, today) : ambiguous(raw, [], "존재하지 않는 월입니다");
}

export function parseDates(query: string, today: string): { departureDate: FieldState<string>; returnDate: FieldState<string> } {
  const token = /\d{4}-\d{1,2}-\d{1,2}|(?:(?:\d{4}\s*년|올해|내년|내후년)\s*)?\d{1,2}\s*월(?:\s*\d{1,2}\s*일)?(?:\s*(?:초순|중순|하순|초|중|말))?|\d{4}\s*년|올해|내후년|내년|\d{1,2}\s*일|다다음\s*주|(?:이번|다음)\s*주말|(?:이번|다음)\s*주|(?:이번|다음)\s*달|오늘|내일|모레/g;
  const matches = [...query.matchAll(token)];
  const result: { departureDate: FieldState<string>; returnDate: FieldState<string> } = { departureDate: { status: "missing" }, returnDate: { status: "missing" } };
  let previous: FieldState<string> = { status: "missing" };
  let previousEnd = 0;
  let consumedLabelEnd = 0;
  let previousField: "departureDate" | "returnDate" = "departureDate";
  matches.forEach((match, index) => {
    const start = match.index!;
    const end = start + match[0].length;
    const before = query.slice(Math.max(previousEnd, consumedLabelEnd), start);
    const after = query.slice(end, matches[index + 1]?.index ?? query.length);
    const beforeLabel = /(귀국|복귀|돌아오는|리턴|return|출국|출발|가는|departure)\s*(?:일|날짜)?\s*[:：]?\s*$/i.exec(before)?.[1];
    const afterMatch = /^\s*(?:에\s*)?(귀국|복귀|돌아|리턴|return|출국|출발|departure)/i.exec(after);
    const afterLabel = afterMatch?.[1];
    const label = beforeLabel ?? afterLabel;
    if (!beforeLabel && afterMatch) consumedLabelEnd = end + afterMatch[0].length;
    const isReturn = label && /귀국|복귀|돌아|리턴|return/i.test(label);
    const field = label ? (isReturn ? "returnDate" : "departureDate") : result.departureDate.status === "missing" ? "departureDate" : "returnDate";
    let parsed = parseDateExpression(match[0], today);
    if (/^\d{1,2}\s*일$/.test(match[0]) && /(?:부터|~|～|–|—|-)\s*$/.test(before) && previous.status === "resolved") {
      const [year, month] = previous.value.split("-");
      parsed = parseDateExpression(`${year}년 ${month}월 ${match[0]}`, today);
    }
    if (field === "returnDate" && parsed.status === "resolved" && result.departureDate.status === "resolved" && !/\d{4}\s*(?:년|-)|올해|내년|내후년/.test(match[0]) && /월/.test(match[0]) && parsed.value < result.departureDate.value && parsed.value.slice(5, 7) < result.departureDate.value.slice(5, 7)) {
      parsed = parseDateExpression(match[0], result.departureDate.value);
    }
    if (/^\s*(?:쯤|경|전후)/.test(after) && parsed.status === "resolved") {
      parsed = range(match[0], addDays(parsed.value, -2), addDays(parsed.value, 2), today);
    }
    const alternative = /또는|혹은|아니면|\bor\b/i.test(before);
    const target = alternative ? previousField : field;
    const existing = result[target];
    if (existing.status !== "missing") {
      const values = (state: FieldState<string>) => state.status === "resolved" ? [state.value] : state.status === "ambiguous" ? state.candidates : [];
      result[target] = ambiguous(query, [...new Set([...values(existing), ...values(parsed)])], "여러 날짜가 언급되었습니다");
    } else result[target] = parsed;
    previous = parsed;
    previousEnd = end;
    previousField = target;
  });
  return result;
}
