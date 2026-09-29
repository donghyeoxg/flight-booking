// lib/flight/index.ts

export type {
    Flight,
    QualityWeights,
    ExperiencePreference,
    HardFilters,
    UserPreference,
    FlightScore,
    ScoredFlight,
  } from "./types";
  
  export {
    BASIC_WEIGHTS,
    MOCK_MARKET_MEDIAN_PRICE,
  } from "./constants";
  
  export {
    parseUserPreference,
  } from "./parser/parse-user-preference";
  
  export {
    passesHardFilters,
  } from "./filters/passes-hard-filters";
  
  export {
    scoreFlight,
  } from "./scoring/score-flight";
  
  export {
    mockFlights,
  } from "./data/mock-flights";

export { parseRequiredSearch } from "./search/parse-required-search";
export { buildSuggestions } from "./search/suggestions";
export type { RequiredSearch, FieldState, Place, SearchSelections, SuggestionGroup } from "./search/types";
