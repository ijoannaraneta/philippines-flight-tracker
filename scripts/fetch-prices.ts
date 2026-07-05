/**
 * Fetches round-trip flight prices from SerpAPI's Google Flights engine for
 * every route in config/routes.json and appends a snapshot to
 * data/history/<ORIGIN>-<DEST>.json.
 *
 * Usage:
 *   SERPAPI_KEY=xxx npm run fetch     # real data
 *   npm run fetch:mock                # mock data, no API key needed
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HISTORY_DIR = join(ROOT, "data", "history");
const MOCK = process.argv.includes("--mock");

interface RouteConfig {
  currency: string;
  outboundDate: string;
  returnDate: string;
  adults: number;
  routes: {
    origin: string;
    originName: string;
    destination: string;
    destinationName: string;
  }[];
}

/** One bookable itinerary (outbound leg of a round trip, priced round-trip). */
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

function loadConfig(): RouteConfig {
  return JSON.parse(readFileSync(join(ROOT, "config", "routes.json"), "utf8"));
}

/* ---------------------------------------------------------------- SerpAPI */

interface SerpFlightLeg {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport: { name: string; id: string; time: string };
  duration: number;
  airline: string;
  flight_number: string;
}

interface SerpItinerary {
  flights: SerpFlightLeg[];
  layovers?: { duration: number; name: string; id: string }[];
  total_duration: number;
  price?: number;
}

async function fetchFromSerpApi(
  apiKey: string,
  cfg: RouteConfig,
  origin: string,
  destination: string
): Promise<FlightOption[]> {
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: origin,
    arrival_id: destination,
    outbound_date: cfg.outboundDate,
    return_date: cfg.returnDate,
    currency: cfg.currency,
    adults: String(cfg.adults),
    type: "1", // round trip
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) {
    throw new Error(`SerpAPI ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    error?: string;
    best_flights?: SerpItinerary[];
    other_flights?: SerpItinerary[];
  };
  if (data.error) throw new Error(`SerpAPI error: ${data.error}`);

  const itineraries = [...(data.best_flights ?? []), ...(data.other_flights ?? [])];
  return itineraries
    .filter((it) => typeof it.price === "number" && it.flights?.length > 0)
    .map((it) => ({
      airlines: [...new Set(it.flights.map((f) => f.airline))],
      price: it.price!,
      stops: it.flights.length - 1,
      layovers: (it.layovers ?? []).map((l) => ({
        airport: l.name,
        code: l.id,
        durationMinutes: l.duration,
      })),
      totalDurationMinutes: it.total_duration,
      departureTime: it.flights[0].departure_airport.time,
      arrivalTime: it.flights[it.flights.length - 1].arrival_airport.time,
      flightNumbers: it.flights.map((f) => f.flight_number),
    }))
    .sort((a, b) => a.price - b.price);
}

/* ------------------------------------------------------------------- Mock */

const MOCK_CARRIERS: {
  airline: string;
  hub: { code: string; airport: string };
  basePrice: number;
}[] = [
  { airline: "Emirates", hub: { code: "DXB", airport: "Dubai International Airport" }, basePrice: 820 },
  { airline: "Qatar Airways", hub: { code: "DOH", airport: "Hamad International Airport" }, basePrice: 790 },
  { airline: "Singapore Airlines", hub: { code: "SIN", airport: "Singapore Changi Airport" }, basePrice: 880 },
  { airline: "Cathay Pacific", hub: { code: "HKG", airport: "Hong Kong International Airport" }, basePrice: 760 },
  { airline: "EVA Air", hub: { code: "TPE", airport: "Taiwan Taoyuan International Airport" }, basePrice: 740 },
  { airline: "China Southern", hub: { code: "CAN", airport: "Guangzhou Baiyun International Airport" }, basePrice: 620 },
  { airline: "Etihad Airways", hub: { code: "AUH", airport: "Zayed International Airport" }, basePrice: 780 },
  { airline: "Turkish Airlines", hub: { code: "IST", airport: "Istanbul Airport" }, basePrice: 700 },
  { airline: "Saudia", hub: { code: "JED", airport: "King Abdulaziz International Airport" }, basePrice: 640 },
  { airline: "Philippine Airlines", hub: { code: "", airport: "" }, basePrice: 950 },
];

function mockOptions(cfg: RouteConfig, origin: string, destination: string): FlightOption[] {
  const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  return MOCK_CARRIERS.map((c, i) => {
    // Philippine Airlines flies direct from LHR to MNL only.
    const direct = c.airline === "Philippine Airlines";
    if (direct && !(origin === "LHR" && destination === "MNL")) return null;
    const layoverMins = rand(90, 360);
    const flightMins = rand(15 * 60, 19 * 60);
    return {
      airlines: [c.airline],
      price: c.basePrice + rand(-60, 120) + (destination === "CEB" ? rand(30, 90) : 0),
      stops: direct ? 0 : 1,
      layovers: direct ? [] : [{ airport: c.hub.airport, code: c.hub.code, durationMinutes: layoverMins }],
      totalDurationMinutes: direct ? 14 * 60 + rand(0, 45) : flightMins + layoverMins,
      departureTime: `${cfg.outboundDate} ${String(rand(6, 22)).padStart(2, "0")}:${rand(0, 5)}0`,
      arrivalTime: "",
      flightNumbers: [`${c.airline.slice(0, 2).toUpperCase()} ${rand(1, 999)}`],
    } as FlightOption;
  })
    .filter((o): o is FlightOption => o !== null)
    .sort((a, b) => a.price - b.price);
}

/* ------------------------------------------------------------------- Main */

async function main() {
  const cfg = loadConfig();
  const apiKey = process.env.SERPAPI_KEY;

  if (!MOCK && !apiKey) {
    console.error("SERPAPI_KEY is not set. Use --mock for test data.");
    process.exit(1);
  }

  mkdirSync(HISTORY_DIR, { recursive: true });
  let failures = 0;

  for (const route of cfg.routes) {
    const label = `${route.origin}-${route.destination}`;
    const file = join(HISTORY_DIR, `${label}.json`);
    const snapshot: Snapshot = {
      fetchedAt: new Date().toISOString(),
      outboundDate: cfg.outboundDate,
      returnDate: cfg.returnDate,
      currency: cfg.currency,
      cheapestPrice: null,
      options: [],
    };

    try {
      snapshot.options = MOCK
        ? mockOptions(cfg, route.origin, route.destination)
        : await fetchFromSerpApi(apiKey!, cfg, route.origin, route.destination);
      snapshot.cheapestPrice = snapshot.options[0]?.price ?? null;
      console.log(
        `${label}: ${snapshot.options.length} options, cheapest ${snapshot.cheapestPrice ?? "n/a"} ${cfg.currency}`
      );
    } catch (err) {
      failures++;
      snapshot.error = err instanceof Error ? err.message : String(err);
      console.error(`${label}: FAILED - ${snapshot.error}`);
    }

    const history: Snapshot[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
    history.push(snapshot);
    writeFileSync(file, JSON.stringify(history, null, 2) + "\n");
  }

  if (failures === cfg.routes.length) {
    console.error("All routes failed.");
    process.exit(1);
  }
}

main();
