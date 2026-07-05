import type { AirlinesConfig, FlightOption } from "../types";
import SafetyBadge from "./SafetyBadge";

interface Props {
  options: FlightOption[];
  currency: string;
  airlines: AirlinesConfig;
  cheapestEver: number | null;
}

function fmtDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function FlightTable({ options, currency, airlines, cheapestEver }: Props) {
  if (options.length === 0) {
    return <div className="empty-state">No flights match the current filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Price</th>
            <th>Airline</th>
            <th>Safety</th>
            <th>Stops</th>
            <th>Layovers</th>
            <th>Duration</th>
            <th>Flights</th>
          </tr>
        </thead>
        <tbody>
          {options.map((o, i) => (
            <tr key={i}>
              <td>
                <span className="price">
                  £{o.price.toLocaleString()} <span className="currency">{currency}</span>
                </span>
                {cheapestEver !== null && o.price <= cheapestEver && (
                  <span className="badge badge-good deal">Cheapest ever</span>
                )}
              </td>
              <td>{o.airlines.join(" + ")}</td>
              <td>
                {o.airlines.map((a) => (
                  <SafetyBadge key={a} airline={a} airlines={airlines} />
                ))}
              </td>
              <td>
                <span className={`stops stops-${Math.min(o.stops, 2)}`}>
                  {o.stops === 0 ? "Direct" : `${o.stops} stop${o.stops > 1 ? "s" : ""}`}
                </span>
              </td>
              <td className="muted">
                {o.layovers.length === 0
                  ? "—"
                  : o.layovers.map((l) => `${l.code} (${fmtDuration(l.durationMinutes)})`).join(", ")}
              </td>
              <td>{fmtDuration(o.totalDurationMinutes)}</td>
              <td className="muted">{o.flightNumbers.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
