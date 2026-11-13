/* Ingredient-only matching: source-backed lists, explicit aliases and parent groups. */
(function(root){
  'use strict';
  const data=root.INGREDIENT_DATA||{recipes:{}};
  const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·•（）()]/g,'');
  const aliasGroups=[['番茄','西红柿'],['土豆','马铃薯','洋芋'],['花菜','菜花','花椰菜'],['西兰花','绿花菜'],['香菜','芫荽'],['生抽','生抽酱油'],['老抽','老抽酱油'],['淀粉','生粉'],['茄子','茄瓜'],['胡萝卜','红萝卜'],['鸡蛋','鸡子'],['黄瓜','青瓜']];
  for(const [canonical,other] of Object.entries(data.synonyms||{}))aliasGroups.push([canonical,...(Array.isArray(other)?other:[other])]);
  const aliases=new Map();
  for(const group of aliasGroups)for(const value of group)aliases.set(normalize(value),normalize(group[0]));
  const canonical=value=>aliases.get(normalize(value))||normalize(value);
  // Parent searches include named cuts, but a cut search does not expand to every parent dish.
  const families={
    牛肉:['黄牛肉','牛腩','牛柳','牛腱','牛腱子','牛里脊','牛外脊','牛腿肉','肥牛','牛排','牛尾','牛肋条','牛肉馅','牛肉丝','牛肉片','牛肉末','牛扒','牛肋','牛肋排'],
    猪肉:['五花肉','猪五花肉','猪里脊','猪腿肉','猪后腿肉','猪梅花肉','梅花肉','猪肉馅','猪肉末','猪肉丝','猪肉片','瘦猪肉','猪瘦肉','猪肘','猪蹄','猪排骨','猪排','猪手','猪脚'],
    鸡肉:['鸡','整鸡','仔鸡','三黄鸡','土鸡','鸡腿','鸡翅','鸡胸肉','鸡腿肉','鸡翅根','鸡翅中','鸡胸','鸡丝','鸡柳','鸡蓉','鸡排','鸡扒','乌鸡'],
    鸭肉:['鸭','整鸭','鸭腿','鸭胸','老鸭','鸭翅','鸭排'],羊肉:['羊腿','羊排','羊蝎子','羊腩','羊肉馅','羊腿肉','战斧羊排'],
    鱼:['鱼肉','鲈鱼','鲫鱼','鲤鱼','草鱼','鳜鱼','桂鱼','带鱼','黄鱼','黄花鱼','鲳鱼','鲅鱼','鳕鱼','鲢鱼','鳙鱼','胖头鱼','鱼头','鲟鱼','龙利鱼','罗非鱼','鲶鱼','鳝鱼'],
    虾:['大虾','鲜虾','虾仁','基围虾','河虾','海虾','对虾','明虾','青虾','白虾','虾尾'],
    豆腐:['嫩豆腐','老豆腐','北豆腐','南豆腐','内酯豆腐','冻豆腐'],
    辣椒:['青椒','红椒','青辣椒','红辣椒','泡辣椒','红泡椒','尖椒','小米椒','小米辣','泡椒','干辣椒','二荆条','杭椒','彩椒'],
    蘑菇:['香菇','口蘑','平菇','杏鲍菇','金针菇','茶树菇','蟹味菇','白玉菇']
  };
  const nameOf=x=>typeof x==='string'?x:x?.name||x?.ingredient||'';
  const listOf=xs=>[...new Set((xs||[]).map(nameOf).filter(Boolean))];
  const cache=new Map();
  const recipeKey=r=>(r.url||r.id||'').match(/BV[A-Za-z0-9]+/)?.[0]||r.id;
  function get(r){
    const key=recipeKey(r);if(cache.has(key))return cache.get(key);
    const entry=data.recipes?.[key]||data.recipes?.[r.id]||{};
    const out={...entry,main:listOf(entry.main),auxiliary:listOf(entry.auxiliary),evidence:entry.evidence||[],status:entry.status||'unresolved',unresolved:entry.unresolved||[],notes:entry.notes||''};
    cache.set(key,out);return out;
  }
  const terms=query=>String(query||'').trim().split(/[\s,，、;+；＋+]+/).filter(Boolean);
  function matchesName(name,term){
    const q=canonical(String(term||'').replace(/[（(][^）)]*[）)]/g,''));if(!q)return false;
    const raw=String(name),base=raw.replace(/[（(][^）)]*[）)]/g,'');
    const n=canonical(base),variants=[n];
    if(q==='猪肉'&&/品种待核|品种未确认/.test(raw)&&!base.includes('猪'))return false;
    for(const inner of raw.matchAll(/[（(]([^）)]+)[）)]/g))if(!/待核|未知|品种|未确认/.test(inner[1]))variants.push(canonical(inner[1]));
    if(variants.includes(q))return true;
    if(families[q])return variants.some(v=>families[q].map(canonical).includes(v));
    return variants.some(v=>v.includes(q));
  }
  function match(r,query,includeAuxiliary=false){
    const tokens=terms(query),entry=get(r);if(!tokens.length)return {matched:true,rank:0,main:[],auxiliary:[]};
    const main=[],auxiliary=[];let hasAuxiliary=false;
    for(const term of tokens){
      const m=entry.main.filter(name=>matchesName(name,term));
      if(m.length){main.push(...m);continue;}
      const a=includeAuxiliary?entry.auxiliary.filter(name=>matchesName(name,term)):[];
      if(!a.length)return {matched:false,rank:Infinity,main:[],auxiliary:[]};
      auxiliary.push(...a);hasAuxiliary=true;
    }
    return {matched:true,rank:hasAuxiliary?1:0,main:[...new Set(main)],auxiliary:[...new Set(auxiliary)]};
  }
  function statusLabel(entry){if(entry.ingredientListCoverage==='source_list_transcribed')return '作者食材清单已收录';return ({verified:'配方已核对',verified_partial:'部分食材已核对',title_only:'按标题／菜名识别',unresolved:'食材待核对',missing:'食材待核对',unknown:'食材待核对'})[entry.status]||'部分食材已整理';}
  root.IngredientSearch={data,get,recipeKey,terms,matchesName,match,statusLabel};
})(window);
