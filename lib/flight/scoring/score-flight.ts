// lib/flight/scoring/score-flight.ts

import type {
    Flight,
    FlightScore,
    UserPreference,
  } from "../types";
  
  import {
    calculateQualityScore,
  } from "./quality-score";
  
  import {
    calculateIntentScore,
  } from "./intent-score";
  
  export function scoreFlight(
    flight: Flight,
    preference: UserPreference,
    marketMedianPrice: number
  ): FlightScore {
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