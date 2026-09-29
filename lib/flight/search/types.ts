export type FieldState<T> =
  | { status: "resolved"; value: T; source: "query" | "selection" | "default"; raw?: string }
  | { status: "ambiguous"; raw: string; reason: string; candidates: T[] }
  | { status: "missing" };

export type Place = {
  id: string;
  kind: "country" | "region" | "city" | "airport";
  name: string;
  countryCode?: string;
  parentIds: string[];
  airportCodes: string[];
  aliases: string[];
  tags: string[];
  /** Editorial ranking (0–100), not live demand. */
  popularity: number;
  description: string;
};

/** Store vectors separately from the small client-side directory. */
export type DestinationEmbedding = {
  destinationId: string;
  model: string;
  dimensions: number;
  contentVersion: string;
  vector: number[];
};

export type RequiredSearch = {
  origin: FieldState<Place>;
  destination: FieldState<Place>;
  departureDate: FieldState<string>;
  returnDate: FieldState<string>;
  ready: boolean;
  issues: string[];
};
export type SearchField = "origin" | "destination" | "departureDate" | "returnDate";
export type SearchSelections = Partial<Record<SearchField, string>>;
export type SearchOptions = SearchSelections & {
  today?: string;
  defaultOrigin?: string;
  tripType?: string;
};
export type Suggestion =
  | { kind: "select"; label: string; value: string }
  | { kind: "manual"; label: "직접 설정하기"; control: "place-picker" | "date-picker" };
export type SuggestionGroup = {
  field: SearchField;
  status: "ambiguous" | "missing";
  label: string;
  showPicker: boolean;
  items: Suggestion[];
};
