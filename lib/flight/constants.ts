// lib/flight/constants.ts

import type { QualityWeights } from "./types";

export const BASIC_WEIGHTS: QualityWeights = {
  price: 30,
  connection: 20,
  reliability: 15,
  airportAccess: 10,
  schedule: 10,
  baggage: 5,
  cabinComfort: 10,
};

// 실제 API 연결 전까지 사용하는 테스트 가격
export const MOCK_MARKET_MEDIAN_PRICE = 350000;