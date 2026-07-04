async function test() {
  try {
    const res = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
      })
    });
    console.log('Status:', res.status);
    const data = await res.text();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
test();
