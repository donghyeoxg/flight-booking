import type { Flight } from "../types";
import type { RequiredSearch } from "./types";

/** Unknown fields leave discovery open; cities cover all their airports.
 * Mock flights have no operating dates, so date availability cannot be filtered here. */
export function matchesRoute(flight: Flight, search: RequiredSearch): boolean {
  return (["origin", "destination"] as const).every(field => {
    const state = search[field];
    return state.status !== "resolved" || state.value.airportCodes.includes(flight[field]);
  });
}
