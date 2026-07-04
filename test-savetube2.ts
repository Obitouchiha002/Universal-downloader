async function test() {
  try {
    const res = await fetch('https://cdn406.savetube.vip/v2/info', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://save-tube.com/',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' })
    });
    console.log(await res.text());
  } catch (err) {
    console.log(err);
  }
}
test();
