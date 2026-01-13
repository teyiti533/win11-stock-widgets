// renderer.js
// 负责：接收主进程初始化配置、调用 preload 提供的 API 获取数据、用 ECharts 绘图、提供设置面板和新建 widget 功能。

const { api } = window;

let config = {
  id: null,
  code: "sh600519",
  mode: "realtime",
  klineScale: 240,
  width: 420,
  height: 300
};

const chartDom = document.getElementById("chart");
const chart = echarts.init(chartDom, null, { renderer: "canvas" });

function parseSinaRealtime(raw) {
  // raw 示例: var hq_str_sh600519="贵州茅台,1840.00,1850.00,1838.00,1865.00,1820.00,1840.00,1841.00,1234567,....";
  const match = raw.match(/hq_str_([a-z0-9]+)=\"(.+)\";/);
  if (!match) {
    return null;
  }
  const dataStr = match[2];
  const parts = dataStr.split(",");
  return {
    name: parts[0],
    now: parseFloat(parts[3] || "0"),
    open: parseFloat(parts[1] || "0"),
    high: parseFloat(parts[4] || "0"),
    low: parseFloat(parts[5] || "0"),
    price: parseFloat(parts[3] || "0"),
    volume: parseFloat(parts[8] || "0")
  };
}

async function loadRealtime(code) {
  try {
    const raw = await api.fetchQuote(code);
    const d = parseSinaRealtime(raw);
    if (!d) return;
    // 简单在图上画一个常更新的折线（为了 demo）
    const now = new Date().toLocaleTimeString();
    const option = {
      title: { text: `${code} 实时：${d.price}`, left: 0, textStyle: { color: '#fff' } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [now], boundaryGap: false, axisLabel: { color: '#ccc' } },
      yAxis: { type: 'value', axisLabel: { color: '#ccc' } },
      series: [{ data: [d.price], type: 'line', smooth: true, lineStyle: { color: '#1f8fff' } }]
    };
    chart.setOption(option, true);
  } catch (err) {
    console.error("realtime fetch error", err);
  }
}

function parseKlineData(rawOrObj) {
  // 预期 rawOrObj 是数组：[{day:'2020-01-01',open:'x',high:'x',low:'x',close:'x',volume:'x'}, ...]
  if (!rawOrObj) return null;
  if (typeof rawOrObj === "string") {
    try {
      return JSON.parse(rawOrObj);
    } catch (e) {
      return null;
    }
  }
  return rawOrObj;
}

async function loadKline(code, scale = 240) {
  try {
    const raw = await api.fetchKline(code, scale, 200);
    const arr = parseKlineData(raw);
    if (!arr || !Array.isArray(arr)) return;
    // 转换成 echarts candlestick 数据
    const categories = [];
    const kdata = [];
    for (let i = arr.length - 1; i >= 0; i--) {
      const r = arr[i];
      categories.push(r.day || r[0]);
      kdata.push([parseFloat(r.open), parseFloat(r.close), parseFloat(r.low), parseFloat(r.high)]);
    }
    const option = {
      title: { text: `${code} K线 (${scale})`, left: 0, textStyle: { color: '#fff' } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      xAxis: { type: 'category', data: categories, scale: true, axisLabel: { color: '#ccc' } },
      yAxis: { scale: true, axisLabel: { color: '#ccc' } },
      series: [
        {
          name: 'K',
          type: 'candlestick',
          data: kdata,
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a'
          }
        }
      ]
    };
    chart.setOption(option, true);
  } catch (err) {
    console.error("kline fetch error", err);
  }
}

// 更新逻辑：根据模式周期性刷新
let intervalId = null;
function startAutoUpdate() {
  if (intervalId) clearInterval(intervalId);
  const period = config.mode === "realtime" ? 5 * 1000 : 60 * 1000; // 分时 5s，K 线 60s
  const loader = config.mode === "realtime" ? loadRealtime : () => loadKline(config.code, config.klineScale);
  loader(config.code);
  intervalId = setInterval(() => loader(config.code), period);
}

// UI 交互
document.getElementById("btn-settings").addEventListener("click", () => {
  document.getElementById("settings").classList.toggle("hidden");
  document.getElementById("stock-code").value = config.code;
  document.getElementById("mode-select").value = config.mode;
  document.getElementById("kline-scale").value = config.klineScale || 240;
});

document.getElementById("btn-save").addEventListener("click", async () => {
  const code = document.getElementById("stock-code").value.trim();
  const mode = document.getElementById("mode-select").value;
  const klineScale = parseInt(document.getElementById("kline-scale").value, 10) || 240;
  config.code = code;
  config.mode = mode;
  config.klineScale = klineScale;
  await api.saveWidgetConfig(config);
  document.getElementById("settings").classList.add("hidden");
  startAutoUpdate();
});

document.getElementById("btn-cancel").addEventListener("click", () => {
  document.getElementById("settings").classList.add("hidden");
});

document.getElementById("btn-new").addEventListener("click", async () => {
  // 创建一个新的 widget（同配置的副本）
  const newConf = Object.assign({}, config, { id: Date.now() });
  await api.createWidget(newConf);
});

document.getElementById("btn-toggle-mode").addEventListener("click", () => {
  config.mode = config.mode === "realtime" ? "kline" : "realtime";
  startAutoUpdate();
});

document.getElementById("btn-close").addEventListener("click", () => {
  window.close();
});

// 接收主进程 init
api.onInit((conf) => {
  config = Object.assign(config, conf || {});
  startAutoUpdate();
  // adjust chart size on resize
  window.addEventListener("resize", () => {
    chart.resize();
  });
});