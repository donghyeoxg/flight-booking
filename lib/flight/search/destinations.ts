import type { Place } from "./types";

export const DESTINATION_CONTENT_VERSION = "1";
const regions: Place[] = [
  ["east-asia", "동아시아", ["east asia"]],
  ["southeast-asia", "동남아", ["동남아시아", "southeast asia"]],
  ["europe", "유럽", ["europe"]],
  ["north-america", "북미", ["북아메리카", "north america"]],
].map(([id, name, aliases]) => ({
  id: String(id), name: String(name), aliases: aliases as string[], kind: "region",
  parentIds: [], airportCodes: [], tags: [String(name)], popularity: 80,
  description: `${name} 지역의 주요 여행 도시`,
}));
const countries: Place[] = [
  ["KR", "대한민국", "east-asia", ["한국", "korea", "south korea"]],
  ["JP", "일본", "east-asia", ["japan"]],
  ["TW", "대만", "east-asia", ["taiwan"]],
  ["HK", "홍콩 특별행정구", "east-asia", []],
  ["SG", "싱가포르 공화국", "southeast-asia", ["republic of singapore"]],
  ["TH", "태국", "southeast-asia", ["thailand"]],
  ["VN", "베트남", "southeast-asia", ["vietnam"]],
  ["FR", "프랑스", "europe", ["france"]],
  ["GB", "영국", "europe", ["uk", "united kingdom"]],
  ["IT", "이탈리아", "europe", ["italy"]],
  ["US", "미국", "north-america", ["usa", "united states"]],
].map(([code, name, region, aliases]) => ({
  id: `country-${code}`, kind: code === "HK" ? "region" : "country", name: String(name), countryCode: String(code),
  parentIds: [String(region)], airportCodes: [], aliases: aliases as string[],
  tags: [String(name)], popularity: 80, description: `${name}의 주요 도시와 공항`,
}));

