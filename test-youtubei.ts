import { Innertube } from 'youtubei.js';

async function test() {
  try {
    const yt = await Innertube.create();
    const info = await yt.getInfo('kJQP7kiw5Fk');
    console.log(info.basic_info.title);
    
    // get best video+audio format
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    console.log('Video format url:', format?.decipher(yt.session.player));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
