export function calculateHeading(x, y) {
  let heading = Math.atan2(-x, y) * (180 / Math.PI);
  if (heading < 0) heading += 360;
  return heading;
}

// Picks the equivalent angle closest to current so rotation never spins the long way around
export function shortestRotationTarget(currentAngle, targetAngle) {
  const diff = targetAngle - currentAngle;
  if (diff > 180) return targetAngle - 360;
  if (diff < -180) return targetAngle + 360;
  return targetAngle;
}
