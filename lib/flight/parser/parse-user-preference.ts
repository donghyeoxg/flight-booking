// lib/flight/parser/parse-user-preference.ts

import type {
  UserPreference,
} from "../types";

import {
  normalizeQuery,
} from "./text-utils";

import {
  normalizeWeights,
  parseQualityWeights,
} from "./parse-quality-weights";

import {
  parseExperiences,
} from "./parse-experiences";

import {
  parseHardFilters,
} from "./parse-hard-filters";

export function parseUserPreference(
  query: string
): UserPreference {
  const text =
    normalizeQuery(query);

  /*
   * 1. 기존 Rule Parser 실행
   */
  const qualityResult =
    parseQualityWeights(text);

  const experienceResult =
    parseExperiences(text);

  const filterResult =
    parseHardFilters(text);

  /*
   * 2. Quality weight 계산
   */
  const weights = {
    ...qualityResult.weights,
  };

  // directOnly는 단순 선호가 아니라
  // 실제 hard filter이므로 connection 중요도도 높인다.
  if (
    filterResult.filters.directOnly
  ) {
    weights.connection *= 2;
  }

  const normalizedWeights =
    normalizeWeights(weights);

  /*
   * 3. Rule Parser가 인식한 preference 통합
   */
  const detectedPreferences = [
    ...qualityResult.detectedPreferences,
    ...experienceResult.detectedPreferences,
    ...filterResult.detectedPreferences,
  ];

  /*
   * 4. Experience 중요도 계산
   */
  const experienceImportance =
    experienceResult.desiredExperiences.reduce(
      (sum, experience) =>
        sum +
        experience.importance,
      0
    );

  let intentWeight = 0.1;

  intentWeight +=
    experienceImportance * 0.2;

  intentWeight =
    Math.min(
      intentWeight,
      0.7
    );

  /*
   * 5. Rule Parser가 처리하기 어려운
   *    복합 / 맥락 의존 표현 탐지
   *
   * 여기서 중요한 점:
   *
   * 이 표현을 Rule Parser가 직접 해석하려는 것이 아니다.
   *
   * "이 문장은 단순 keyword matching으로
   * 안전하게 이해하기 어렵다"
   *
   * 라고 판단하기 위한 fallback signal이다.
   */
  const complexIntentPatterns = [
    // 가격 ↔ 다른 조건 trade-off
    /더 내더라도/,
    /더 내도/,
    /돈 좀 더/,
    /몇 만원 차이/,
    /가격 차이/,
    /차이면/,

    // 조건부 허용
    /해도 되는데/,
    /해도 되지만/,
    /괜찮은데/,
    /괜찮지만/,

    // 피로 / 편안함의 복합적인 표현
    /덜 피곤/,
    /안 피곤/,
    /편한 게/,
    /편했으면/,
    /불편하지 않/,
    /오래 타/,

    // 사용자 상황 / context
    /엄마랑/,
    /아빠랑/,
    /부모님/,
    /아이랑/,
    /애기랑/,
    /가족이랑/,
    /회사 끝나고/,
    /퇴근하고/,
    /키가 커/,

    // 정확한 시간 관계
    /너무 이르/,
    /너무 늦/,
    /도착.*늦/,
    /출발.*늦/,
    /출발.*이르/,

    // 환승의 세부 조건
    /기다리는 시간/,
    /대기 시간이/,
    /대기시간/,
    /환승 시간/,
    /환승시간/,
  ];

  const hasComplexIntent =
    complexIntentPatterns.some(
      (pattern) =>
        pattern.test(text)
    );

  /*
   * 6. Confidence 계산
   *
   * confidence는 단순히
   * "keyword를 몇 개 찾았는가"가 아니라
   *
   * Rule Parser가 문장 전체를
   * 얼마나 안전하게 이해했다고 보는가
   *
   * 를 의미한다.
   */
  const detectionCount =
    detectedPreferences.length;

  let confidence = 0.4;

  if (
    detectionCount >= 1
  ) {
    confidence = 0.65;
  }

  if (
    detectionCount >= 2
  ) {
    confidence = 0.8;
  }

  if (
    detectionCount >= 4
  ) {
    confidence = 0.95;
  }

  /*
   * 일부 preference는 찾았더라도
   * 문장에 복합 의도가 포함되어 있다면
   * Rule Parser의 confidence를 낮춘다.
   *
   * 예:
   *
   * "엄마랑 가는 거라
   * 너무 이르지 않고 편한 비행이면 좋겠어"
   *
   * comfort 등의 keyword를 잡더라도
   * 전체 의도를 이해한 것은 아니다.
   */
  if (
    hasComplexIntent
  ) {
    confidence =
      Math.min(
        confidence,
        0.45
      );
  }

  /*
   * 7. LLM fallback 판정
   *
   * Rule Parser가 아무것도 찾지 못함
   * → LLM
   *
   * 복합 / 맥락 의존 표현 존재
   * → LLM
   *
   * 긴 문장인데 하나밖에 이해하지 못함
   * → LLM
   *
   * 그 외의 명확한 문장
   * → Rule Parser 사용
   */
  const isLongQuery =
    text.length >= 25;

  const shouldUseAI =
    detectionCount === 0 ||
    hasComplexIntent ||
    (
      isLongQuery &&
      detectionCount <= 1
    );

  /*
   * 8. 최종 UserPreference
   */
  return {
    qualityWeights:
      normalizedWeights,

    desiredExperiences:
      experienceResult
        .desiredExperiences,

    filters:
      filterResult.filters,

    qualityWeight:
      1 - intentWeight,

    intentWeight,

    originalQuery:
      query,

    confidence,

    shouldUseAI,

    detectedPreferences,

    // Rule Parser 단계에서는
    // 아직 별도로 저장하지 않는다.
    // 실제 LLM Parser가 unsupported intent를
    // 발견했을 때 채운다.
    unhandledPreferences: [],

    parserSource: "rule",
  };
}