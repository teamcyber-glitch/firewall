const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const cliProgress = require('cli-progress');

const fileName = process.argv[2];
const concurrency = parseInt(process.argv[3]) || 500;

if (!fileName) {
  console.error('❌ CMD: node check.js proxy.txt 500');
  process.exit(1);
}

const startTime = new Date();
console.log(`🚀 Start: ${startTime.toLocaleString()}`);

const onlineFile = 'online.txt';
const logFile = 'log.txt';
const onlineStream = fs.createWriteStream(onlineFile, { flags: 'w' });

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
let totalProxies = 0;
let successCount = 0;
let failCount = 0;

const testUrl = 'https://httpbin.org/ip';
const timeout = 7000;

// Creator @Mrcyberteam1 EXECUTOR TEAM CYBER
(async () => {
  const PQueue = (await import('p-queue')).default;
  const queue = new PQueue({ concurrency });

  async function checkProxy(proxy) {
    proxy = proxy.trim();
    if (!proxy) return;

    try {
      const httpAgent = new HttpsProxyAgent(`http://${proxy}`);
      const response = await axios.get(testUrl, {
        httpsAgent: httpAgent,
        timeout,
      });

      if (response.status === 200) {
        onlineStream.write(`${proxy} | HTTP\n`);
        successCount++;
        return;
      }
    } catch (_) {}

    try {
      const socksAgent = new SocksProxyAgent(`socks5://${proxy}`);
      const response = await axios.get(testUrl, {
        httpsAgent: socksAgent,
        timeout,
      });

      if (response.status === 200) {
        onlineStream.write(`${proxy} | SOCKS5\n`);
        successCount++;
        return;
      }
    } catch (_) {}

    failCount++;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(fileName),
    crlfDelay: Infinity,
  });

  rl.on('line', (line) => {
    totalProxies++;
    queue.add(() => checkProxy(line).finally(() => {
      progressBar.increment();
    }));
  });

  rl.on('close', async () => {
    progressBar.start(totalProxies, 0);
    await queue.onIdle();
    progressBar.stop();
    onlineStream.end();

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const used = process.memoryUsage();
    const ramUsedMB = (used.rss / 1024 / 1024).toFixed(2);

    const logText = `
==== Proxy Check Selesai ====
🗂️  File Proxy   : ${fileName}
🕒 Mulai         : ${startTime.toLocaleString()}
🕒 Selesai       : ${endTime.toLocaleString()}
⏱️  Durasi       : ${duration} detik
✅ Sukses        : ${successCount}
❌ Gagal         : ${failCount}
📁 Disimpan di   : ${onlineFile}
🧠 RAM Digunakan : ${ramUsedMB} MB
==============================
`;

    console.log(logText);
    fs.appendFileSync(logFile, logText);
  });
})();
