import https from 'https';

async function checkInstances() {
  const urls = [
    'https://cobalt.qewertyy.dev',
    'https://co.e-z.host',
    'https://api.cobalt.tools',
    'https://api.cobalt.best',
    'https://api.cobalt.my.id',
    'https://api.cobalt.tech',
    'https://api.cobalt.wtf',
    'https://api.cobalt.world',
    'https://cobalt-api.peppe8o.com',
    'https://cobalt.api.zluo.de',
    'https://api.cobalt.run',
    'https://api.cobalt.cat',
    'https://cobalt.kwiatechu.com',
    'https://cobalt.vx.pet',
    'https://co.wuk.sh'
  ];

  for (const url of urls) {
    await new Promise((resolve) => {
      const req = https.request(url + '/api/json', { // older v7 endpoint or v10 endpoint
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        timeout: 3000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(url, res.statusCode, data.substring(0, 100));
          resolve();
        });
      });
      req.on('error', (err) => { console.log(url, err.message); resolve(); });
      req.on('timeout', () => { req.destroy(); resolve(); });
      req.write(JSON.stringify({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' }));
      req.end();
    });
  }
}
checkInstances();
