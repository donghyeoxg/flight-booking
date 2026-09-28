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
  
    const qualityResult =
      parseQualityWeights(text);
  
    const experienceResult =
      parseExperiences(text);
  
    const filterResult =
      parseHardFilters(text);
  
    const weights = {
      ...qualityResult.weights,
    };
  
    // 기존 코드와 동일하게
    // directOnly면 connection 중요도를 추가 상승
    if (
      filterResult.filters.directOnly
    ) {
      weights.connection *= 2;
    }
  
    const normalizedWeights =
      normalizeWeights(weights);
  
    const detectedPreferences = [
      ...qualityResult.detectedPreferences,
      ...experienceResult.detectedPreferences,
      ...filterResult.detectedPreferences,
    ];
  
    // 특별 경험 중요도
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
  
    // confidence
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
  
    // AI fallback
    const isLongQuery =
      text.length >= 25;
  
    const shouldUseAI =
      detectionCount === 0 ||
      (
        isLongQuery &&
        detectionCount <= 1
      );
  
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
    };
  }