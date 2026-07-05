import type { AirlinesConfig, RoutesConfig, Snapshot } from "./types";
import { routeKey } from "./types";

const base = import.meta.env.BASE_URL;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base}data/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return res.json();
}

export interface AppData {
  routes: RoutesConfig;
  airlines: AirlinesConfig;
  history: Record<string, Snapshot[]>;
}

export async function loadAppData(): Promise<AppData> {
  const [routes, airlines] = await Promise.all([
    getJson<RoutesConfig>("routes.json"),
    getJson<AirlinesConfig>("airlines.json"),
  ]);

  const history: Record<string, Snapshot[]> = {};
  await Promise.all(
    routes.routes.map(async (r) => {
      const key = routeKey(r);
      try {
        history[key] = await getJson<Snapshot[]>(`history/${key}.json`);
      } catch {
        history[key] = [];
      }
    })
  );

  return { routes, airlines, history };
}
