<script type="text/plain" id="daily_append.mjs">
import fs from 'fs';

const apps = JSON.parse(fs.readFileSync('./apps.json','utf8'));
const backlog = JSON.parse(fs.readFileSync('./backlog.json','utf8'));
const have = new Set((apps.apps||[]).map(a=>a.slug));

// 允许的 handler（与 handlers.js 保持一致）
const allowed = new Set(['titleBoosterV1','toneSwitchV1','todoPriorityV1','dateNormalizeV1','bulletizeV1','keywordExpandV1','threeQuestionsV1','emailSubjectV1','oneSentenceSummaryV1','gratitudeCardV1','opening30sV1','compareConclusionV1','namingV1']);

const queue = backlog.queue.filter(x=>!have.has(x.slug) && allowed.has(x.handler));
if(queue.length===0){
  console.log('No backlog to append');
  process.exit(0);
}

const n = Math.min(Math.max(3, Math.floor(Math.random()*3)+3), queue.length); // 3–5
const picked = queue.slice(0, n);
apps.apps.push(...picked);
apps.today_count = n;

// 从 backlog 移除已添加的
backlog.queue = backlog.queue.filter(x=>!picked.find(p=>p.slug===x.slug));

fs.writeFileSync('./apps.json', JSON.stringify(apps, null, 2));
fs.writeFileSync('./backlog.json', JSON.stringify(backlog, null, 2));
console.log('Appended', n, 'items');
</script>
