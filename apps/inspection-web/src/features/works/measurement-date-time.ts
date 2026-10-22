export function localMeasurementDateTime(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    measuredAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`,
    measuredAtTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}
