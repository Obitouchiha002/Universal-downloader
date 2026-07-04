async function test() {
  const url = 'https://c.ymcdn.org/api/v2/download/01a1c8e8fd3e2430b972883ff0e5580c/aqz-KE-bpKQ?_=mVzPKGpiP6fw4XWudVD0YPvQRVdtaeY1U2rKINFAbNSNlnWK1hyjk3htAdCXWxfmdmmn4t3xmulqDhu4RYPABw%3D%3D';
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const loc = res.headers.get('location');
    const cookies = res.headers.get('set-cookie');
    
    if (loc) {
      const res2 = await fetch(loc, {
        headers: { 'cookie': cookies || '' },
        redirect: 'manual'
      });
      const loc2 = res2.headers.get('location');
      const cookies2 = [cookies, res2.headers.get('set-cookie')].filter(Boolean).join('; ');
      
      if (loc2) {
        const res3 = await fetch(loc2, { headers: { 'cookie': cookies2 } });
        console.log('Status 3:', res3.status);
        console.log('Content-Type:', res3.headers.get('content-type'));
        console.log('Content-Length:', res3.headers.get('content-length'));
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
