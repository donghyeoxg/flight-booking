// lib/flight/filters/passes-hard-filters.ts

import type {
    Flight,
    UserPreference,
  } from "../types";
  
  export function passesHardFilters(
    flight: Flight,
    preference: UserPreference
  ) {
    const filters =
      preference.filters;
  
    if (
      filters.maxPrice !== undefined &&
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