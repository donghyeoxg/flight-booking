import {
    Flight,
    parseUserPreference,
    passesHardFilters,
    scoreFlight,
  } from "@/lib/scoring";
  
  type ResultsPageProps = {
    searchParams: Promise<{
      q?: string;
      tripType?: string;
      travelers?: string;
      cabin?: string;
      departureDate?: string;
      returnDate?: string;
    }>;
  };
  
  const flights: Flight[] = [
    {
      id: 1,
      airline: "Korean Air",
      flightNumber: "KE703",
      origin: "ICN",
      destination: "NRT",
      price: 342000,
      stops: 0,
      averageDelayMinutes: 11,
      airportAccessMinutes: 60,
      departureHour: 9,
      baggageKg: 23,
      cabinComfortScore: 84,
      aircraft: "B787-9",
      experiences: ["mt_fuji", "widebody"],
    },
  
    {
      id: 2,
      airline: "Japan Airlines",
      flightNumber: "JL092",
      origin: "GMP",
      destination: "HND",
      price: 389000,
      stops: 0,
      averageDelayMinutes: 8,
      airportAccessMinutes: 30,
      departureHour: 12,
      baggageKg: 46,
      cabinComfortScore: 88,
      aircraft: "B787-8",
      experiences: ["mt_fuji", "city_airport", "widebody"],
    },
  
    {
      id: 3,
      airline: "Asiana Airlines",
      flightNumber: "OZ102",
      origin: "ICN",
      destination: "NRT",
      price: 298000,
      stops: 0,
      averageDelayMinutes: 19,
      airportAccessMinutes: 60,
      departureHour: 15,
      baggageKg: 23,
      cabinComfortScore: 78,
      aircraft: "A321neo",
      experiences: ["sunset"],
    },
  
    {
      id: 4,
      airline: "Special Air",
      flightNumber: "SA380",
      origin: "ICN",
      destination: "NRT",
      price: 410000,
      stops: 0,
      averageDelayMinutes: 17,
      airportAccessMinutes: 60,
      departureHour: 10,
      baggageKg: 23,
      cabinComfortScore: 92,
      aircraft: "A380-800",
      experiences: ["mt_fuji", "a380", "widebody"],
    },
  ];
  
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
    if (!date) return null;
  
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
  
    const tripType =
      tripTypeLabels[params.tripType ?? "roundtrip"] ?? "왕복";
  
    const travelers = params.travelers ?? "1";
  
    const cabin =
      cabinLabels[params.cabin ?? "economy"] ?? "이코노미";
  
    const departureDate = formatDate(params.departureDate);
    const returnDate = formatDate(params.returnDate);
  
    let dateLabel = "날짜 미지정";
  
    if (departureDate && params.tripType === "oneway") {
      dateLabel = departureDate;
    }
  
    if (
      departureDate &&
      returnDate &&
      params.tripType === "roundtrip"
    ) {
      dateLabel = `${departureDate} → ${returnDate}`;
    }
  
    if (params.tripType === "multicity") {
      dateLabel = "다구간";
    }
  
    // 사용자 검색문 분석
    const preference = parseUserPreference(query);
  
    // 테스트용 시장 대표 가격
    const marketMedianPrice = 350000;
  
    // 하드필터 → 점수계산 → 정렬
    const scoredFlights = flights
      .filter((flight) =>
        passesHardFilters(flight, preference)
      )
      .map((flight) => {
        const score = scoreFlight(
          flight,
          preference,
          marketMedianPrice
        );
  
        return {
          ...flight,
          ...score,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  
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
  
              <span>여행자 {travelers}명</span>
              <span>·</span>
  
              <span>{cabin}</span>
            </div>
          </div>
  
          <div className="mt-10">
            {scoredFlights.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-lg font-medium">
                  조건에 맞는 항공편이 없습니다.
                </p>
  
                <p className="mt-2 text-sm text-gray-500">
                  가격이나 직항 조건을 조금 완화해서 다시 검색해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scoredFlights.map((flight, index) => (
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
                            {flight.flightNumber}
                          </span>
                        </div>
  
                        <p className="mt-3 text-sm text-gray-500">
                          {flight.origin} → {flight.destination}
                        </p>
  
                        <p className="mt-1 text-sm text-gray-500">
                          {flight.aircraft}
                        </p>
                      </div>
  
                      <div className="text-right">
                        <p className="text-2xl font-semibold">
                          ₩{flight.price.toLocaleString()}
                        </p>
  
                        <p className="mt-1 text-sm text-gray-400">
                          Flight Score{" "}
                          {flight.finalScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
  
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-4">
  
                      <div>
                        <p className="text-gray-400">
                          평균 지연
                        </p>
  
                        <p className="mt-1 font-medium">
                          {flight.averageDelayMinutes}분
                        </p>
                      </div>
  
                      <div>
                        <p className="text-gray-400">
                          환승
                        </p>
  
                        <p className="mt-1 font-medium">
                          {flight.stops === 0
                            ? "직항"
                            : `${flight.stops}회`}
                        </p>
                      </div>
  
                      <div>
                        <p className="text-gray-400">
                          수하물
                        </p>
  
                        <p className="mt-1 font-medium">
                          {flight.baggageKg}kg
                        </p>
                      </div>
  
                      <div>
                        <p className="text-gray-400">
                          의도 적합도
                        </p>
  
                        <p className="mt-1 font-medium">
                          {flight.intentScore.toFixed(0)}
                        </p>
                      </div>
                    </div>
  
                    {flight.experiences.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {flight.experiences.map((experience) => (
                          <span
                            key={experience}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500"
                          >
                            {experience}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
  
        </div>
      </main>
    );
  }