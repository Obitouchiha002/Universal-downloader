async function test() {
  const instances = [
    'https://co.eepy.moe',
    'https://cobalt.qwy2.dev',
    'https://dl.imput.net',
    'https://cobalt.wuk.sh'
  ];
  for (const instance of instances) {
    try {
      console.log('Testing', instance);
      const res = await fetch(instance + '/api/json', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' })
      });
      console.log(res.status);
      console.log(await res.text());
    } catch (err) {
      console.log('Failed', err.message);
    }
  }
}
test();
