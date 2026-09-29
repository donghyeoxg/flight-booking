"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchRefinements } from "./components/search-refinements";
import { parseRequiredSearch } from "@/lib/flight/search/parse-required-search";
import { koreaToday } from "@/lib/flight/search/dates";
import type { SearchField } from "@/lib/flight/search/types";

type TripType = "roundtrip" | "oneway" | "multicity";
type CabinClass = "economy" | "premium" | "business" | "first";

export default function Home() {
  const router = useRouter();

  const [searchText, setSearchText] = useState("");
  const [today] = useState(() => koreaToday());
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [tripType, setTripType] = useState<TripType>("roundtrip");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [showTravelerPicker, setShowTravelerPicker] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [showCabinPicker, setShowCabinPicker] = useState(false);
  const [cabinClass, setCabinClass] =
    useState<CabinClass>("economy");

  const keywords = [
    "후지산 보이는 비행",
    "A380 타보기",
    "홍콩 야경 착륙",
    "세계 최장거리 비행",
  ];

  const totalTravelers = adults + children + infants;

  const cabinLabel: Record<CabinClass, string> = {
    economy: "이코노미",
    premium: "프리미엄 이코노미",
    business: "비즈니스",
    first: "퍼스트",
  };

  const tripTypeLabel: Record<TripType, string> = {
    roundtrip: "왕복",
    oneway: "편도",
    multicity: "다구간",
  };

  const required = parseRequiredSearch(searchText, { today, defaultOrigin: "seoul", origin, destination, departureDate, returnDate, tripType });
  const selectField = (field: SearchField, value: string) => {
    if (field === "origin") setOrigin(value);
    if (field === "destination") setDestination(value);
    if (field === "departureDate") {
      setDepartureDate(value);
      if (returnDate && value > returnDate) setReturnDate("");
    }
    if (field === "returnDate") setReturnDate(value);
  };
  const changeQuery = (value: string) => {
    setSearchText(value);
    setDestination("");
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;

    const params = new URLSearchParams();

    params.set("q", searchText);
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    params.set("tripType", tripType);
    params.set("travelers", totalTravelers.toString());
    params.set("cabin", cabinClass);

    if (departureDate) {
      params.set("departureDate", departureDate);
    }

    if (tripType === "roundtrip" && returnDate) {
      params.set("returnDate", returnDate);
    }

    router.push(`/results?${params.toString()}`);
  };

  const getDateButtonLabel = () => {
    if (!departureDate) {
      return "여행 날짜";
    }

    if (tripType === "oneway") {
      return departureDate;
    }

    if (tripType === "roundtrip") {
      if (!returnDate) {
        return `${departureDate} → 귀국일 선택`;
      }

      return `${departureDate} → ${returnDate}`;
    }

    return "다구간 날짜";
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6">
        <h1 className="mb-8 text-center text-4xl font-semibold tracking-tight sm:text-5xl">
          특별한 비행 경험을 찾아보세요
        </h1>

        <div className="w-full max-w-3xl">
          {/* 검색창 */}
          <div className="flex items-center rounded-2xl border border-gray-300 bg-white px-5 py-4 shadow-sm">
            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                changeQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="어디로, 어떤 비행을 떠나고 싶나요?"
              className="w-full bg-transparent text-lg outline-none placeholder:text-gray-400"
            />

            <button
              onClick={handleSearch}
              className="ml-4 rounded-xl bg-black px-5 py-3 text-white transition hover:bg-gray-800"
            >
              검색
            </button>
          </div>

          {searchText.trim() && <SearchRefinements key={searchText} search={required} tripType={tripType} onSelect={selectField} />}

          {/* 여행 형태 */}
          <div className="mt-4 flex justify-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm">
              {(["roundtrip", "oneway", "multicity"] as TripType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTripType(type);

                      if (type === "oneway") {
                        setReturnDate("");
                      }

                      setShowDatePicker(false);
                    }}
                    className={`rounded-full px-4 py-2 transition ${
                      tripType === type
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {tripTypeLabel[type]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 옵션 버튼 */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            {/* 여행 날짜 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowTravelerPicker(false);
                  setShowCabinPicker(false);
                }}
                className="rounded-full border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
              >
                {getDateButtonLabel()}
              </button>

              {showDatePicker && (
                <div className="absolute left-1/2 top-12 z-20 w-[340px] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
                  {tripType === "multicity" ? (
                    <div>
                      <p className="text-sm font-medium">
                        다구간 검색
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        다구간은 다음 단계에서
                        구간별 출발지·도착지·날짜를
                        추가하도록 구현할 예정입니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-gray-500">
                          출국 날짜
                        </label>

                        <input
                          type="date"
                          value={departureDate}
                          onChange={(event) => {
                            setDepartureDate(event.target.value);

                            if (
                              returnDate &&
                              event.target.value > returnDate
                            ) {
                              setReturnDate("");
                            }
                          }}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-black"
                        />
                      </div>

                      {tripType === "roundtrip" && (
                        <div>
                          <label className="mb-2 block text-xs font-medium text-gray-500">
                            귀국 날짜
                          </label>

                          <input
                            type="date"
                            value={returnDate}
                            min={departureDate || undefined}
                            onChange={(event) =>
                              setReturnDate(event.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          />
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setShowDatePicker(false)
                        }
                        className="w-full rounded-xl bg-black py-2.5 text-sm text-white transition hover:bg-gray-800"
                      >
                        완료
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 여행자 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTravelerPicker(
                    !showTravelerPicker
                  );
                  setShowDatePicker(false);
                  setShowCabinPicker(false);
                }}
                className="rounded-full border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
              >
                여행자 {totalTravelers}명
              </button>

              {showTravelerPicker && (
                <div className="absolute left-1/2 top-12 z-20 w-72 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
                  <TravelerRow
                    label="성인"
                    subLabel="만 12세 이상"
                    value={adults}
                    min={1}
                    onDecrease={() =>
                      setAdults((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                    onIncrease={() =>
                      setAdults((value) => value + 1)
                    }
                  />

                  <TravelerRow
                    label="어린이"
                    subLabel="만 2~11세"
                    value={children}
                    onDecrease={() =>
                      setChildren((value) =>
                        Math.max(0, value - 1)
                      )
                    }
                    onIncrease={() =>
                      setChildren((value) => value + 1)
                    }
                  />

                  <TravelerRow
                    label="유아"
                    subLabel="만 2세 미만"
                    value={infants}
                    onDecrease={() =>
                      setInfants((value) =>
                        Math.max(0, value - 1)
                      )
                    }
                    onIncrease={() =>
                      setInfants((value) => value + 1)
                    }
                  />

                  <button
                    onClick={() =>
                      setShowTravelerPicker(false)
                    }
                    className="mt-4 w-full rounded-xl bg-black py-2.5 text-sm text-white transition hover:bg-gray-800"
                  >
                    완료
                  </button>
                </div>
              )}
            </div>

            {/* 좌석 등급 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCabinPicker(!showCabinPicker);
                  setShowDatePicker(false);
                  setShowTravelerPicker(false);
                }}
                className="rounded-full border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
              >
                {cabinLabel[cabinClass]}
              </button>

              {showCabinPicker && (
                <div className="absolute left-1/2 top-12 z-20 w-64 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                  {(
                    [
                      "economy",
                      "premium",
                      "business",
                      "first",
                    ] as CabinClass[]
                  ).map((cabin) => (
                    <button
                      key={cabin}
                      onClick={() => {
                        setCabinClass(cabin);
                        setShowCabinPicker(false);
                      }}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                        cabinClass === cabin
                          ? "bg-black text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {cabinLabel[cabin]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 추천 키워드 */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {keywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => changeQuery(keyword)}
                className="rounded-full bg-gray-100 px-4 py-2 text-gray-600 transition hover:bg-gray-200 hover:text-black"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

type TravelerRowProps = {
  label: string;
  subLabel: string;
  value: number;
  min?: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

function TravelerRow({
  label,
  subLabel,
  value,
  onDecrease,
  onIncrease,
}: TravelerRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-none">
      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {subLabel}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDecrease}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg hover:bg-gray-100"
        >
          −
        </button>

        <span className="w-5 text-center text-sm">
          {value}
        </span>

        <button
          onClick={onIncrease}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </div>
  );
}
