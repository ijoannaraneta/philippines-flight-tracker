interface Props {
  airlineNames: string[];
  maxStops: number | null;
  setMaxStops: (v: number | null) => void;
  airline: string | null;
  setAirline: (v: string | null) => void;
  maxPrice: number | null;
  setMaxPrice: (v: number | null) => void;
}

export default function Filters({
  airlineNames,
  maxStops,
  setMaxStops,
  airline,
  setAirline,
  maxPrice,
  setMaxPrice,
}: Props) {
  return (
    <div className="filters">
      <label>
        Max stops
        <select
          value={maxStops === null ? "" : maxStops}
          onChange={(e) => setMaxStops(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Any</option>
          <option value="0">Direct only</option>
          <option value="1">Up to 1 stop</option>
          <option value="2">Up to 2 stops</option>
        </select>
      </label>
      <label>
        Airline
        <select value={airline ?? ""} onChange={(e) => setAirline(e.target.value || null)}>
          <option value="">All airlines</option>
          {airlineNames.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label>
        Max price
        <input
          type="number"
          placeholder="e.g. 900"
          min={0}
          step={50}
          value={maxPrice ?? ""}
          onChange={(e) => setMaxPrice(e.target.value === "" ? null : Number(e.target.value))}
        />
      </label>
    </div>
  );
}
