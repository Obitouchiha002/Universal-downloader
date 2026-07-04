async function test() {
  const instances = [
    'https://cobalt.kwiatekit.com/',
    'https://cobalt.c7.pm/',
    'https://api.cobalt.owo.gay/',
    'https://cobalt.eevee.li/',
    'https://cobalt-api.kwiatekit.com/'
  ];
  for (const instance of instances) {
    try {
      console.log('Testing', instance);
      const res = await fetch(instance, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', videoQuality: "720" })
      });
      console.log(res.status);
      const text = await res.text();
      if (text.includes('url')) {
        console.log('Success!', text.substring(0, 100));
      }
    } catch (err) {
      console.log('Failed', err.message);
    }
  }
}
test();
