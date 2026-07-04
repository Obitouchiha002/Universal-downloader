async function test() {
  try {
    const res = await fetch('https://backend1.tioo.eu.org/youtube?url=https://www.youtube.com/watch?v=kJQP7kiw5Fk');
    const data = await res.json();
    console.log(data);
  } catch(e) { console.log(e); }
}
test();
