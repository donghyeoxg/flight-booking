import { ResultsRefinements } from "../components/results-refinements";
import { parseRequiredSearch } from "@/lib/flight/search/parse-required-search";
import { matchesRoute } from "@/lib/flight/search/matches-route";
import { koreaToday } from "@/lib/flight/search/dates";
import {
  MOCK_MARKET_MEDIAN_PRICE,
  mockFlights,
  passesHardFilters,
  scoreFlight,
} from "@/lib/flight";

import {
  parseUserPreferenceWithFallback,
} from "@/lib/flight/parser/parse-user-preference-with-fallback";

type ResultsPageProps = {
  searchParams: Promise<{
    q?: string;
    origin?: string;
    destination?: string;
    tripType?: string;
    travelers?: string;
    cabin?: string;
    departureDate?: string;
    returnDate?: string;
  }>;
};

const tripTypeLabels: Record<string, string> = {
  roundtrip: "왕복",
  oneway: "편도",
  multicity: "다구간",
};

const cabinLabels: Record<string, string> = {
  economy: "이코노미",
  premium: "프리미엄 이코노미",
  business: "비즈니스",
  first: "퍼스트",
};

function formatDate(date?: string) {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export default async function ResultsPage({
  searchParams,
}: ResultsPageProps) {
  const params = await searchParams;

  const query = params.q ?? "";
  const today = koreaToday();
  const tripKind = ["roundtrip", "oneway", "multicity"].includes(params.tripType ?? "") ? params.tripType! : "roundtrip";
  const required = parseRequiredSearch(query, { ...params, defaultOrigin: "seoul", tripType: tripKind, today });
  const serializedParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (typeof value === "string") serializedParams.set(key, value);

  const tripType =
    tripTypeLabels[params.tripType ?? "roundtrip"] ??
    "왕복";

  const travelers =
    params.travelers ?? "1";

  const cabin =
    cabinLabels[params.cabin ?? "economy"] ??
    "이코노미";

  const departureDate =
    formatDate(required.departureDate.status === "resolved" ? required.departureDate.value : undefined);

  const returnDate =
    formatDate(required.returnDate.status === "resolved" ? required.returnDate.value : undefined);

  let dateLabel = departureDate ? `${departureDate} → 귀국일 선택 필요` : "날짜 선택 필요";

  if (
    departureDate &&
    tripKind === "oneway"
  ) {
    dateLabel = departureDate;
  }

  if (
    departureDate &&
    returnDate &&
    tripKind === "roundtrip"
  ) {
    dateLabel = `${departureDate} → ${returnDate}`;
  }

  if (
    tripKind === "multicity"
  ) {
    dateLabel = "다구간";
  }

  const preference =
    await parseUserPreferenceWithFallback(
      query
    );
  
  console.log(
    "[parser result]",
    {
      query,
      source:
        preference.parserSource,
  
      confidence:
        preference.confidence,
  
      detected:
        preference
          .detectedPreferences,
  
      unhandled:
        preference
          .unhandledPreferences,
  
      filters:
        preference.filters,
  
      qualityWeights:
        preference.qualityWeights,
    }
  );

  // 하드 필터 → 점수 계산 → 최종 순위 정렬
  const scoredFlights =
    mockFlights
      .filter((flight) => matchesRoute(flight, required))
      .filter((flight) =>
        passesHardFilters(
          flight,
          preference
        )
      )
      .map((flight) => {
        const score =
          scoreFlight(
            flight,
            preference,
            MOCK_MARKET_MEDIAN_PRICE
          );

        return {
          ...flight,
          ...score,
        };
      })
      .sort(
        (a, b) =>
          b.finalScore -
          a.finalScore
      );

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="border-b border-gray-100 pb-8">
          <p className="text-sm text-gray-400">
            검색 결과
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {query || "항공편 검색"}
          </h1>

          <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
            <span>{tripType}</span>

            <span>·</span>

            <span>{dateLabel}</span>

            <span>·</span>

            <span>
              여행자 {travelers}명
            </span>

            <span>·</span>

            <span>{cabin}</span>
          </div>
        </div>

        <ResultsRefinements key={serializedParams.toString()} query={query} tripType={tripKind} today={today}
          initial={{ origin: params.origin, destination: params.destination, departureDate: params.departureDate, returnDate: params.returnDate }}
          searchParams={serializedParams.toString()} />
        <p className="mt-4 text-xs text-gray-500">
          {required.ready ? "검색 조건이 설정되었습니다. " : "장소와 날짜를 선택하면 검색 조건을 완성할 수 있어요. "}
          현재 결과는 예시 항공편이며, 선택한 날짜의 실제 운항 여부와 가격은 조회하지 않습니다.
        </p>

        <div className="mt-10">
          {scoredFlights.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-lg font-medium">
                조건에 맞는 항공편이 없습니다.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                선택한 노선의 예시 항공편이 없거나 선호 조건에 맞지 않습니다.
                목적지나 가격·직항 조건을 바꿔보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scoredFlights.map(
                (flight, index) => (
                  <div
                    key={flight.id}
                    className="rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400">
                            #{index + 1}
                          </span>

                          <h2 className="text-xl font-semibold">
                            {flight.airline}
                          </h2>

                          <span className="text-sm text-gray-400">
                            {
                              flight.flightNumber
                            }
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-gray-500">
                          {flight.origin} →{" "}
                          {flight.destination}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {flight.aircraft}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-semibold">
                          ₩
                          {flight.price.toLocaleString()}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Flight Score{" "}
                          {flight.finalScore.toFixed(
                            1
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-gray-400">
                          평균 지연
                        </p>

                        <p className="mt-1 font-medium">
                          {
                            flight.averageDelayMinutes
                          }
                          분
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">
                          환승
                        </p>

                        <p className="mt-1 font-medium">
                          {flight.stops ===
                          0
                            ? "직항"
                            : `${flight.stops}회`}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">
                          수하물
                        </p>

                        <p className="mt-1 font-medium">
                          {
                            flight.baggageKg
                          }
                          kg
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">
                          의도 적합도
                        </p>

                        <p className="mt-1 font-medium">
                          {flight.intentScore.toFixed(
                            0
                          )}
                        </p>
                      </div>
                    </div>

                    {flight.experiences
                      .length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {flight.experiences.map(
                          (
                            experience
                          ) => (
                            <span
                              key={
                                experience
                              }
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500"
                            >
                              {
                                experience
                              }
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
