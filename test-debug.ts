import https from 'https';

function proxyWithCookies(urlStr, resProxy, cookies = [], depth = 0) {
  if (depth > 5) {
    throw new Error('Too many redirects: ' + urlStr);
  }
  console.log('Fetching:', urlStr.substring(0, 50) + '...', 'Depth:', depth, 'Cookies:', cookies.length);
  https.get(urlStr, {
    headers: {
      'Cookie': cookies.join('; '),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }, (res) => {
    console.log('Status:', res.statusCode);
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      const newCookies = [...cookies];
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach((c) => newCookies.push(c.split(';')[0]));
      }
      return proxyWithCookies(res.headers.location, resProxy, newCookies, depth + 1);
    }
    resProxy(res);
  }).on('error', (err) => {
    console.error('Proxy error:', err);
    throw err;
  });
}

import { youtube } from 'btch-downloader';
async function test() {
  const yt = await youtube('https://www.youtube.com/watch?v=kJQP7kiw5Fk');
  proxyWithCookies(yt.mp4, (stream) => {
    console.log('Got stream!', stream.headers['content-type']);
    stream.destroy();
  });
}
test();
