import { useEffect, useMemo, useState } from "react";
import { loadAppData, type AppData } from "./data";
import { routeKey } from "./types";
import PriceChart from "./components/PriceChart";
import FlightTable from "./components/FlightTable";
import Filters from "./components/Filters";

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [maxStops, setMaxStops] = useState<number | null>(null);
  const [airline, setAirline] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useEffect(() => {
    loadAppData()
      .then((d) => {
        setData(d);
        setSelectedRoute(routeKey(d.routes.routes[0]));
      })
      .catch((e) => setError(e.message));
  }, []);

  const view = useMemo(() => {
    if (!data || !selectedRoute) return null;
    const history = data.history[selectedRoute] ?? [];
    const latest = [...history].reverse().find((s) => s.options.length > 0) ?? null;
    const cheapestEver =
      history.filter((s) => s.cheapestPrice !== null).length > 0
        ? Math.min(...history.filter((s) => s.cheapestPrice !== null).map((s) => s.cheapestPrice as number))
        : null;
    const airlineNames = latest
      ? [...new Set(latest.options.flatMap((o) => o.airlines))].sort()
      : [];
    const filtered = latest
      ? latest.options.filter(
          (o) =>
            (maxStops === null || o.stops <= maxStops) &&
            (airline === null || o.airlines.includes(airline)) &&
            (maxPrice === null || o.price <= maxPrice)
        )
      : [];
    return { history, latest, cheapestEver, airlineNames, filtered };
  }, [data, selectedRoute, maxStops, airline, maxPrice]);

  if (error) {
    return (
      <div className="shell">
        <div className="empty-state">Failed to load data: {error}</div>
      </div>
    );
  }
  if (!data || !view) {
    return (
      <div className="shell">
        <div className="empty-state">Loading…</div>
      </div>
    );
  }

  const cfg = data.routes;

  return (
    <div className="shell">
      <header>
        <h1>
          Philippines Flight Tracker <span className="plane">✈</span>
        </h1>
        <p className="subtitle">
          Round trip · depart {new Date(cfg.outboundDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · return{" "}
          {new Date(cfg.returnDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      <nav className="route-tabs">
        {cfg.routes.map((r) => {
          const key = routeKey(r);
          const hist = data.history[key] ?? [];
          const latestPrice = [...hist].reverse().find((s) => s.cheapestPrice !== null)?.cheapestPrice;
          return (
            <button
              key={key}
              className={key === selectedRoute ? "tab active" : "tab"}
              onClick={() => setSelectedRoute(key)}
            >
              <span className="tab-route">
                {r.origin} → {r.destination}
              </span>
              <span className="tab-names">
                {r.originName} to {r.destinationName}
              </span>
              <span className="tab-price">{latestPrice != null ? `from £${latestPrice}` : "no data yet"}</span>
            </button>
          );
        })}
      </nav>

      <section className="card">
        <h2>Cheapest price over time</h2>
        <PriceChart history={view.history} currency={cfg.currency} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>
            Latest flight options
            {view.latest && (
              <span className="fetched-at">
                {" "}
                · checked {new Date(view.latest.fetchedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </h2>
          <Filters
            airlineNames={view.airlineNames}
            maxStops={maxStops}
            setMaxStops={setMaxStops}
            airline={airline}
            setAirline={setAirline}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
          />
        </div>
        <FlightTable
          options={view.filtered}
          currency={cfg.currency}
          airlines={data.airlines}
          cheapestEver={view.cheapestEver}
        />
      </section>

      <footer>
        Safety ratings are hand-curated (1–7, AirlineRatings style) in <code>config/airlines.json</code>. Hover a badge
        for notes. Prices from Google Flights via SerpAPI.
      </footer>
    </div>
  );
}
