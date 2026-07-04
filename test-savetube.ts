async function test() {
  try {
    const res = await fetch('https://media.savetube.vip/api/random-cdn');
    console.log(await res.text());
  } catch (err) {
    console.log(err);
  }
}
test();
