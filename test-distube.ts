import ytdl from '@distube/ytdl-core';
async function test() {
  try {
    const info = await ytdl.getInfo('https://www.youtube.com/watch?v=kJQP7kiw5Fk');
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    console.log(format.url);
  } catch(e) {
    console.error(e.message);
  }
}
test();
