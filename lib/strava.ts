// Strava sync — single-user, refresh-token-based.
// The refresh token is long-lived; we exchange it for a short-lived
// access token at request time and cache that across calls within
// the same Node process.

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  start_date: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_speed?: number;
  average_speed?: number;
  total_elevation_gain?: number;
  suffer_score?: number;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function isStravaConfigured(): boolean {
  return !!(
    process.env.STRAVA_CLIENT_ID &&
    process.env.STRAVA_CLIENT_SECRET &&
    process.env.STRAVA_REFRESH_TOKEN
  );
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Strava token refresh failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_at: number;
  };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: data.expires_at * 1000,
  };
  return data.access_token;
}

export async function fetchRecentActivities(
  afterTimestamp?: number,
  perPage = 30,
): Promise<StravaActivity[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ per_page: String(perPage) });
  if (afterTimestamp) params.set("after", String(afterTimestamp));
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Strava activities fetch failed: ${res.status} ${body}`);
  }
  return res.json();
}

export type StravaLogData = {
  durationActualMin: number;
  distanceKm: number;
  avgHr: number | null;
  avgPower: number | null;
  notes: string;
  stravaActivityId: number;
  stravaStartDate: string;
};

export function stravaActivityToLogData(
  activity: StravaActivity,
): StravaLogData | null {
  const isBike = activity.type === "Ride" || activity.type === "VirtualRide";
  if (!isBike) return null;
  return {
    durationActualMin: activity.moving_time / 60,
    distanceKm: activity.distance / 1000,
    avgHr: activity.average_heartrate
      ? Math.round(activity.average_heartrate)
      : null,
    avgPower: activity.weighted_average_watts
      ? Math.round(activity.weighted_average_watts)
      : activity.average_watts
        ? Math.round(activity.average_watts)
        : null,
    notes: `Synced from Strava: "${activity.name}"`,
    stravaActivityId: activity.id,
    stravaStartDate: activity.start_date,
  };
}
