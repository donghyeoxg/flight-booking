// lib/flight/types.ts

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
  
  export type QualityWeights = {
    price: number;
    connection: number;
    reliability: number;
    airportAccess: number;
    schedule: number;
    baggage: number;
    cabinComfort: number;
  };
  
  export type ExperiencePreference = {
    tag: string;
  
    // 0 ~ 1
    importance: number;
  };
  
  export type HardFilters = {
    maxPrice?: number;
  
    directOnly?: boolean;
  
    requiredAircraft?: string;
  };
  
  export type UserPreference = {
    qualityWeights: QualityWeights;
  
    desiredExperiences: ExperiencePreference[];
  
    filters: HardFilters;
  
    // 일반적인 항공편 품질 중요도
    qualityWeight: number;
  
    // 사용자가 말한 특별 경험 중요도
    intentWeight: number;
  
    originalQuery: string;
  
    // AI fallback 판단용
    confidence: number;
    shouldUseAI: boolean;
  
    // 개발 중 어떤 규칙이 잡혔는지 확인
    detectedPreferences: string[];
  };
  
  export type FlightScore = {
    finalScore: number;
    qualityScore: number;
    intentScore: number;
  };
  
  export type ScoredFlight = Flight & FlightScore;