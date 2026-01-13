import { contextBridge, ipcRenderer } from "electron";
import fetch from "node-fetch";

/**
 * Preload 暴露的 API:
 * - fetchQuote(code): 获取实时分时数据（新浪 hq.sinajs.cn）
 * - fetchKline(code, scale=240, datalen=200): 获取 K 线数据（新浪历史接口）
 * - saveWidgetConfig(conf)
 * - createWidget(conf)
 */

async function fetchQuote(code: string) {
  // 支持带前缀 sh/sz 或不带���自动判断）
  const symbol = formatSymbol(code);
  const url = `http://hq.sinajs.cn/list=${symbol}`;
  const res = await fetch(url);
  const txt = await res.text();
  // 返回原始字符串，renderer 解析
  return txt;
}

async function fetchKline(code: string, scale = 240, datalen = 200) {
  // scale 单位：1/5/15/30/60/240/日/周 等，新浪接口需要映射
  const symbol = formatSymbol(code);
  const url = `http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=${scale}&datalen=${datalen}`;
  const res = await fetch(url);
  const txt = await res.text();
  // 新浪返回非标准 JSON（可能带有换行），尝试解析为 JSON
  try {
    // 有时返回的是类似：[{...},{...}] 的字符串，直接 JSON.parse
    const data = JSON.parse(txt);
    return data;
  } catch (err) {
    // 返回原始文本以便 renderer 处理
    return txt;
  }
}

function formatSymbol(code: string) {
  code = code.trim();
  if (/^(sh|sz)/i.test(code)) return code.toLowerCase();
  // 简单按第一位判断
  if (/^6/.test(code)) return "sh" + code;
  return "sz" + code;
}

contextBridge.exposeInMainWorld("api", {
  fetchQuote: (code: string) => fetchQuote(code),
  fetchKline: (code: string, scale?: number, datalen?: number) =>
    fetchKline(code, scale, datalen),
  saveWidgetConfig: (conf: any) => ipcRenderer.invoke("save-widget-config", conf),
  createWidget: (conf: any) => ipcRenderer.invoke("create-widget", conf),
  onInit: (cb: (conf: any) => void) => ipcRenderer.on("widget-init", (_e, conf) => cb(conf))
});