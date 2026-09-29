const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseRequiredSearch } = require('../.test-build/search/parse-required-search.js');
const { buildSuggestions } = require('../.test-build/search/suggestions.js');
const { matchesRoute } = require('../.test-build/search/matches-route.js');
const { parseUserPreference } = require('../.test-build/parser/parse-user-preference.js');
const { passesHardFilters } = require('../.test-build/filters/passes-hard-filters.js');
const { mockFlights } = require('../.test-build/data/mock-flights.js');
const { destinations, destinationDocument } = require('../.test-build/search/destinations.js');
const { koreaToday } = require('../.test-build/search/dates.js');
const parse = (query, options = {}) => parseRequiredSearch(query, { today: '2026-09-29', ...options });
const value = state => { assert.equal(state.status, 'resolved'); return state.value; };

test('empty query exposes all required fields without inventing dates', () => {
  const search = parse('');
  for (const field of ['origin', 'destination', 'departureDate', 'returnDate']) assert.equal(search[field].status, 'missing');
  assert.equal(search.ready, false);
  assert.ok(buildSuggestions(search).filter(g => g.field.endsWith('Date')).every(g => g.showPicker));
});
test('natural-language origin beats UI default and selection', () => {
  for (const query of ['부산에서 도쿄로', '부산 출발 도쿄', 'PUS → NRT', 'from PUS to NRT']) {
    const search = parse(query, { defaultOrigin: 'ICN', origin: 'GMP' });
    assert.deepEqual(value(search.origin).airportCodes, ['PUS']);
    assert.ok(value(search.destination).airportCodes.includes('NRT'));
  }
});
test('default applies only when origin is absent', () => {
  assert.equal(value(parse('도쿄 여행', { defaultOrigin: 'ICN' }).origin).id, 'ICN');
  assert.equal(parse('춘천에서 도쿄', { defaultOrigin: 'ICN' }).origin.status, 'ambiguous');
});
test('countries and regions produce multiple destinations and a final manual choice', () => {
  for (const query of ['일본', '유럽', '동남아', '태국', '미국']) {
    const search = parse(query);
    assert.equal(search.destination.status, 'ambiguous');
    const group = buildSuggestions(search).find(g => g.field === 'destination');
    assert.ok(group.items.filter(i => i.kind === 'select').length >= 2);
    assert.equal(group.items.at(-1).label, '직접 설정하기');
  }
});
test('specific cities/airports take precedence over parent country', () => {
  assert.equal(value(parse('일본 도쿄').destination).id, 'tokyo');
  assert.equal(value(parse('도쿄 하네다').destination).id, 'HND');
  assert.equal(value(parse('인천국제공항에서 일본 도쿄').origin).id, 'ICN');
  assert.equal(parse('도쿄 또는 오사카').destination.status, 'ambiguous');
});
test('airport codes do not match English word fragments', () => {
  assert.equal(parse('business class').destination.status, 'missing');
  assert.equal(parse('비즈니스로 가고 싶어').destination.status, 'missing');
  assert.equal(value(parse('도쿄 비즈니스').destination).id, 'tokyo');
  assert.equal(parse('일본에서 도쿄', { defaultOrigin: 'seoul' }).origin.status, 'ambiguous');
});
test('ISO and full Korean dates resolve exactly', () => {
  for (const query of ['2026-10-03 2026-10-07', '2026년 10월 3일 2026년 10월 7일', '10월 3일부터 7일까지']) {
    const search = parse(query);
    assert.equal(value(search.departureDate), '2026-10-03');
    assert.equal(value(search.returnDate), '2026-10-07');
  }
});
test('date labels work both before and after dates and in reversed order', () => {
  for (const query of ['출국 10월 3일 귀국 10월 7일', '10월 3일 출발 10월 7일 귀국', '귀국 10월 7일 출국 10월 3일']) {
    const search = parse(query);
    assert.equal(value(search.departureDate), '2026-10-03', query);
    assert.equal(value(search.returnDate), '2026-10-07', query);
  }
});
test('yearless month/day means next occurrence; return can cross New Year', () => {
  assert.equal(value(parse('1월 3일').departureDate), '2027-01-03');
  const search = parse('12월 30일 1월 3일');
  assert.equal(value(search.departureDate), '2026-12-30');
  assert.equal(value(search.returnDate), '2027-01-03');
});
test('ranges and partial dates remain ambiguous and offer concrete dates', () => {
  for (const query of ['다음주', '10월 초', '10월 중순', '10월 말', '10월', '15일', '2027년', '10월 3일쯤']) {
    const search = parse(query);
    assert.equal(search.departureDate.status, 'ambiguous', query);
    assert.ok(search.departureDate.candidates.length >= 2, query);
    assert.equal(buildSuggestions(search).find(g => g.field === 'departureDate').items.at(-1).kind, 'manual');
  }
  assert.deepEqual(parse('다음주').departureDate.candidates, ['2026-10-05', '2026-10-08', '2026-10-11']);
  assert.ok(parse('10월 초').departureDate.candidates.every(date => date >= '2026-10-01' && date <= '2026-10-10'));
});
test('invalid/past dates and reverse ranges are never silently normalized', () => {
  for (const query of ['2027-02-29', '2026-02-30', '2026년 13월 1일', '2026-09-01']) assert.equal(parse(query).departureDate.status, 'ambiguous', query);
  assert.equal(value(parse('2028-02-29').departureDate), '2028-02-29');
  assert.equal(parse('2026-10-07 2026-10-03').returnDate.status, 'ambiguous');
  assert.equal(parse('10월 7일 10월 3일').returnDate.status, 'ambiguous');
  assert.equal(value(parse('내년 10월 3일').departureDate), '2027-10-03');
});
test('alternative departure dates do not become a round trip', () => {
  const search = parse('10월 3일 또는 10월 5일');
  assert.equal(search.departureDate.status, 'ambiguous');
  assert.deepEqual(search.departureDate.candidates, ['2026-10-03', '2026-10-05']);
  assert.equal(search.returnDate.status, 'missing');
});
test('selections resolve ambiguous values and one-way does not require return', () => {
  const options = { origin: 'seoul', destination: 'tokyo', departureDate: '2026-10-03', tripType: 'oneway' };
  const search = parse('일본 다음주', options);
  assert.equal(search.ready, true);
  assert.equal(value(search.destination).id, 'tokyo');
  assert.equal(value(search.departureDate), '2026-10-03');
  assert.ok(!buildSuggestions(search, 'oneway').some(g => g.field === 'returnDate'));
  assert.equal(parse('일본', { ...options, tripType: 'roundtrip' }).ready, false);
  assert.equal(parse('일본', { ...options, tripType: 'multicity', returnDate: '2026-10-07' }).ready, false);
  assert.equal(parse('', { departureDate: '2026-02-30' }).departureDate.status, 'ambiguous');
});
test('return suggestions never precede selected departure', () => {
  const search = parse('출국 10월 10일 귀국 10월 초');
  const group = buildSuggestions(search).find(g => g.field === 'returnDate');
  assert.ok(group.items.filter(i => i.kind === 'select').every(i => i.value >= '2026-10-10'));
});
test('required route filtering composes with existing aircraft and direct-only filters', () => {
  const query = '서울에서 도쿄 무조건 A380 직항만 50만원 이하';
  const search = parse(query);
  const preference = parseUserPreference(query);
  const flights = mockFlights.filter(f => matchesRoute(f, search) && passesHardFilters(f, preference));
  assert.ok(flights.length > 0);
  assert.ok(flights.every(f => f.aircraft.includes('A380') && f.stops === 0 && f.price <= 500000));
  assert.equal(parse(query).departureDate.status, 'missing');
  assert.equal(mockFlights.filter(f => matchesRoute(f, parse('부산에서 도쿄'))).length, 0);
  assert.ok(mockFlights.filter(f => matchesRoute(f, parse('서울에서 도쿄'))).some(f => f.destination === 'HND'));
});
test('directory identifiers are unique and embedding documents contain useful text', () => {
  assert.equal(new Set(destinations.map(p => p.id)).size, destinations.length);
  for (const place of destinations) {
    assert.ok(destinationDocument(place).includes(place.description));
    assert.ok(place.popularity >= 0 && place.popularity <= 100);
    assert.ok(place.parentIds.every(id => destinations.some(parent => parent.id === id)));
  }
});
test('Korean reference day is independent of host timezone', () => {
  assert.equal(koreaToday(new Date('2026-12-31T16:00:00Z')), '2027-01-01');
});
