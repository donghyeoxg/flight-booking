// lib/flight/parser/parse-user-preference-with-fallback.ts

import type {
    UserPreference,
  } from "../types";
  
  import {
    parseUserPreference,
  } from "./parse-user-preference";
  
  import {
    parseUserPreferenceWithAI,
  } from "./parse-user-preference-with-ai";
  
  export async function parseUserPreferenceWithFallback(
    query: string
  ): Promise<UserPreference> {
    /*
     * 1. 항상 Rule Parser부터 실행
     */
    const rulePreference =
      parseUserPreference(query);
  
    /*
     * 빈 검색문은 굳이 OpenAI API를 호출하지 않는다.
     */
    if (!query.trim()) {
      return {
        ...rulePreference,
        shouldUseAI: false,
      };
    }
  
    /*
     * Rule Parser가 충분히 처리 가능한 경우
     * API 호출 없이 바로 반환
     */
    if (
      !rulePreference.shouldUseAI
    ) {
      return rulePreference;
    }
  
    /*
     * Rule Parser가 확신하지 못하는 경우에만
     * LLM Parser 호출
     */
    try {
      const aiPreference =
        await parseUserPreferenceWithAI(
          query
        );
  
      console.log(
        "[parser] LLM fallback used",
        {
          query,
          ruleDetected:
            rulePreference
              .detectedPreferences,
  
          llmDetected:
            aiPreference
              .detectedPreferences,
  
          unhandled:
            aiPreference
              .unhandledPreferences,
        }
      );
  
      return aiPreference;
    } catch (error) {
      /*
       * API 장애 / key 문제 등이 생겨도
       * 검색 페이지 전체가 죽지 않게
       * 기존 Rule 결과로 fallback
       */
      console.error(
        "[parser] LLM fallback failed",
        error
      );
  
      return rulePreference;
    }
  }