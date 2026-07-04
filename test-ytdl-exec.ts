import youtubedl from 'youtube-dl-exec';
async function test() {
  try {
    const info = await youtubedl('https://www.youtube.com/watch?v=kJQP7kiw5Fk', {
      dumpJson: true,
      noWarnings: true
    });
    console.log(info.title);
  } catch(e) {
    console.error(e.message);
  }
}
test();
