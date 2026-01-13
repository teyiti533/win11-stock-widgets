export function createDefaultWidget() {
  return {
    id: Date.now(),
    code: "sh600519",
    mode: "realtime", // or 'kline'
    klineScale: 240,
    width: 420,
    height: 300
  };
}