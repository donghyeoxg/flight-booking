// lib/flight/parser/parse-quality-weights.ts

import { BASIC_WEIGHTS } from "../constants";
import type { QualityWeights } from "../types";
import { applyPreferenceWeight } from "./text-utils";

type QualityKey = keyof QualityWeights;

export function normalizeWeights(
  weights: QualityWeights
): QualityWeights {
  const total =
    Object.values(weights).reduce(
      (sum, value) => sum + value,
      0
    );

  if (total === 0) {
    return {
      ...BASIC_WEIGHTS,
    };
  }

  return {
    price:
      (weights.price / total) * 100,

    connection:
      (weights.connection / total) * 100,

    reliability:
      (weights.reliability / total) * 100,

    airportAccess:
      (weights.airportAccess / total) * 100,

    schedule:
      (weights.schedule / total) * 100,

    baggage:
      (weights.baggage / total) * 100,

    cabinComfort:
      (weights.cabinComfort / total) * 100,
  };
}

export function parseQualityWeights(
  text: string
) {
  const weights: QualityWeights = {
    ...BASIC_WEIGHTS,
  };

  const detectedPreferences: string[] = [];

  function applyDimension(
    key: QualityKey,
    keywords: string[],
    detectionName: string
  ) {
    const oldWeight = weights[key];

    weights[key] =
      applyPreferenceWeight(
        text,
        keywords,
        weights[key]
      );

    if (
      weights[key] !== oldWeight
    ) {
      detectedPreferences.push(
        detectionName
      );
    }
  }

  // 가격
  applyDimension(
    "price",
    [
      "저렴",
      "싸",
      "싼",
      "가격",
      "가성비",
      "최저가",
    ],
    "price"
  );

  // 직항 / 환승
  applyDimension(
    "connection",
    [
      "직항",
      "환승",
      "논스톱",
    ],
    "connection"
  );

  // 지연 / 정시성
  applyDimension(
    "reliability",
    [
      "지연",
      "정시",
      "연착",
      "안 늦",
      "늦지",
    ],
    "reliability"
  );

  // 공항 접근성
  applyDimension(
    "airportAccess",
    [
      "도심",
      "공항 접근",
      "접근성",
      "시내 가까",
      "시내에서 가까",
      "공항 이동",
    ],
    "airportAccess"
  );

  // 시간대
  applyDimension(
    "schedule",
    [
      "새벽",
      "아침",
      "오전",
      "오후",
      "밤",
      "저녁",
      "시간대",
    ],
    "schedule"
  );

  // 기존 새벽 회피 로직 유지
  if (
    text.includes("새벽 싫") ||
    text.includes("새벽 비행 싫") ||
    text.includes("새벽은 싫")
  ) {
    weights.schedule *= 2;

    detectedPreferences.push(
      "avoidRedEye"
    );
  }

  // 수하물
  applyDimension(
    "baggage",
    [
      "수하물",
      "짐",
      "캐리어",
    ],
    "baggage"
  );

  // 좌석 / 편안함
  applyDimension(
    "cabinComfort",
    [
      "편한",
      "편안",
      "좌석",
      "넓은",
      "넓었",
      "쾌적",
    ],
    "cabinComfort"
  );

  return {
    weights,
    detectedPreferences,
  };
}