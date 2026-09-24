import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
setGlobalDispatcher(new EnvHttpProxyAgent());
const dir = 'D:/创业项目/4. SUMERU/.pnpm-store/v11/projects/8a6dc590da7aa461a9e37736e2d4d90e/.zhixian-library/';
const b64 = fs.readFileSync(dir + 'shen_teng.jpg').toString('base64');
const r = await fetch('http://localhost:3001/api/zhixian/match', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: 'data:image/jpeg;base64,' + b64, consentFaceSearch: true }),
});
const j = await r.json();
console.log('engine=', j.engine, 'mock=', j.mock);
console.log('top1=', JSON.stringify(j.top3?.[0] || null));
// 验证照片 URL 可访问
if (j.top3?.[0]?.photo) {
  const pr = await fetch(j.top3[0].photo, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('photo status=', pr.status, 'ct=', pr.headers.get('content-type'));
}
