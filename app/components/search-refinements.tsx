"use client";

import { useState } from "react";
import { destinations } from "@/lib/flight/search/destinations";
import { buildSuggestions } from "@/lib/flight/search/suggestions";
import type { RequiredSearch, SearchField } from "@/lib/flight/search/types";

const labels: Record<SearchField, string> = { origin: "출발지", destination: "목적지", departureDate: "출국일", returnDate: "귀국일" };
const inputClass = "mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black";

export function SearchRefinements({ search, tripType, onSelect }: {
  search: RequiredSearch;
  tripType: string;
  onSelect: (field: SearchField, value: string) => void;
}) {
  const [manual, setManual] = useState<Partial<Record<SearchField, boolean>>>({});
  const groups = buildSuggestions(search, tripType);

  function picker(field: SearchField) {
    const state = search[field];
    const value = state.status === "resolved" ? (typeof state.value === "string" ? state.value : state.value.id) : "";
    if (field === "departureDate" || field === "returnDate") {
      return <label className="block text-xs text-gray-500">{labels[field]} 직접 설정
        <input aria-label={`${labels[field]} 직접 설정`} type="date" className={inputClass} value={value}
          min={field === "returnDate" && search.departureDate.status === "resolved" ? search.departureDate.value : undefined}
          onInput={event => onSelect(field, event.currentTarget.value)} onChange={event => onSelect(field, event.target.value)} />
      </label>;
    }
    return <label className="block text-xs text-gray-500">{labels[field]} 직접 설정
      <select aria-label={`${labels[field]} 직접 설정`} className={inputClass} value={value} onChange={event => onSelect(field, event.target.value)}>
        <option value="">도시 또는 공항 선택</option>
        {destinations.filter(place => place.kind === "city" || place.kind === "airport").map(place =>
          <option key={place.id} value={place.id}>{place.name} ({place.airportCodes.join("·")})</option>)}
      </select>
    </label>;
  }

  return <section aria-label="더 나은 검색 결과 보기" className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
    <h2 className="text-sm font-semibold">더 나은 검색 결과 보기</h2>
    <p className="mt-1 text-xs text-gray-500">목적지와 날짜를 선택하면 검색 조건이 더 정확해져요.</p>
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {(Object.keys(labels) as SearchField[]).filter(field => tripType !== "oneway" || field !== "returnDate").map(field => {
        const state = search[field];
        if (state.status !== "resolved") return null;
        const locked = field === "origin" && state.source === "query";
        return <button type="button" key={field} disabled={locked} onClick={() => setManual(prev => ({ ...prev, [field]: !prev[field] }))}
          className="rounded-full border border-gray-200 bg-white px-3 py-2 disabled:text-gray-600">
          {labels[field]}: {typeof state.value === "string" ? state.value : state.value.name}{!locked && " · 변경"}
        </button>;
      })}
    </div>
    {groups.map(group => {
      const state = search[group.field];
      return <div key={group.field} className="mt-4">
      <p className="text-sm font-medium">{group.label} <span className="font-normal text-gray-500">{group.status === "missing" ? "선택 필요" : "확인 필요"}</span></p>
      {state.status === "ambiguous" && <p className="mt-1 text-xs text-gray-500">{state.reason}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {group.items.map((item, index) => <button type="button" key={index} className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-100"
          onClick={() => item.kind === "manual" ? setManual(prev => ({ ...prev, [group.field]: true })) : onSelect(group.field, item.value)}>{item.label}</button>)}
      </div>
      {(group.showPicker || manual[group.field]) && <div className="mt-3">{picker(group.field)}</div>}
    </div>;
    })}
    {(Object.keys(labels) as SearchField[]).filter(field => search[field].status === "resolved" && manual[field] && (tripType !== "oneway" || field !== "returnDate")).map(field => <div key={field} className="mt-3">{picker(field)}</div>)}
    {search.issues.map(issue => <p key={issue} role="status" className="mt-3 text-xs text-amber-700">{issue}</p>)}
  </section>;
}
