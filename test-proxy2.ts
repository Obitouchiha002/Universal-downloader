import https from 'https';

function proxyWithCookies(urlStr, resProxy, cookies = [], depth = 0) {
  if (depth > 10) {
    throw new Error('Too many redirects');
  }
  
  const parsedUrl = new URL(urlStr);
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    }
  };

  if (cookies.length > 0) {
    options.headers['Cookie'] = cookies.join('; ');
  }

  https.get(options, (res) => {
    console.log(`[Depth ${depth}] Status: ${res.statusCode} | Location: ${res.headers.location}`);
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      const newCookies = [...cookies];
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach((c) => newCookies.push(c.split(';')[0]));
      }
      const redirectUrl = new URL(res.headers.location, urlStr).toString();
      return proxyWithCookies(redirectUrl, resProxy, newCookies, depth + 1);
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
    console.log('Got final stream:', stream.statusCode);
    console.log('Headers:', stream.headers);
    stream.destroy();
  });
}
test();
