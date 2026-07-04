import https from 'https';

const instances = [
  'https://cobalt.pk',
  'https://cobalt.c-g.host',
  'https://cobalt.am2.zip',
  'https://co.wuk.sh',
  'https://api.cobalt.tools',
  'https://cobalt.kwiatechu.com',
  'https://dl.khub.win',
  'https://co.komarev.com'
];

async function checkInstance(url) {
  return new Promise((resolve) => {
    const apiUrl = url + '/api/json';
    const req = https.request(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, data: data.substring(0, 100) });
      });
    });

    req.on('error', (err) => resolve({ url, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, error: 'timeout' }); });
    
    req.write(JSON.stringify({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' }));
    req.end();
  });
}

async function main() {
  for (const url of instances) {
    console.log(await checkInstance(url));
  }
}

main();
