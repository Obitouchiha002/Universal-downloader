import scraper from '@vreden/youtube_scraper';
const { ytmp4, ytmp3 } = scraper;

async function test() {
  const url = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk';
  try {
    const mp4 = await ytmp4(url, 720);
    console.log('Video:', mp4);
  } catch (e) {
    console.error(e);
  }
}
test();
