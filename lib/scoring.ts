// lib/scoring.ts

// ============================================
// 1. 항공편 데이터 구조
// ============================================

export type Flight = {
    id: number;
  
    airline: string;
    flightNumber: string;
  
    origin: string;
    destination: string;
  
    price: number;
  
    stops: number;
    averageDelayMinutes: number;
  
    airportAccessMinutes: number;
    departureHour: number;
  
    baggageKg: number;
    cabinComfortScore: number;
  
    aircraft: string;
  
    experiences: string[];
  };
  
  
  // ============================================
  // 2. 항공편 품질 평가 가중치
  // ============================================
  
  export type QualityWeights = {
    price: number;
    connection: number;
    reliability: number;
    airportAccess: number;
    schedule: number;
    baggage: number;
    cabinComfort: number;
  };
  
  
  // ============================================
  // 3. 특별 경험 선호도
  // ============================================
  
  export type ExperiencePreference = {
    tag: string;
  
    // 0 ~ 1
    importance: number;
  };
  
  
  // ============================================
  // 4. 검색 시 강제 조건
  // ============================================
  
  export type HardFilters = {
    maxPrice?: number;
  
    directOnly?: boolean;
  
    requiredAircraft?: string;
  };
  
  
  // ============================================
  // 5. 사용자 선호 구조
  // ============================================
  
  export type UserPreference = {
    qualityWeights: QualityWeights;
  
    desiredExperiences: ExperiencePreference[];
  
    filters: HardFilters;
  
    // 일반적인 항공편 품질의 중요도
    qualityWeight: number;
  
    // 사용자가 말한 특별 조건의 중요도
    intentWeight: number;
  
    originalQuery: string;
  
    // 나중에 AI fallback 판단용
    confidence: number;
    shouldUseAI: boolean;
  
    // 개발 중 어떤 규칙이 잡혔는지 확인
    detectedPreferences: string[];
  };
  
  
  // ============================================
  // 6. 기본 가중치
  // ============================================
  
  export const BASIC_WEIGHTS: QualityWeights = {
    price: 30,
    connection: 20,
    reliability: 15,
    airportAccess: 10,
    schedule: 10,
    baggage: 5,
    cabinComfort: 10,
  };
  
  
  // ============================================
  // 7. 점수 정규화 함수
  // ============================================
  
  function getPriceScore(
    price: number,
    marketMedianPrice: number
  ) {
    const ratio = price / marketMedianPrice;
  
    if (ratio <= 0.75) return 100;
    if (ratio <= 0.9) return 90;
    if (ratio <= 1.0) return 80;
    if (ratio <= 1.1) return 70;
    if (ratio <= 1.25) return 50;
    if (ratio <= 1.5) return 25;
  
    return 10;
  }
  
  
  function getConnectionScore(stops: number) {
    if (stops === 0) return 100;
  
    if (stops === 1) return 70;
  
    if (stops === 2) return 30;
  
    return 10;
  }
  
  
  function getReliabilityScore(
    averageDelayMinutes: number
  ) {
    if (averageDelayMinutes <= 15) return 100;
    if (averageDelayMinutes <= 30) return 80;
    if (averageDelayMinutes <= 45) return 65;
    if (averageDelayMinutes <= 60) return 50;
    if (averageDelayMinutes <= 90) return 30;
    if (averageDelayMinutes <= 120) return 15;
  
    return 5;
  }
  
  
  function getAirportAccessScore(
    minutes: number
  ) {
    if (minutes <= 30) return 100;
    if (minutes <= 45) return 90;
    if (minutes <= 60) return 75;
    if (minutes <= 75) return 60;
    if (minutes <= 90) return 45;
  
    return 30;
  }
  
  
  function getScheduleScore(
    hour: number
  ) {
    if (hour >= 7 && hour <= 21) {
      return 100;
    }
  
    if (hour >= 5 && hour < 7) {
      return 75;
    }
  
    if (hour > 21 && hour < 24) {
      return 80;
    }
  
    return 55;
  }
  
  
  function getBaggageScore(
    kg: number
  ) {
    if (kg >= 23) return 100;
    if (kg >= 15) return 80;
    if (kg > 0) return 60;
  
    return 30;
  }
  
  
  // ============================================
  // 8. 가중치를 합계 100으로 정규화
  // ============================================
  
  function normalizeWeights(
    weights: QualityWeights
  ): QualityWeights {
    const total =
      Object.values(weights).reduce(
        (sum, value) => sum + value,
        0
      );
  
    if (total === 0) {
      return BASIC_WEIGHTS;
    }
  
    return {
      price: (weights.price / total) * 100,
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
  
  
  // ============================================
  // 9. 문장에서 주변 문맥 가져오기
  // ============================================
  
  function getContextAroundKeyword(
    text: string,
    keyword: string,
    radius = 14
  ) {
    const index = text.indexOf(keyword);
  
    if (index === -1) {
      return "";
    }
  
    const start = Math.max(
      0,
      index - radius
    );
  
    const end = Math.min(
      text.length,
      index + keyword.length + radius
    );
  
    return text.slice(start, end);
  }
  
  
  // ============================================
  // 10. 강조 표현 판별
  // ============================================
  
  function getIntensityMultiplier(
    context: string
  ) {
    const extremeWords = [
      "무조건",
      "제일",
      "가장",
      "최대한",
      "최우선",
      "절대",
      "겁나",
      "엄청",
      "무조건적으로",
    ];
  
    const strongWords = [
      "꼭",
      "많이",
      "매우",
      "진짜",
      "되도록이면",
      "중요해",
      "중요함",
    ];
  
    const weakWords = [
      "가능하면",
      "되면",
      "조금",
      "약간",
      "있으면 좋겠",
    ];
  
    if (
      extremeWords.some((word) =>
        context.includes(word)
      )
    ) {
      return 3;
    }
  
    if (
      strongWords.some((word) =>
        context.includes(word)
      )
    ) {
      return 2;
    }
  
    if (
      weakWords.some((word) =>
        context.includes(word)
      )
    ) {
      return 1.2;
    }
  
    return 1.5;
  }
  
  
  // ============================================
  // 11. "상관없음" 판단
  // ============================================
  
  function isLowImportanceContext(
    context: string
  ) {
    const expressions = [
      "상관없",
      "아무거나",
      "중요하지 않",
      "신경 안",
      "신경안",
      "관계없",
    ];
  
    return expressions.some((expression) =>
      context.includes(expression)
    );
  }
  
  
  // ============================================
  // 12. 특정 품질 항목 가중치 조정
  // ============================================
  
  function applyPreferenceWeight(
    text: string,
    keywords: string[],
    currentWeight: number
  ) {
    for (const keyword of keywords) {
      if (!text.includes(keyword)) {
        continue;
      }
  
      const context =
        getContextAroundKeyword(
          text,
          keyword
        );
  
      if (isLowImportanceContext(context)) {
        return currentWeight * 0.25;
      }
  
      const multiplier =
        getIntensityMultiplier(context);
  
      return currentWeight * multiplier;
    }
  
    return currentWeight;
  }
  
  
  // ============================================
  // 13. 특별 경험 importance 계산
  // ============================================
  
  function detectExperience(
    text: string,
    keywords: string[],
    tag: string
  ): ExperiencePreference | null {
    for (const keyword of keywords) {
      if (!text.includes(keyword)) {
        continue;
      }
  
      const context =
        getContextAroundKeyword(
          text,
          keyword
        );
  
      if (isLowImportanceContext(context)) {
        return null;
      }
  
      const multiplier =
        getIntensityMultiplier(context);
  
      let importance = 0.7;
  
      if (multiplier >= 3) {
        importance = 1;
      } else if (multiplier >= 2) {
        importance = 0.9;
      } else if (multiplier <= 1.2) {
        importance = 0.5;
      }
  
      return {
        tag,
        importance,
      };
    }
  
    return null;
  }
  
  
  // ============================================
  // 14. "30만원 이하" 같은 가격 제한 파싱
  // ============================================
  
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
      return Number(wonMatch[1]);
    }
  
    return undefined;
  }
  
  
  // ============================================
  // 15. 사용자 자연어 파싱
  // ============================================
  
  export function parseUserPreference(
    query: string
  ): UserPreference {
    const text =
      query
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
  
    let weights: QualityWeights = {
      ...BASIC_WEIGHTS,
    };
  
    const detectedPreferences: string[] = [];
  
    const desiredExperiences:
      ExperiencePreference[] = [];
  
    const filters: HardFilters = {};
  
    // ----------------------------------------
    // 가격
    // ----------------------------------------
  
    const priceKeywords = [
      "저렴",
      "싸",
      "싼",
      "가격",
      "가성비",
      "최저가",
    ];
  
    const oldPriceWeight =
      weights.price;
  
    weights.price =
      applyPreferenceWeight(
        text,
        priceKeywords,
        weights.price
      );
  
    if (
      weights.price !== oldPriceWeight
    ) {
      detectedPreferences.push("price");
    }
  
  
    // ----------------------------------------
    // 직항 / 환승
    // ----------------------------------------
  
    const connectionKeywords = [
      "직항",
      "환승",
      "논스톱",
    ];
  
    const oldConnectionWeight =
      weights.connection;
  
    weights.connection =
      applyPreferenceWeight(
        text,
        connectionKeywords,
        weights.connection
      );
  
    if (
      weights.connection !==
      oldConnectionWeight
    ) {
      detectedPreferences.push(
        "connection"
      );
    }
  
    // "무조건 직항"
    if (
      text.includes("무조건 직항") ||
      text.includes("직항만") ||
      text.includes("환승 싫")
    ) {
      filters.directOnly = true;
  
      weights.connection *= 2;
  
      detectedPreferences.push(
        "directOnly"
      );
    }
  
  
    // ----------------------------------------
    // 지연 / 정시성
    // ----------------------------------------
  
    const reliabilityKeywords = [
      "지연",
      "정시",
      "연착",
      "안 늦",
      "늦지",
    ];
  
    const oldReliabilityWeight =
      weights.reliability;
  
    weights.reliability =
      applyPreferenceWeight(
        text,
        reliabilityKeywords,
        weights.reliability
      );
  
    if (
      weights.reliability !==
      oldReliabilityWeight
    ) {
      detectedPreferences.push(
        "reliability"
      );
    }
  
  
    // ----------------------------------------
    // 공항 접근성
    // ----------------------------------------
  
    const airportKeywords = [
      "도심",
      "공항 접근",
      "접근성",
      "시내 가까",
      "시내에서 가까",
      "공항 이동",
    ];
  
    const oldAirportWeight =
      weights.airportAccess;
  
    weights.airportAccess =
      applyPreferenceWeight(
        text,
        airportKeywords,
        weights.airportAccess
      );
  
    if (
      weights.airportAccess !==
      oldAirportWeight
    ) {
      detectedPreferences.push(
        "airportAccess"
      );
    }
  
  
    // ----------------------------------------
    // 시간대
    // ----------------------------------------
  
    const scheduleKeywords = [
      "새벽",
      "아침",
      "오전",
      "오후",
      "밤",
      "저녁",
      "시간대",
    ];
  
    const oldScheduleWeight =
      weights.schedule;
  
    weights.schedule =
      applyPreferenceWeight(
        text,
        scheduleKeywords,
        weights.schedule
      );
  
    if (
      weights.schedule !==
      oldScheduleWeight
    ) {
      detectedPreferences.push(
        "schedule"
      );
    }
  
    // 새벽 싫다는 것은
    // 시간대 중요도가 높다는 뜻
    if (
      text.includes("새벽 싫") ||
      text.includes(
        "새벽 비행 싫"
      ) ||
      text.includes(
        "새벽은 싫"
      )
    ) {
      weights.schedule *= 2;
  
      detectedPreferences.push(
        "avoidRedEye"
      );
    }
  
  
    // ----------------------------------------
    // 수하물
    // ----------------------------------------
  
    const baggageKeywords = [
      "수하물",
      "짐",
      "캐리어",
    ];
  
    const oldBaggageWeight =
      weights.baggage;
  
    weights.baggage =
      applyPreferenceWeight(
        text,
        baggageKeywords,
        weights.baggage
      );
  
    if (
      weights.baggage !==
      oldBaggageWeight
    ) {
      detectedPreferences.push(
        "baggage"
      );
    }
  
  
    // ----------------------------------------
    // 좌석 / 편안함
    // ----------------------------------------
  
    const cabinKeywords = [
      "편한",
      "편안",
      "좌석",
      "넓은",
      "넓었",
      "쾌적",
    ];
  
    const oldCabinWeight =
      weights.cabinComfort;
  
    weights.cabinComfort =
      applyPreferenceWeight(
        text,
        cabinKeywords,
        weights.cabinComfort
      );
  
    if (
      weights.cabinComfort !==
      oldCabinWeight
    ) {
      detectedPreferences.push(
        "cabinComfort"
      );
    }
  
  
    // ----------------------------------------
    // 특별 경험
    // ----------------------------------------
  
    const fuji =
      detectExperience(
        text,
        [
          "후지산",
          "후지 산",
        ],
        "mt_fuji"
      );
  
    if (fuji) {
      desiredExperiences.push(fuji);
      detectedPreferences.push(
        "mt_fuji"
      );
    }
  
  
    const a380 =
      detectExperience(
        text,
        [
          "a380",
          "에이380",
          "에이삼팔공",
        ],
        "a380"
      );
  
    if (a380) {
      desiredExperiences.push(a380);
      detectedPreferences.push(
        "a380"
      );
    }
  
  
    const nightView =
      detectExperience(
        text,
        [
          "야경",
          "밤 풍경",
          "도시 불빛",
        ],
        "night_view"
      );
  
    if (nightView) {
      desiredExperiences.push(
        nightView
      );
  
      detectedPreferences.push(
        "night_view"
      );
    }
  
  
    const sunset =
      detectExperience(
        text,
        [
          "일몰",
          "노을",
          "석양",
        ],
        "sunset"
      );
  
    if (sunset) {
      desiredExperiences.push(
        sunset
      );
  
      detectedPreferences.push(
        "sunset"
      );
    }
  
  
    const specialRoute =
      detectExperience(
        text,
        [
          "특별한 노선",
          "특이한 노선",
          "희귀 노선",
        ],
        "special_route"
      );
  
    if (specialRoute) {
      desiredExperiences.push(
        specialRoute
      );
  
      detectedPreferences.push(
        "special_route"
      );
    }
  
  
    // ----------------------------------------
    // 가격 제한
    // ----------------------------------------
  
    const maxPrice =
      parseMaxPrice(text);
  
    if (maxPrice) {
      filters.maxPrice = maxPrice;
  
      detectedPreferences.push(
        "maxPrice"
      );
    }
  
  
    // ----------------------------------------
    // A380 강제 조건
    // ----------------------------------------
  
    if (
      text.includes(
        "무조건 a380"
      ) ||
      text.includes(
        "a380만"
      )
    ) {
      filters.requiredAircraft =
        "A380";
  
      detectedPreferences.push(
        "requiredAircraft"
      );
    }
  
  
    // ----------------------------------------
    // 가중치 정규화
    // ----------------------------------------
  
    weights =
      normalizeWeights(weights);
  
  
    // ----------------------------------------
    // 특별 경험 중요도 계산
    // ----------------------------------------
  
    const experienceImportance =
      desiredExperiences.reduce(
        (sum, experience) =>
          sum + experience.importance,
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
  
  
    // ----------------------------------------
    // confidence 계산
    // ----------------------------------------
  
    const detectionCount =
      detectedPreferences.length;
  
    let confidence = 0.4;
  
    if (detectionCount >= 1) {
      confidence = 0.65;
    }
  
    if (detectionCount >= 2) {
      confidence = 0.8;
    }
  
    if (detectionCount >= 4) {
      confidence = 0.95;
    }
  
  
    // ----------------------------------------
    // AI fallback 여부
    // ----------------------------------------
  
    const isLongQuery =
      text.length >= 25;
  
    const shouldUseAI =
      detectionCount === 0 ||
      (
        isLongQuery &&
        detectionCount <= 1
      );
  
  
    return {
      qualityWeights: weights,
  
      desiredExperiences,
  
      filters,
  
      qualityWeight:
        1 - intentWeight,
  
      intentWeight,
  
      originalQuery: query,
  
      confidence,
  
      shouldUseAI,
  
      detectedPreferences,
    };
  }
  
  
  // ============================================
  // 16. 기본 항공편 품질 점수
  // ============================================
  
  function calculateQualityScore(
    flight: Flight,
    weights: QualityWeights,
    marketMedianPrice: number
  ) {
    const scores = {
      price:
        getPriceScore(
          flight.price,
          marketMedianPrice
        ),
  
      connection:
        getConnectionScore(
          flight.stops
        ),
  
      reliability:
        getReliabilityScore(
          flight.averageDelayMinutes
        ),
  
      airportAccess:
        getAirportAccessScore(
          flight.airportAccessMinutes
        ),
  
      schedule:
        getScheduleScore(
          flight.departureHour
        ),
  
      baggage:
        getBaggageScore(
          flight.baggageKg
        ),
  
      cabinComfort:
        flight.cabinComfortScore,
    };
  
    const weightedScore =
      scores.price *
        weights.price +
  
      scores.connection *
        weights.connection +
  
      scores.reliability *
        weights.reliability +
  
      scores.airportAccess *
        weights.airportAccess +
  
      scores.schedule *
        weights.schedule +
  
      scores.baggage *
        weights.baggage +
  
      scores.cabinComfort *
        weights.cabinComfort;
  
    return (
      weightedScore / 100
    );
  }
  
  
  // ============================================
  // 17. 특별 경험 일치 점수
  // ============================================
  
  function calculateIntentScore(
    flight: Flight,
    desiredExperiences:
      ExperiencePreference[]
  ) {
    if (
      desiredExperiences.length === 0
    ) {
      return 100;
    }
  
    const totalImportance =
      desiredExperiences.reduce(
        (sum, experience) =>
          sum +
          experience.importance,
        0
      );
  
    if (totalImportance === 0) {
      return 100;
    }
  
    let matchedImportance = 0;
  
    for (
      const experience of
      desiredExperiences
    ) {
      if (
        flight.experiences.includes(
          experience.tag
        )
      ) {
        matchedImportance +=
          experience.importance;
      }
    }
  
    return (
      matchedImportance /
      totalImportance
    ) * 100;
  }
  
  
  // ============================================
  // 18. 강제 조건 만족 여부
  // ============================================
  
  export function passesHardFilters(
    flight: Flight,
    preference: UserPreference
  ) {
    const filters =
      preference.filters;
  
    if (
      filters.maxPrice !==
        undefined &&
      flight.price >
        filters.maxPrice
    ) {
      return false;
    }
  
    if (
      filters.directOnly &&
      flight.stops !== 0
    ) {
      return false;
    }
  
    if (
      filters.requiredAircraft &&
      !flight.aircraft
        .toLowerCase()
        .includes(
          filters.requiredAircraft
            .toLowerCase()
        )
    ) {
      return false;
    }
  
    return true;
  }
  
  
  // ============================================
  // 19. 최종 점수
  // ============================================
  
  export function scoreFlight(
    flight: Flight,
    preference: UserPreference,
    marketMedianPrice: number
  ) {
    const qualityScore =
      calculateQualityScore(
        flight,
        preference.qualityWeights,
        marketMedianPrice
      );
  
    const intentScore =
      calculateIntentScore(
        flight,
        preference.desiredExperiences
      );
  
    const finalScore =
      qualityScore *
        preference.qualityWeight +
  
      intentScore *
        preference.intentWeight;
  
    return {
      finalScore,
      qualityScore,
      intentScore,
    };
  }