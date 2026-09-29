// lib/flight/filters/passes-hard-filters.ts

import type {
  Flight,
  UserPreference,
} from "../types";

/*
 * 항공기 기종 문자열을 비교하기 쉬운 형태로 정규화
 *
 * 예:
 *
 * "Boeing 787-9"
 * "보잉 787-9"
 * "B787-9"
 * → "B7879"
 *
 * "Airbus A350-1000"
 * "에어버스 A350-1000"
 * "A350-1000"
 * → "A3501000"
 */
function normalizeAircraftName(
  aircraft: string
): string {
  return aircraft
    .toUpperCase()

    // 제조사 이름 정규화
    .replace(/BOEING\s*/g, "B")
    .replace(/보잉\s*/g, "B")

    .replace(/AIRBUS\s*/g, "")
    .replace(/에어버스\s*/g, "")

    .replace(/EMBRAER\s*/g, "")
    .replace(/엠브라에르\s*/g, "")

    // 비교에 필요 없는 구분자 제거
    .replace(/[\s\-_/]/g, "");
}

/*
 * 사용자가 요구한 기종과
 * 실제 항공편의 기종이 일치하는지 확인
 *
 * 중요한 규칙:
 *
 * required = B787
 *
 * actual:
 * B787-8   → true
 * B787-9   → true
 * B787-10  → true
 * B777     → false
 *
 *
 * required = B787-9
 *
 * actual:
 * B787-9   → true
 * B787-10  → false
 */
function matchesAircraft(
  actualAircraft: string,
  requiredAircraft: string
): boolean {
  const actual =
    normalizeAircraftName(
      actualAircraft
    );

  const required =
    normalizeAircraftName(
      requiredAircraft
    );

  /*
   * required가 actual의 앞부분과 일치하면 통과.
   *
   * 예:
   *
   * required: B787
   * actual:   B7879
   *
   * → true
   *
   *
   * required: B7879
   * actual:   B78710
   *
   * → false
   */
  return actual.startsWith(
    required
  );
}

export function passesHardFilters(
  flight: Flight,
  preference: UserPreference
): boolean {
  const filters =
    preference.filters;

  /*
   * 가격 상한
   */
  if (
    filters.maxPrice !== undefined &&
    flight.price >
      filters.maxPrice
  ) {
    return false;
  }

  /*
   * 직항만
   */
  if (
    filters.directOnly &&
    flight.stops !== 0
  ) {
    return false;
  }

  /*
   * 특정 항공기 기종
   */
  if (
    filters.requiredAircraft &&
    !matchesAircraft(
      flight.aircraft,
      filters.requiredAircraft
    )
  ) {
    return false;
  }

  return true;
}