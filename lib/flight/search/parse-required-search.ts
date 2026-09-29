import { cityCandidates, destinations, findPlace } from "./destinations";
import { isDate, koreaToday, parseDates } from "./dates";
import type { FieldState, Place, RequiredSearch, SearchOptions } from "./types";

function placeState(place: Place, source: "query" | "selection" | "default", raw: string): FieldState<Place> {
  return place.kind === "country" || place.kind === "region"
    ? { status: "ambiguous", raw, reason: "도시 또는 공항을 선택해 주세요", candidates: cityCandidates(place) }
    : { status: "resolved", value: place, source, raw };
}
function unknown(raw: string): FieldState<Place> {
  return { status: "ambiguous", raw, reason: "도시 또는 공항을 확인해 주세요", candidates: [] };
}
function parsePlaces(query: string): { origin: FieldState<Place>; destination: FieldState<Place> } {
  const matches: { place: Place; start: number; end: number; raw: string }[] = [];
  for (const place of destinations) {
    for (const alias of new Set([place.name, ...place.aliases])) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Latin codes/names must not match fragments such as SIN in business.
      const expression = /[a-z]/i.test(alias)
        ? new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "gi") : new RegExp(`(?<![가-힣a-zA-Z])${escaped}`, "g");
      for (const match of query.matchAll(expression)) matches.push({ place, start: match.index!, end: match.index! + match[0].length, raw: match[0] });
    }
  }
  const selected: typeof matches = [];
  // Longer aliases win (인천국제공항/인천).
  for (const match of matches.sort((a, b) => (b.end - b.start) - (a.end - a.start))) {
    if (!selected.some(other => match.start < other.end && match.end > other.start)) selected.push(match);
  }
  selected.sort((a, b) => a.start - b.start);
  const origins: typeof matches = [], arrivals: typeof matches = [];
  for (const match of selected) {
    const after = query.slice(match.end);
    const before = query.slice(0, match.start);
    if (/^\s*(?:에서|출발)/.test(after) || /(?:\bfrom|출발지\s*[:：]?)\s*$/i.test(before) || /^\s*(?:→|->)/.test(after)) origins.push(match);
    else arrivals.push(match);
  }
  const combine = (items: typeof matches): FieldState<Place> => {
    const specific = items.filter(item => !items.some(other => other.place.parentIds.includes(item.place.id)));
    const unique = [...new Map(specific.map(item => [item.place.id, item])).values()];
    if (!unique.length) return { status: "missing" };
    if (unique.length === 1) return placeState(unique[0].place, "query", unique[0].raw);
    return { status: "ambiguous", raw: unique.map(p => p.raw).join(", "), reason: "여러 장소가 언급되었습니다", candidates: unique.flatMap(p => p.place.kind === "region" || p.place.kind === "country" ? cityCandidates(p.place) : [p.place]) };
  };
  let origin = combine(origins);
  let destination = combine(arrivals);
  const unknownOrigin = /([가-힣A-Za-z]+)\s*에서/.exec(query);
  if (origin.status === "missing" && unknownOrigin) origin = unknown(unknownOrigin[1]);
  const unknownDestination = /(?:목적지|도착지)\s*[:：]?\s*([가-힣A-Za-z]+)/.exec(query);
  if (destination.status === "missing" && unknownDestination) destination = unknown(unknownDestination[1]);
  return { origin, destination };
}

export function parseRequiredSearch(query: string, options: SearchOptions = {}): RequiredSearch {
  const today = options.today && isDate(options.today) ? options.today : koreaToday();
  const places = parsePlaces(query);
  // Natural-language origin always beats a UI default. A deliberate selection can
  // resolve an ambiguous origin, but cannot replace a resolved textual origin.
  if (places.origin.status === "missing" || (places.origin.status === "ambiguous" && options.origin)) {
    const value = options.origin || options.defaultOrigin;
    if (value) {
      const place = findPlace(value);
      places.origin = place ? placeState(place, options.origin ? "selection" : "default", value) : unknown(value);
    }
  }
  if (options.destination) {
    const place = findPlace(options.destination);
    places.destination = place ? placeState(place, "selection", options.destination) : unknown(options.destination);
  }
  const dates = parseDates(query, today);
  for (const field of ["departureDate", "returnDate"] as const) {
    const value = options[field];
    if (value) dates[field] = isDate(value) ? { status: "resolved", value, source: "selection" } : { status: "ambiguous", raw: value, reason: "존재하지 않는 날짜입니다", candidates: [] };
  }
  const issues: string[] = [];
  for (const field of ["departureDate", "returnDate"] as const) {
    const state = dates[field];
    if (state.status === "resolved" && state.value < today) {
      dates[field] = { status: "ambiguous", raw: state.value, reason: "지난 날짜입니다", candidates: [] };
      issues.push("지난 날짜 대신 여행 날짜를 다시 선택해 주세요.");
    }
  }
  if (options.tripType !== "oneway" && dates.departureDate.status === "resolved" && dates.returnDate.status === "resolved" && dates.returnDate.value < dates.departureDate.value) {
    dates.returnDate = { status: "ambiguous", raw: dates.returnDate.value, reason: "귀국일이 출국일보다 빠릅니다", candidates: [] };
    issues.push("귀국일은 출국일 이후로 선택해 주세요.");
  }
  if (options.tripType === "multicity") issues.push("다구간은 구간별 입력이 필요합니다. 현재는 단일 구간 후보만 표시합니다.");
  const required = [places.origin, places.destination, dates.departureDate, ...(options.tripType === "oneway" ? [] : [dates.returnDate])];
  return { ...places, ...dates, issues: [...new Set(issues)], ready: options.tripType !== "multicity" && required.every(field => field.status === "resolved") };
}
