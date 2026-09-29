// lib/flight/parser/parse-hard-filters.ts

import type {
  HardFilters,
} from "../types";

/*
 * 가격 상한 파싱
 *
 * 예:
 * 30만원 이하
 * 30만원까지
 * 300000원 이하
 */
function parseMaxPrice(
  text: string
): number | undefined {
  const manWonMatch =
    text.match(
      /(\d+)\s*만원\s*(이하|까지|안쪽|내외)?/
    );

  if (manWonMatch) {
    return (
      Number(manWonMatch[1]) *
      10000
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

/*
 * 항공기 기종명을 내부에서 사용할
 * 일정한 형식으로 변환한다.
 *
 * 예:
 *
 * a350
 * Airbus A350
 * 에어버스 a350
 * → A350
 *
 * boeing 787
 * 보잉 787
 * b787
 * → B787
 */
function parseAircraftModel(
  text: string
): string | undefined {
  const normalized =
    text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  /*
   * --------------------------------
   * Airbus
   * --------------------------------
   *
   * 지원 예:
   *
   * A220
   * A320
   * A321
   * A321neo
   * A330
   * A340
   * A350
   * A350-900
   * A350-1000
   * A380
   *
   * Airbus A350
   * 에어버스 A350
   * 에어버스 350
   */

  const airbusMatch =
    normalized.match(
      /(?:airbus\s*|에어버스\s*)?(a(?:220|300|310|318|319|320|321|330|340|350|380)(?:-\d{3,4})?(?:\s*neo)?)/i
    );

  if (airbusMatch) {
    return airbusMatch[1]
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace("NEO", "neo");
  }

  /*
   * "에어버스 350"
   * "airbus 350"
   *
   * A가 생략된 경우
   */
  const airbusWithoutPrefixMatch =
    normalized.match(
      /(?:airbus|에어버스)\s*(220|300|310|318|319|320|321|330|340|350|380)(?:-(\d{3,4}))?(?:\s*(neo))?/i
    );

  if (airbusWithoutPrefixMatch) {
    let aircraft =
      `A${airbusWithoutPrefixMatch[1]}`;

    if (
      airbusWithoutPrefixMatch[2]
    ) {
      aircraft +=
        `-${airbusWithoutPrefixMatch[2]}`;
    }

    if (
      airbusWithoutPrefixMatch[3]
    ) {
      aircraft += "neo";
    }

    return aircraft;
  }

  /*
   * --------------------------------
   * Boeing
   * --------------------------------
   *
   * 지원 예:
   *
   * B737
   * 737 MAX
   * 737 MAX 8
   * B747
   * B777
   * B777-300ER
   * B787
   * B787-9
   *
   * Boeing 787
   * 보잉 787
   */

  const boeingWithPrefixMatch =
    normalized.match(
      /(?:boeing\s*|보잉\s*|b)(707|717|727|737|747|757|767|777|787)(?:-(\d{1,3}))?(?:\s*(max(?:\s*\d+)?|er))?/i
    );

  if (boeingWithPrefixMatch) {
    let aircraft =
      `B${boeingWithPrefixMatch[1]}`;

    if (
      boeingWithPrefixMatch[2]
    ) {
      aircraft +=
        `-${boeingWithPrefixMatch[2]}`;
    }

    if (
      boeingWithPrefixMatch[3]
    ) {
      const suffix =
        boeingWithPrefixMatch[3]
          .toUpperCase()
          .replace(/\s+/g, " ");

      /*
       * 777-300 ER → B777-300ER
       */
      if (
        suffix === "ER" &&
        boeingWithPrefixMatch[2]
      ) {
        aircraft += "ER";
      } else {
        aircraft +=
          ` ${suffix}`;
      }
    }

    return aircraft;
  }

  /*
   * 사용자가 제조사 / B를 생략하고
   * Boeing 기종 숫자만 말하는 경우.
   *
   * 단순 숫자를 기종으로 오인하지 않도록
   * "타다 / 기종 / 비행기" 같은 문맥이
   * 있을 때만 인정한다.
   *
   * 예:
   *
   * 787 타고 싶어
   * 777-300ER 타보기
   * 737 MAX 타보고 싶어
   */
  const hasAircraftContext =
    /타고|타보|타기|기종|비행기|항공기/.test(
      normalized
    );

  if (hasAircraftContext) {
    const bareBoeingMatch =
      normalized.match(
        /\b(707|717|727|737|747|757|767|777|787)(?:-(\d{1,3}))?(?:\s*(max(?:\s*\d+)?|er))?\b/i
      );

    if (bareBoeingMatch) {
      let aircraft =
        `B${bareBoeingMatch[1]}`;

      if (
        bareBoeingMatch[2]
      ) {
        aircraft +=
          `-${bareBoeingMatch[2]}`;
      }

      if (
        bareBoeingMatch[3]
      ) {
        const suffix =
          bareBoeingMatch[3]
            .toUpperCase()
            .replace(/\s+/g, " ");

        if (
          suffix === "ER" &&
          bareBoeingMatch[2]
        ) {
          aircraft += "ER";
        } else {
          aircraft +=
            ` ${suffix}`;
        }
      }

      return aircraft;
    }
  }

  /*
   * --------------------------------
   * Embraer
   * --------------------------------
   *
   * 예:
   *
   * E170
   * E175
   * E190
   * E195
   * E190-E2
   * E195-E2
   * 엠브라에르 E190
   */
  const embraerMatch =
    normalized.match(
      /(?:embraer\s*|엠브라에르\s*)?(e(?:170|175|190|195)(?:-e2)?)/i
    );

  if (embraerMatch) {
    return embraerMatch[1]
      .toUpperCase();
  }

  /*
   * --------------------------------
   * Bombardier / CRJ
   * --------------------------------
   *
   * 예:
   *
   * CRJ700
   * CRJ900
   * CRJ1000
   */
  const crjMatch =
    normalized.match(
      /\b(crj(?:100|200|550|700|900|1000))\b/i
    );

  if (crjMatch) {
    return crjMatch[1]
      .toUpperCase();
  }

  return undefined;
}

/*
 * 사용자가 특정 기종을 언급했지만
 * 그것을 반드시 타야 한다는 뜻이 아닌 경우.
 *
 * 이런 표현은 hard filter로 만들지 않는다.
 */
function isAircraftOptional(
  text: string
): boolean {
  return (
    /아니어도/.test(text) ||
    /아니여도/.test(text) ||
    /상관없/.test(text) ||
    /꼭.*아니/.test(text) ||
    /굳이.*아니/.test(text) ||
    /이면 좋지만/.test(text) ||
    /이면 좋긴/.test(text) ||
    /말고도 괜찮/.test(text)
  );
}

export function parseHardFilters(
  text: string
) {
  const filters: HardFilters = {};

  const detectedPreferences:
    string[] = [];

  /*
   * 1. 가격 상한
   */
  const maxPrice =
    parseMaxPrice(text);

  if (maxPrice) {
    filters.maxPrice =
      maxPrice;

    detectedPreferences.push(
      "maxPrice"
    );
  }

  /*
   * 2. 직항 강제 조건
   */
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

  /*
   * 3. 특정 항공기 기종
   *
   * 기존:
   *
   * A380만 별도로 처리
   *
   * 변경:
   *
   * 사용자가 특정 기종을 명시했다면
   * 일반적으로 requiredAircraft로 처리
   *
   * 예:
   *
   * A380 타보기
   * → A380
   *
   * A350 타고 싶어
   * → A350
   *
   * 보잉 787 타고 싶어
   * → B787
   *
   * 787-9 타보기
   * → B787-9
   *
   * E190 타고 싶어
   * → E190
   *
   * 단,
   *
   * "A350이면 좋지만 아니어도 돼"
   *
   * 같은 표현은 hard filter로 만들지 않는다.
   */
  const aircraft =
    parseAircraftModel(text);

  if (
    aircraft &&
    !isAircraftOptional(text)
  ) {
    filters.requiredAircraft =
      aircraft;

    detectedPreferences.push(
      "requiredAircraft"
    );
  }

  return {
    filters,
    detectedPreferences,
  };
}