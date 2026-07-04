import { youtube } from 'btch-downloader';
async function test() {
  const yt = await youtube('https://www.youtube.com/watch?v=kJQP7kiw5Fk');
  console.log(yt);
}
test();
