import { youtube } from 'btch-downloader';
async function test() {
  const yt = await youtube('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  console.log(yt);
}
test();
