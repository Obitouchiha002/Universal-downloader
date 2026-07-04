async function test() {
  try {
    const res = await fetch('https://api.vevioz.com/api/button/mp4/kJQP7kiw5Fk');
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}
test();
