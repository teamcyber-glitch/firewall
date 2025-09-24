const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Creator @Mrcyberteam1 EXECUTOR TEAM CYBER TELEGRAM
const [,, proxyFile, concurrencyArg, targetUrl] = process.argv;

if (!proxyFile || !concurrencyArg || !targetUrl) {
  console.log("Usage: node check.js file.txt $thread $url");
  process.exit(1);
}

const concurrency = parseInt(concurrencyArg, 10);
if (isNaN(concurrency) || concurrency <= 0) {
  console.error("Concurrency Number.");
  process.exit(1);
}

const onlineFile = 'online.txt';

if (fs.existsSync(onlineFile)) {
  fs.unlinkSync(onlineFile);
}

let totalLines = 0;
let totalChecked = 0;
let totalActive = 0;
let totalDead = 0;
let totalSkipped = 0;

const logProgress = () => {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`[Lines: ${totalLines}] [Checked: ${totalChecked}] [Active: ${totalActive}] [Dead: ${totalDead}] [Skipped: ${totalSkipped}]`);
};

const queue = [];
let readingDone = false;

const ipv4PortRegex = /^((?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2}):(\d{1,5})$/;

const checkProxy = async (proxy) => {
  const agent = new HttpsProxyAgent(`http://${proxy}`);
  try {
    const res = await axios.get(targetUrl, {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 5000,
      validateStatus: () => true,
    });

    totalChecked++;
    if (res.status === 200) {
      totalActive++;
      fs.appendFileSync(onlineFile, proxy + '\n');
    } else {
      totalDead++;
    }
  } catch (err) {
    totalChecked++;
    totalDead++;
    // @Mrcyberteam
    // EXECUTOR TEAM CYBER
  }
  logProgress();
};

const worker = async () => {
  while (true) {
    let proxy;
    if (queue.length > 0) {
      proxy = queue.shift();
    } else if (readingDone) {
      break;
    } else {
      await new Promise(r => setTimeout(r, 10));
      continue;
    }

    if (proxy) {
      await checkProxy(proxy);
    }
  }
};

const processProxies = async () => {
  const rl = readline.createInterface({
    input: fs.createReadStream(proxyFile),
    crlfDelay: Infinity
  });

  rl.on('line', line => {
    totalLines++;
    const raw = line.trim();
    if (!raw) {
      totalSkipped++;
      return;
    }

    const m = ipv4PortRegex.exec(raw);
    if (!m) {
      // @Mrcyberteam1 Telegram
      totalSkipped++;
      return;
    }

    const port = parseInt(m[2], 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      totalSkipped++;
      return;
    }

    queue.push(raw);
  });

  rl.on('close', () => {
    readingDone = true;
  });

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  logProgress();
  console.log('\nSuccessfully Checked All.');
  console.log(`Found: checked=${totalChecked}, active=${totalActive}, dead=${totalDead}, skipped=${totalSkipped}`);
};

processProxies();
