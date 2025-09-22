const fs = require('fs');
const fsPromises = require('fs').promises;
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const cliProgress = require('cli-progress');

// Creator @Mrcyberteam1 EXECUTOR TEAM CYBER
const fileName = process.argv[2];
const concurrency = parseInt(process.argv[3]) || 10;

if (!fileName) {
  console.error('❌ CMD: node check.js proxy.txt 20');
  process.exit(1);
}

const startTime = new Date();
console.log(`🚀 Start: ${startTime.toLocaleString()}`);

let proxies = [];
try {
  const data = fs.readFileSync(fileName, 'utf8');
  proxies = data.split('\n').map(p => p.trim()).filter(p => p);
  proxies = [...new Set(proxies)];
} catch (err) {
  console.error(`❌ Failed Read File: ${fileName}`);
  process.exit(1);
}

console.log(`🔍 Checking ${proxies.length} proxy with concurrency ${concurrency}...\n`);

const onlineFile = 'online.txt';
const logFile = 'log.txt';

const onlineStream = fs.createWriteStream(onlineFile, { flags: 'w' });

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(proxies.length, 0);

let successCount = 0;
let failCount = 0;

const testUrl = 'https://httpbin.org/ip';

async function checkProxy(proxy) {
  const proxyUrl = `http://${proxy}`;
  const timeout = 7000;

  try {
    const httpAgent = new HttpsProxyAgent(proxyUrl);
    const httpResponse = await axios.get(testUrl, {
      httpsAgent: httpAgent,
      timeout,
    });

    if (httpResponse.status === 200) {
      successCount++;
      onlineStream.write(`${proxy} | HTTP\n`);
      progressBar.increment();
      return;
    }
  } catch (err) {
 
  }

  try {
    const socksAgent = new SocksProxyAgent(`socks5://${proxy}`);
    const socksResponse = await axios.get(testUrl, {
      httpsAgent: socksAgent,
      timeout,
    });

    if (socksResponse.status === 200) {
      successCount++;
      onlineStream.write(`${proxy} | SOCKS5\n`);
      progressBar.increment();
      return;
    }
  } catch (err) {

  }

  failCount++;
  progressBar.increment();
}

let index = 0;
async function runQueue() {
  const tasks = [];

  while (index < proxies.length) {
    while (tasks.length < concurrency && index < proxies.length) {
      const currentProxy = proxies[index++];
      tasks.push(checkProxy(currentProxy));
    }

    await Promise.allSettled(tasks);
    tasks.length = 0;
  }
}

(async () => {
  await runQueue();

  onlineStream.end();
  progressBar.stop();

  const endTime = new Date();
  const durationMs = endTime - startTime;
  const durationSec = (durationMs / 1000).toFixed(2);
  const used = process.memoryUsage();
  const ramUsedMB = (used.rss / 1024 / 1024).toFixed(2);

  const logText = `
==== Proxy Check Selesai ====
🗂️  File Proxy   : ${fileName}
🕒 Mulai         : ${startTime.toLocaleString()}
🕒 Selesai       : ${endTime.toLocaleString()}
⏱️  Durasi       : ${durationSec} detik
✅ Sukses        : ${successCount}
❌ Gagal         : ${failCount}
📁 Disimpan di   : ${onlineFile}
🧠 RAM Digunakan : ${ramUsedMB} MB
Creator by @Mrcyberteam1 - Telegram
==============================
`;

  console.log(logText);
  await fsPromises.appendFile(logFile, logText);
})();
