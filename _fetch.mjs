import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
setGlobalDispatcher(new EnvHttpProxyAgent());
const names = ['沈腾','马丽','雷佳音','岳云鹏','贾玲','沙溢','白客','黄渤','徐峥','王宝强','大鹏','乔杉','常远','艾伦','魏翔','王迅','潘斌龙','宋小宝','小沈阳','文松','杨迪','金靖','辣目洋子','蒋龙','张弛','大锁','土豆','吕严','呼兰','庞博'];
const out = {};
for (const n of names) {
  try {
    const u = 'https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=' + encodeURIComponent(n) + '&bk_length=600';
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const j = await r.json();
    out[n] = { desc: j.desc || '', image: j.image || '' };
    console.log(n, '->', (j.image || 'NO_IMAGE').slice(0, 90), '|', (j.desc || '').slice(0, 20));
  } catch (e) {
    out[n] = { desc: '', image: '', error: String(e) };
    console.log(n, 'ERR', String(e).slice(0, 60));
  }
  await new Promise(r => setTimeout(r, 400));
}
fs.writeFileSync('_baike_images.json', JSON.stringify(out, null, 2), 'utf8');
console.log('DONE, saved _baike_images.json');
