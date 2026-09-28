// lib/flight/scoring/quality-score.ts

import type {
    Flight,
    QualityWeights,
  } from "../types";
  
  function getPriceScore(
    price: number,
    marketMedianPrice: number
  ) {
    const ratio =
      price /
      marketMedianPrice;
  
    if (ratio <= 0.75) return 100;
    if (ratio <= 0.9) return 90;
    if (ratio <= 1.0) return 80;
    if (ratio <= 1.1) return 70;
    if (ratio <= 1.25) return 50;
    if (ratio <= 1.5) return 25;
  
    return 10;
  }
  
  function getConnectionScore(
    stops: number
  ) {
    if (stops === 0) return 100;
    if (stops === 1) return 70;
    if (stops === 2) return 30;
  
    return 10;
  }
  
  function getReliabilityScore(
    averageDelayMinutes: number
  ) {
    if (
      averageDelayMinutes <= 15
    ) return 100;
  
    if (
      averageDelayMinutes <= 30
    ) return 80;
  
    if (
      averageDelayMinutes <= 45
    ) return 65;
  
    if (
      averageDelayMinutes <= 60
    ) return 50;
  
    if (
      averageDelayMinutes <= 90
    ) return 30;
  
    if (
      averageDelayMinutes <= 120
    ) return 15;
  
    return 5;
  }
  
  function getAirportAccessScore(
    minutes: number
  ) {
    if (minutes <= 30) return 100;
    if (minutes <= 45) return 90;
    if (minutes <= 60) return 75;
    if (minutes <= 75) return 60;
    if (minutes <= 90) return 45;
  
    return 30;
  }
  
  function getScheduleScore(
    hour: number
  ) {
    if (
      hour >= 7 &&
      hour <= 21
    ) {
      return 100;
    }
  
    if (
      hour >= 5 &&
      hour < 7
    ) {
      return 75;
    }
  
    if (
      hour > 21 &&
      hour < 24
    ) {
      return 80;
    }
  
    return 55;
  }
  
  function getBaggageScore(
    kg: number
  ) {
    if (kg >= 23) return 100;
    if (kg >= 15) return 80;
    if (kg > 0) return 60;
  
    return 30;
  }
  
  export function calculateQualityScore(
    flight: Flight,
    weights: QualityWeights,
    marketMedianPrice: number
  ) {
    const scores = {
      price:
        getPriceScore(
          flight.price,
          marketMedianPrice
        ),
  
      connection:
        getConnectionScore(
          flight.stops
        ),
  
      reliability:
        getReliabilityScore(
          flight.averageDelayMinutes
        ),
  
      airportAccess:
        getAirportAccessScore(
          flight.airportAccessMinutes
        ),
  
      schedule:
        getScheduleScore(
          flight.departureHour
        ),
  
      baggage:
        getBaggageScore(
          flight.baggageKg
        ),
  
      cabinComfort:
        flight.cabinComfortScore,
    };
  
    const weightedScore =
      scores.price *
        weights.price +
  
      scores.connection *
        weights.connection +
  
      scores.reliability *
        weights.reliability +
  
      scores.airportAccess *
        weights.airportAccess +
  
      scores.schedule *
        weights.schedule +
  
      scores.baggage *
        weights.baggage +
  
      scores.cabinComfort *
        weights.cabinComfort;
  
    return (
      weightedScore /
      100
    );
  }