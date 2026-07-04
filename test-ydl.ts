import ydl from 'nothing-ydls';
async function test() {
  const data = await ydl.ytmp4('https://www.youtube.com/watch?v=kJQP7kiw5Fk');
  console.log(data);
}
test();
