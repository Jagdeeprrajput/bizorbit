import "server-only";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two lat/long points, in metres (§9.3). */
export function haversineDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METERS * c;
}

export type OfficeCandidate = {
  id: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
};

/**
 * Finds the nearest office to a punch and decides if it's within that
 * office's geofence — accuracy is added to the radius so a fuzzy GPS signal
 * isn't punished (§9.3, step 5). Runs only on the server: the browser
 * reports raw coordinates, never its own verdict.
 */
export function checkGeofence(
  point: { latitude: number; longitude: number; accuracyMeters: number },
  offices: OfficeCandidate[],
) {
  if (offices.length === 0) {
    return { office: null, distanceMeters: null, withinGeofence: false };
  }

  const distances = offices.map((office) => ({
    office,
    distanceMeters: haversineDistanceMeters(point, office),
  }));

  const nearest = distances.reduce((closest, current) =>
    current.distanceMeters < closest.distanceMeters ? current : closest,
  );

  const effectiveRadius = nearest.office.geofenceRadiusMeters + point.accuracyMeters;
  const withinGeofence = nearest.distanceMeters <= effectiveRadius;

  return {
    office: nearest.office,
    distanceMeters: nearest.distanceMeters,
    withinGeofence,
  };
}
