// lib/flight/parser/parse-experiences.ts

import type {
    ExperiencePreference,
  } from "../types";
  
  import {
    getContextAroundKeyword,
    getIntensityMultiplier,
    isLowImportanceContext,
  } from "./text-utils";
  
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
  
      if (
        isLowImportanceContext(context)
      ) {
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
  
  export function parseExperiences(
    text: string
  ) {
    const desiredExperiences:
      ExperiencePreference[] = [];
  
    const detectedPreferences: string[] = [];
  
    const definitions = [
      {
        tag: "mt_fuji",
        keywords: [
          "후지산",
          "후지 산",
        ],
      },
      {
        tag: "a380",
        keywords: [
          "a380",
          "에이380",
          "에이삼팔공",
        ],
      },
      {
        tag: "night_view",
        keywords: [
          "야경",
          "밤 풍경",
          "도시 불빛",
        ],
      },
      {
        tag: "sunset",
        keywords: [
          "일몰",
          "노을",
          "석양",
        ],
      },
      {
        tag: "special_route",
        keywords: [
          "특별한 노선",
          "특이한 노선",
          "희귀 노선",
        ],
      },
    ];
  
    for (
      const definition of definitions
    ) {
      const experience =
        detectExperience(
          text,
          definition.keywords,
          definition.tag
        );
  
      if (!experience) {
        continue;
      }
  
      desiredExperiences.push(
        experience
      );
  
      detectedPreferences.push(
        definition.tag
      );
    }
  
    return {
      desiredExperiences,
      detectedPreferences,
    };
  }