type CitySeed = [string, string, string, string, string[], string[], string[], number, string];
const seeds: CitySeed[] = [
  ["seoul", "서울", "KR", "east-asia", ["ICN", "GMP"], ["seoul", "SEL"], ["도시", "쇼핑"], 100, "인천·김포 공항을 이용하는 서울 여행"],
  ["busan", "부산", "KR", "east-asia", ["PUS"], ["busan"], ["해변", "도시"], 85, "해변과 항구 도시 부산"],
  ["jeju", "제주", "KR", "east-asia", ["CJU"], ["제주도", "jeju"], ["자연", "휴양"], 90, "자연과 바다를 즐기는 제주"],
  ["tokyo", "도쿄", "JP", "east-asia", ["NRT", "HND"], ["동경", "tokyo", "TYO"], ["도시", "쇼핑", "mt_fuji"], 100, "나리타·하네다 공항을 이용하는 도쿄 여행"],
  ["osaka", "오사카", "JP", "east-asia", ["KIX", "ITM"], ["osaka", "OSA"], ["미식", "도시"], 95, "간사이 지역의 미식과 도시 여행"],
  ["fukuoka", "후쿠오카", "JP", "east-asia", ["FUK"], ["fukuoka"], ["미식", "근거리"], 90, "규슈 여행의 관문 후쿠오카"],
  ["sapporo", "삿포로", "JP", "east-asia", ["CTS"], ["sapporo"], ["겨울", "자연"], 85, "홋카이도 자연과 겨울 여행"],
  ["okinawa", "오키나와", "JP", "east-asia", ["OKA"], ["okinawa", "나하"], ["해변", "휴양"], 80, "따뜻한 바다와 섬 여행"],
  ["taipei", "타이베이", "TW", "east-asia", ["TPE", "TSA"], ["타이페이", "taipei"], ["미식", "야경"], 90, "야시장과 도시 여행"],
  ["hong-kong", "홍콩", "HK", "east-asia", ["HKG"], ["hong kong", "hongkong"], ["야경", "night_view"], 90, "홍콩의 스카이라인과 야경"],
  ["bangkok", "방콕", "TH", "southeast-asia", ["BKK", "DMK"], ["bangkok"], ["미식", "도시"], 95, "태국의 문화와 미식 여행"],
  ["phuket", "푸껫", "TH", "southeast-asia", ["HKT"], ["푸켓", "phuket"], ["해변", "휴양"], 85, "안다만 해의 휴양지"],
  ["danang", "다낭", "VN", "southeast-asia", ["DAD"], ["da nang", "danang"], ["해변", "휴양"], 90, "해변과 호이안 여행의 관문"],
  ["hanoi", "하노이", "VN", "southeast-asia", ["HAN"], ["hanoi"], ["역사", "미식"], 85, "베트남의 역사와 음식 문화"],
  ["singapore", "싱가포르", "SG", "southeast-asia", ["SIN"], ["singapore"], ["도시", "야경"], 90, "창이 공항을 이용하는 도시 여행"],
  ["paris", "파리", "FR", "europe", ["CDG", "ORY"], ["paris", "PAR"], ["예술", "도시"], 95, "박물관과 예술의 도시"],
  ["nice", "니스", "FR", "europe", ["NCE"], ["nice"], ["해변", "휴양"], 75, "프랑스 남부 해안 여행"],
  ["london", "런던", "GB", "europe", ["LHR", "LGW"], ["london", "LON"], ["역사", "도시"], 95, "역사와 문화의 도시"],
  ["edinburgh", "에든버러", "GB", "europe", ["EDI"], ["edinburgh"], ["역사"], 75, "스코틀랜드 문화 여행"],
  ["rome", "로마", "IT", "europe", ["FCO"], ["rome", "roma"], ["역사", "미식"], 90, "유적과 미식의 도시"],
  ["milan", "밀라노", "IT", "europe", ["MXP", "LIN"], ["milan", "milano"], ["쇼핑", "도시"], 80, "패션과 북부 이탈리아 여행"],
  ["new-york", "뉴욕", "US", "north-america", ["JFK", "EWR", "LGA"], ["new york", "NYC"], ["도시", "야경"], 95, "뉴욕의 문화와 스카이라인"],
  ["los-angeles", "로스앤젤레스", "US", "north-america", ["LAX"], ["LA", "los angeles"], ["도시", "해변"], 90, "미국 서부 여행의 관문"],
  ["san-francisco", "샌프란시스코", "US", "north-america", ["SFO"], ["san francisco"], ["도시", "자연"], 85, "샌프란시스코와 캘리포니아 여행"],
];
const cities: Place[] = seeds.map(([id, name, countryCode, region, airportCodes, aliases, tags, popularity, description]) => ({
  id, kind: "city", name, countryCode, parentIds: [`country-${countryCode}`, region],
  airportCodes, aliases, tags, popularity, description,
}));
const airportNames: Record<string, string[]> = {
  ICN: ["인천", "인천공항", "인천국제공항", "incheon"], GMP: ["김포", "김포공항", "gimpo"],
  PUS: ["김해", "김해공항"], NRT: ["나리타", "나리타공항", "narita"],
  HND: ["하네다", "하네다공항", "haneda"], KIX: ["간사이", "간사이공항", "kansai"],
  CTS: ["신치토세", "신치토세공항"], CDG: ["샤를드골"], LHR: ["히스로"], SIN: ["창이"],
};
const airports: Place[] = cities.flatMap(city => city.airportCodes.map(code => ({
  id: code, kind: "airport" as const, name: airportNames[code]?.[0] ?? `${city.name} ${code}`,
  countryCode: city.countryCode, parentIds: [city.id, ...city.parentIds], airportCodes: [code],
  aliases: [code, ...(airportNames[code] ?? [])], tags: city.tags, popularity: city.popularity,
  description: `${city.name} 여행에 이용하는 ${code} 공항`,
})));
export const destinations: Place[] = [...regions, ...countries, ...cities, ...airports];
export function findPlace(value: string): Place | undefined {
  const key = value.trim().toLowerCase();
  return destinations.find(p => p.id.toLowerCase() === key || p.name.toLowerCase() === key || p.aliases.some(a => a.toLowerCase() === key));
}
export function destinationDocument(place: Place): string {
  return [place.name, place.countryCode, ...place.aliases, ...place.tags, place.description].filter(Boolean).join(" ");
}
export function cityCandidates(place: Place): Place[] {
  return destinations.filter(p => p.kind === "city" && p.parentIds.includes(place.id))
    .sort((a, b) => b.popularity - a.popularity || a.id.localeCompare(b.id));
}
