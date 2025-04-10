const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FUTURES_EXCHANGE_PREFIX = 'BINANCE';
const WATCHLIST_SUFFIX = '.P'; // TradingView 合约标识

// 输出文件名
const USDT_FILE = 'usdt_pairs.txt';
const USDC_FILE = 'usdc_pairs.txt';

async function fetchFuturesSymbols() {
  try {
    const response = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
    return response.data.symbols;
  } catch (error) {
    console.error('❌ 获取合约信息失败:', error.message);
    return [];
  }
}

function filterSymbols(symbols, quoteAsset) {
  return symbols
    .filter(s => s.contractType === 'PERPETUAL' && s.quoteAsset === quoteAsset)
    .map(s => ({
      baseAsset: s.baseAsset,
      symbol: s.symbol,
      formatted: `${FUTURES_EXCHANGE_PREFIX}:${s.symbol}${WATCHLIST_SUFFIX}`
    }));
}

function getIntersection(usdtList, usdcList) {
  const usdcSet = new Set(usdcList.map(item => item.baseAsset));
  return usdtList.filter(item => usdcSet.has(item.baseAsset));
}

function saveListToFile(list, fileName) {
  const formatted = list.map(item => item.formatted).join('\n');
  fs.writeFileSync(path.join(__dirname, fileName), formatted, 'utf8');
  console.log(`✅ 写入成功：${fileName}，共 ${list.length} 个交易对`);
}

(async () => {
  const symbols = await fetchFuturesSymbols();

  const usdtPairs = filterSymbols(symbols, 'USDT');
  const usdcPairs = filterSymbols(symbols, 'USDC');
  const commonPairs = getIntersection(usdtPairs, usdcPairs);

  // 按 baseAsset 过滤后的结果写入
  const usdtFiltered = usdtPairs.filter(item => commonPairs.find(cp => cp.baseAsset === item.baseAsset));
  const usdcFiltered = usdcPairs.filter(item => commonPairs.find(cp => cp.baseAsset === item.baseAsset));

  saveListToFile(usdtFiltered, USDT_FILE);
  saveListToFile(usdcFiltered, USDC_FILE);
})();
