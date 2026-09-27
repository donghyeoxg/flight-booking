# Flight Booking

A smarter flight discovery platform focused on the best travel experience, not just the cheapest fare.

## Overview

Flight Booking is a flight search and recommendation prototype that ranks flights based on more than price.

The project considers factors such as:

- Price competitiveness
- Direct vs connecting flights
- Average delay
- Airport accessibility
- Departure time
- Baggage allowance
- Cabin comfort
- Unique flight experiences

Users can search in natural language, for example:

- "일본 가는 거"
- "후지산이 보였으면 좋겠어"
- "A380 타고 싶고 저렴했으면 좋겠어"
- "30만원 이하 직항만"

The system parses the user's intent and adjusts the ranking weights dynamically.

## Core Product Structure

1. Set travel preferences
2. Recommend the best flight
3. Record and share travel history

## Current Status

This is an early MVP prototype.

Implemented:

- Minimal flight search UI
- Trip type selection
- Travel date selection
- Traveler count
- Cabin class selection
- Rule-based natural language preference parser
- Flight scoring engine
- Hard filters
- Ranked mock flight results

Planned:

- Real flight API integration
- Real fare data
- Historical delay data
- Hybrid rule-based + AI intent parsing
- User accounts
- Travel history
- Public travel profiles
- Community features
- Booking affiliate links

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js

Planned:

- Supabase
- Flight data APIs
- Vercel

## Development

```bash
nvm use
npm install
npm run dev