import type { RequiredSearch, SearchField, Suggestion, SuggestionGroup } from "./types";

const labels: Record<SearchField, string> = { origin: "출발지", destination: "목적지", departureDate: "출국일", returnDate: "귀국일" };
export function buildSuggestions(search: RequiredSearch, tripType = "roundtrip"): SuggestionGroup[] {
  return (Object.keys(labels) as SearchField[]).flatMap(field => {
    if (field === "returnDate" && tripType === "oneway") return [];
    const state = search[field];
    if (state.status === "resolved") return [];
    const isDate = field === "departureDate" || field === "returnDate";
    const candidates = state.status === "ambiguous" ? state.candidates : [];
    const items: Suggestion[] = candidates.flatMap(value => {
      if (typeof value === "string") {
        if (field === "returnDate" && search.departureDate.status === "resolved" && value < search.departureDate.value) return [];
        return [{ kind: "select" as const, label: value, value }];
      }
      return [{ kind: "select" as const, label: `${value.name} (${value.airportCodes.join("·")})`, value: value.id }];
    }).filter((item, index, all) => all.findIndex(other => other.value === item.value) === index).slice(0, 6);
    items.push({ kind: "manual", label: "직접 설정하기", control: isDate ? "date-picker" : "place-picker" });
    return [{ field, status: state.status, label: labels[field], showPicker: isDate && state.status === "missing", items }];
  });
}
