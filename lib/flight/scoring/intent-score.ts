import type {
    ExperiencePreference,
    Flight,
  } from "../types";
  
  export function calculateIntentScore(
    flight: Flight,
    desiredExperiences: ExperiencePreference[]
  ) {
    if (desiredExperiences.length === 0) {
      return 100;
    }
  
    const totalImportance =
      desiredExperiences.reduce(
        (sum, experience) =>
          sum + experience.importance,
        0
      );
  
    if (totalImportance === 0) {
      return 100;
    }
  
    let matchedImportance = 0;
  
    for (const experience of desiredExperiences) {
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