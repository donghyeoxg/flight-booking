"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchRefinements } from "./search-refinements";
import { parseRequiredSearch } from "@/lib/flight/search/parse-required-search";
import type { SearchSelections } from "@/lib/flight/search/types";

export function ResultsRefinements({ query, tripType, today, initial, searchParams }: {
  query: string;
  tripType: string;
  today: string;
  initial: SearchSelections;
  searchParams: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const search = parseRequiredSearch(query, { ...selected, defaultOrigin: "seoul", tripType, today });
  return <div>
    <SearchRefinements search={search} tripType={tripType} onSelect={(field, value) => {
      setSelected(previous => ({ ...previous, [field]: value }));
      setDirty(true);
    }} />
    {dirty && <button type="button" className="mt-3 rounded-xl bg-black px-4 py-2 text-sm text-white" onClick={() => {
      const params = new URLSearchParams(searchParams);
      for (const field of ["origin", "destination", "departureDate", "returnDate"] as const) {
        if (selected[field] && (field !== "returnDate" || tripType !== "oneway")) params.set(field, selected[field]!);
        else params.delete(field);
      }
      router.push(`/results?${params.toString()}`);
    }}>선택한 조건으로 다시 검색</button>}
  </div>;
}
