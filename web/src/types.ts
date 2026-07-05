export interface FlightOption {
  airlines: string[];
  price: number;
  stops: number;
  layovers: { airport: string; code: string; durationMinutes: number }[];
  totalDurationMinutes: number;
  departureTime: string;
  arrivalTime: string;
  flightNumbers: string[];
}

export interface Snapshot {
  fetchedAt: string;
  outboundDate: string;
  returnDate: string;
  currency: string;
  cheapestPrice: number | null;
  options: FlightOption[];
  error?: string;
}

export interface Route {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
}

export interface RoutesConfig {
  currency: string;
  outboundDate: string;
  returnDate: string;
  adults: number;
  routes: Route[];
}

export interface AirlineSafety {
  code: string;
  safetyRating: number;
  euBanned: boolean;
  notes: string;
}

export interface AirlinesConfig {
  airlines: Record<string, AirlineSafety>;
}

export const routeKey = (r: Route) => `${r.origin}-${r.destination}`;
