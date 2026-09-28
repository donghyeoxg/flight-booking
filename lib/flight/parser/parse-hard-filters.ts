// lib/flight/parser/parse-hard-filters.ts

import type {
    HardFilters,
  } from "../types";
  
  function parseMaxPrice(
    text: string
  ): number | undefined {
    const manWonMatch =
      text.match(
        /(\d+)\s*만원\s*(이하|까지|안쪽|내외)?/
      );
  
    if (manWonMatch) {
      return (
        Number(manWonMatch[1]) * 10000
      );
    }
  
    const wonMatch =
      text.match(
        /(\d{5,})\s*원\s*(이하|까지|안쪽)?/
      );
  
    if (wonMatch) {
      return Number(
        wonMatch[1]
      );
    }
  
    return undefined;
  }
  
  export function parseHardFilters(
    text: string
  ) {
    const filters: HardFilters = {};
  
    const detectedPreferences:
      string[] = [];
  
    // 가격 상한
    const maxPrice =
      parseMaxPrice(text);
  
    if (maxPrice) {
      filters.maxPrice =
        maxPrice;
  
      detectedPreferences.push(
        "maxPrice"
      );
    }
  
    // 무조건 직항
    if (
      text.includes("무조건 직항") ||
      text.includes("직항만") ||
      text.includes("환승 싫")
    ) {
      filters.directOnly = true;
  
      detectedPreferences.push(
        "directOnly"
      );
    }
  
    // A380 강제 조건
    if (
      text.includes("무조건 a380") ||
      text.includes("a380만")
    ) {
      filters.requiredAircraft =
        "A380";
  
      detectedPreferences.push(
        "requiredAircraft"
      );
    }
  
    return {
      filters,
      detectedPreferences,
    };
  }