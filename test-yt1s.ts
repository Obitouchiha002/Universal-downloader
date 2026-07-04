async function test() {
  const url = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk';
  try {
    const res = await fetch('https://yt1s.com/api/ajaxSearch/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0'
      },
      body: 'q=' + encodeURIComponent(url) + '&vt=home'
    });
    console.log(await res.text());
  } catch (err) { console.error(err); }
}
test();
