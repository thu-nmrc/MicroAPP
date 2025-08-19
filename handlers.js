export const AppHandlers = {
  /**
   * 标题放大器：preset = 新闻风 | 科普风 | 悬念风
   * 返回 3 个候选标题
   */
  titleBoosterV1(text, preset){
    const seed = (text||'今日主题').trim();
    const key = seed.replace(/[。！!,.\s]+$/,'');
    const news = [
      `重磅｜${key}：最新进展与关键看点`,
      `${key}发布：时间表、路线图与影响几何？`,
      `${key}丨一文读懂要点`,
    ];
    const sci = [
      `${key}是什么？3 分钟讲清楚`,
      `${key}：原理、应用与一个小例子`,
      `从 0 到 1 认识${key}`,
    ];
    const mystery = [
      `${key}，我们忽略了什么？`,
      `当${key}遇上现实，答案出乎意料`,
      `${key}背后的三个真相`,
    ];
    const bank = preset.includes('新')?news : preset.includes('科')?sci : mystery;
    return pick3(bank);
  },

  /**
   * 口吻转换：preset = 官方 | 轻松 | 技术
   */
  toneSwitchV1(text, preset){
    const s = (text||'感谢参与本次活动').trim();
    const map = {
      '官方': `【通知】${s.replace(/请|麻烦|辛苦/g,'请')}。如有问题，请及时反馈。`,
      '轻松': s.replace(/请/g,'麻烦') + '～有问题随时说哈🙂',
      '技术': s + '。注：详见文档/接口说明，按规范执行。'
    };
    const out = [ map['官方'], map['轻松'], map['技术'] ];
    const order = preset.includes('官')?0 : preset.includes('轻')?1 : 2;
    // 让所选口吻排在第一
    return [out[order], ...out.filter((_,i)=>i!==order)];
  },

  /**
   * 待办三优先级：检测紧急词/日期词，给出 P0/P1/P2
   */
  todoPriorityV1(text, preset, ctx){
    const s = (text||'整理报告').trim();
    const lower = s.toLowerCase();
    const urgent = /(立刻|马上|尽快|紧急|asap|今天|今晚|ddl|截止)/i.test(s);
    const soon = /(明天|后天|本周|周[一二三四五六日天])/i.test(s);
    const p = urgent? 'P0' : soon? 'P1' : 'P2';
    const now = ctx?.now || new Date();
    const dateStr = (d)=> `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    let suggest = '';
    if (p==='P0') suggest = `建议今天 ${pick(['17:00','18:00','21:00'])} 前完成`;
    if (p==='P1') suggest = `建议明天 ${pick(['10:00','14:00'])} 前完成（${dateStr(addDays(now,1))}）`;
    if (p==='P2') suggest = `建议本周内安排，${dateStr(addDays(now,3))} 前给出进度`;
    const who = preset.includes('负责人')? ' · 负责人：我' : '';
    const due = preset.includes('截止')? ' · 截止：' + (p==='P2'? dateStr(addDays(now,5)) : dateStr(addDays(now, p==='P0'?0:1))) : '';
    return [ `${p}｜${s}${who}${due}\n${suggest}` ];
  },

  /**
   * 时间表达标准化：解析“明天/下周三下午” 等
   * 返回 1–2 个候选标准时间
   */
  dateNormalizeV1(text, preset, ctx){
    const s = (text||'下周三下午开会').trim();
    const base = ctx?.now || new Date();
    const norm = parseCnDateTime(s, base, preset);
    return [ norm, `（候选）${parseCnDateTime(s, base, preset==='上午 09:00'?'下午 14:00':'上午 09:00')}` ];
  },

  /**
   * 一键分点：把长句拆 3–5 条
   */
  bulletizeV1(text, preset){
    const s = (text||'梳理素材、确定结构、写初稿、过一遍数据、提交版本').trim();
    const parts = splitSmart(s);
    let k = parts.length;
    if (preset.includes('更简')) k = Math.max(3, Math.ceil(parts.length*0.6));
    if (preset.includes('更完')) k = Math.min(5, Math.max(parts.length,3));
    const chosen = parts.slice(0,k);
    return chosen.map(x=> `• ${x}`);
  }
,

  /** 关键词扩展：同义 / 上位 / 下位 **/
  keywordExpandV1(text){
    const seed=(text||'人工智能').trim();
    const syn=[`${seed}应用`,`智能${seed.replace(/^(智能)?/,'')}`,`${seed}实践`,`高效${seed}`];
    const hyper=[`${seed}研究`,`${seed}方法`,`${seed}体系`,`${seed}框架`];
    const hypo=[`${seed}案例`,`${seed}工具`,`${seed}模型`,`${seed}评估`];
    return [
      `同义/相关：`+syn.join('、'),
      `上位/更宽：`+hyper.join('、'),
      `下位/更细：`+hypo.join('、')
    ];
  },

  /** 三问法：现象 / 机制 / 对策 **/
  threeQuestionsV1(text){
    const t=(text||'高校AI教学').trim();
    return [
      `现象：在何种场景下，${t}呈现出哪些可观测变化？`,
      `机制：这些变化可能由哪些关键因素驱动？变量之间的关系如何识别？`,
      `对策：若要优化${t}，优先干预哪三个杠杆？`
    ];
  },

  /** 邮件主题生成（5选） **/
  emailSubjectV1(text){
    const s=(text||'关于明日会议安排').trim();
    const bank=[
      `请确认：${s}`,
      `提醒：${s}（含附件）`,
      `${s}｜要点与时间表`,
      `征求意见：${s}`,
      `最终版：${s}`
    ];
    return bank;
  },

  /** 一句话摘要简化 **/
  oneSentenceSummaryV1(text){
    let s=(text||'我们将利用AI工具提升课程互动并减少教师重复劳动').trim();
    s=s.replace(/我们将|我们会|通过|以便|从而/g,'').replace(/以及|并且|还有/g,'、');
    const v1=`用AI提升课堂互动，减少教师重复劳动。`;
    const v2=s.endsWith('。')?s:s+'。';
    return [v1,v2];
  },

  /** 感谢卡 **/
  gratitudeCardV1(text){
    const who=(text||'各位同事').trim();
    return [
      `正式：感谢${who}的支持与配合，项目如期推进，特此致谢。`,
      `温暖：谢谢${who}一路相伴，因你们更有力量。`,
      `俏皮：${who}太棒啦！今天的进度条++ ✅`
    ];
  },

  /** 开场白30秒 **/
  opening30sV1(text){
    const topic=(text||'AI赋能教学').trim();
    return [
      `各位老师好，感谢莅临。今天我们聚焦“${topic}”。先给出路线图：为什么做、怎么做、做到什么程度。十分钟后给出可落地清单。`,
      `大家好，欢迎来到${topic}小课堂。我们从一个具体案例出发，拆成三步法，现场上手，保证会用、敢用、好用。`,
      `感谢各位的时间。今天目标只有一个：把${topic}的关键动作梳成三张清单，结束时每个人都能带走自己的第一版方案。`
    ];
  },

  /** 对比结论一句话（A vs B） **/
  compareConclusionV1(text){
    const s=(text||'方案A vs 方案B').trim();
    const m=s.split(/vs|VS|对比|与/);
    const A=(m[0]||'方案A').trim();
    const B=(m[1]||'方案B').trim();
    return [
      `在同等成本下，${A}更快上线；若追求长期可扩展，${B}更稳健。建议短期用${A}，中期并行验证${B}。`
    ];
  },

  /** 命名器（kebab/camel/snake） **/
  namingV1(text){
    const raw=(text||'ai teaching demo').trim().toLowerCase().replace(/[^a-z0-9\s-]+/g,'').replace(/\s+/g,' ').trim();
    const parts=raw.split(' ').filter(Boolean);
    const kebab=parts.join('-');
    const camel=parts.map((w,i)=> i? (w[0]||'').toUpperCase()+w.slice(1):w).join('');
    const snake=parts.join('_');
    const d=new Date();
    const ds=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    return [
      `kebab：${kebab}-${ds}`,
      `camel：${camel}${ds}`,
      `snake：${snake}_${ds}`
    ];
  }

,

  /** 关键词扩展：同义 / 上位 / 下位 **/
  keywordExpandV1(text){
    const seed=(text||'人工智能').trim();
    const syn=[`${seed}应用`,`智能${seed.replace(/^(智能)?/,'')}`,`${seed}实践`,`高效${seed}`];
    const hyper=[`${seed}研究`,`${seed}方法`,`${seed}体系`,`${seed}框架`];
    const hypo=[`${seed}案例`,`${seed}工具`,`${seed}模型`,`${seed}评估`];
    return [
      `同义/相关：`+syn.join('、'),
      `上位/更宽：`+hyper.join('、'),
      `下位/更细：`+hypo.join('、')
    ];
  },

  /** 三问法：现象 / 机制 / 对策 **/
  threeQuestionsV1(text){
    const t=(text||'高校AI教学').trim();
    return [
      `现象：在何种场景下，${t}呈现出哪些可观测变化？`,
      `机制：这些变化可能由哪些关键因素驱动？变量之间的关系如何识别？`,
      `对策：若要优化${t}，优先干预哪三个杠杆？`
    ];
  },

  /** 邮件主题生成（5选） **/
  emailSubjectV1(text){
    const s=(text||'关于明日会议安排').trim();
    const bank=[
      `请确认：${s}`,
      `提醒：${s}（含附件）`,
      `${s}｜要点与时间表`,
      `征求意见：${s}`,
      `最终版：${s}`
    ];
    return bank;
  },

  /** 一句话摘要简化 **/
  oneSentenceSummaryV1(text){
    let s=(text||'我们将利用AI工具提升课程互动并减少教师重复劳动').trim();
    s=s.replace(/我们将|我们会|通过|以便|从而/g,'').replace(/以及|并且|还有/g,'、');
    const v1=`用AI提升课堂互动，减少教师重复劳动。`;
    const v2=s.endsWith('。')?s:s+'。';
    return [v1,v2];
  },

  /** 感谢卡 **/
  gratitudeCardV1(text){
    const who=(text||'各位同事').trim();
    return [
      `正式：感谢${who}的支持与配合，项目如期推进，特此致谢。`,
      `温暖：谢谢${who}一路相伴，因你们更有力量。`,
      `俏皮：${who}太棒啦！今天的进度条++ ✅`
    ];
  },

  /** 开场白30秒 **/
  opening30sV1(text){
    const topic=(text||'AI赋能教学').trim();
    return [
      `各位老师好，感谢莅临。今天我们聚焦“${topic}”。先给出路线图：为什么做、怎么做、做到什么程度。十分钟后给出可落地清单。`,
      `大家好，欢迎来到${topic}小课堂。我们从一个具体案例出发，拆成三步法，现场上手，保证会用、敢用、好用。`,
      `感谢各位的时间。今天目标只有一个：把${topic}的关键动作梳成三张清单，结束时每个人都能带走自己的第一版方案。`
    ];
  },

  /** 对比结论一句话（A vs B） **/
  compareConclusionV1(text){
    const s=(text||'方案A vs 方案B').trim();
    const m=s.split(/vs|VS|对比|与/);
    const A=(m[0]||'方案A').trim();
    const B=(m[1]||'方案B').trim();
    return [
      `在同等成本下，${A}更快上线；若追求长期可扩展，${B}更稳健。建议短期用${A}，中期并行验证${B}。`
    ];
  },

  /** 命名器（kebab/camel/snake） **/
  namingV1(text){
    const raw=(text||'ai teaching demo').trim().toLowerCase().replace(/[^a-z0-9 -]+/g,'').replace(/ +/g,' ').trim();
    const parts=raw.split(' ').filter(Boolean);
    const kebab=parts.join('-');
    const camel=parts.map((w,i)=> i? (w[0]||'').toUpperCase()+w.slice(1):w).join('');
    const snake=parts.join('_');
    const d=new Date();
    const ds=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    return [
      `kebab：${kebab}-${ds}`,
      `camel：${camel}${ds}`,
      `snake：${snake}_${ds}`
    ];
  }

};


// ===== Helper Utils =====
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function pick3(arr){
  const a=[...arr]; const out=[]; for(let i=0;i<3 && a.length;i++){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); }
  return out;
}
function pad(n){return String(n).padStart(2,'0')}
function addDays(d, n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }

function splitSmart(s){
  // 按中文逗号/顿号/分号/and/、等切分
  const tmp = s
    .replace(/[;；、]/g,'，')
    .replace(/\s*(和|以及|并且|然后|再|再就是|还有)\s*/g,'，')
    .split(/[，,。]+/)
    .map(t=>t.trim()).filter(Boolean);
  // 去重与规整
  return [...new Set(tmp)].slice(0,5);
}

function parseCnDateTime(text, base, preset){
  const now = new Date(base);
  const lower = text.toLowerCase();
  const ampm = preset?.includes('上午')? '09:00' : preset?.includes('下午')? '14:00' : '10:00';

  // 今天/明天/后天
  if(/今天/.test(text)) return fmt(now, ampm);
  if(/明天/.test(text)) return fmt(addDays(now,1), ampm);
  if(/后天/.test(text)) return fmt(addDays(now,2), ampm);

  // 本周/下周 + 星期几 + (上午/下午)
  const m = text.match(/(下)?周([一二三四五六日天])(上午|下午)?/);
  if(m){
    const isNext = !!m[1];
    const wd = '一二三四五六日天'.indexOf(m[2]); // 0..6
    const want = wd===6?0:wd+1; // 周日/天->0
    const target = toWeekday(now, want, isNext);
    const t = m[3]?.includes('上')? '09:00' : m[3]?.includes('下')? '14:00' : ampm;
    return fmt(target, t);
  }

  // 直接日期：YYYY-MM-DD 或 M/D
  const md = text.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if(md){ return `${md[1]}-${pad(+md[2])}-${pad(+md[3])} ${ampm}`; }
  const md2 = text.match(/(\d{1,2})[./-](\d{1,2})/);
  if(md2){ const y=now.getFullYear(); return `${y}-${pad(+md2[1])}-${pad(+md2[2])} ${ampm}`; }

  // 回退：今天 + 默认时段
  return fmt(now, ampm);
}
function toWeekday(base, want, nextWeek){
  const d = new Date(base);
  const cur = d.getDay();
  let diff = want - cur; if (diff<=0 || nextWeek) diff += 7;
  d.setDate(d.getDate()+diff); return d;
}
function fmt(d, hhmm){
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${hhmm}`;
}
