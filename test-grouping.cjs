const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const copy=value=>JSON.parse(JSON.stringify(value));
const evidence=(quote,url='https://www.bilibili.com/video/BVgrouped/')=>({source:'video_frame',quote,url});
const fixtures={
  BVgrouped:{
    // Stale aggregate data must never supply a match or a displayed ingredient.
    main:['牛肉','豆腐','aggregate-only'],auxiliary:['洋葱','辣椒','aggregate-aux-only'],
    status:'verified_partial',evidence:[evidence('视频整体核对记录')],notes:'分菜记录，不代表完整配方。',
    dishes:[
      {name:'A 牛肉菜',main:['牛肉','牛肉'],auxiliary:['洋葱'],notes:'A 菜来源说明',evidence:[evidence('A 菜 00:20 牛肉、洋葱')]},
      {name:'B 豆腐菜',main:[{name:'豆腐'}],auxiliary:[{ingredient:'辣椒'}],notes:'B 菜来源说明',evidence:[evidence('B 菜 01:30 豆腐、辣椒')]}
    ]
  },
  BVrank:{main:[],auxiliary:[],dishes:[
    {name:'辅料命中菜',main:['豆腐'],auxiliary:['牛肉']},
    {name:'主料命中菜',main:['牛肉'],auxiliary:['洋葱']}
  ]},
  BVempty:{main:['牛肉'],auxiliary:['辣椒'],dishes:[]},
  BVunknown:{main:['牛肉'],auxiliary:['辣椒'],dishes:[{name:'尚待核对的菜'}]},
  BVflat:{main:['牛肉'],auxiliary:['洋葱'],status:'title_only',evidence:[evidence('单菜来源')]},
  BValias:{dishes:[{name:'番茄牛腩',main:['牛腩','西红柿'],auxiliary:['老抽酱油']},{name:'其他菜',main:['鸡肉'],auxiliary:['花生']}]},
  BVescape:{dishes:[{name:'<img src=x onerror=bad()>',main:['<script>bad()</script>'],auxiliary:['a"b'],notes:'<b>原始说明</b>',evidence:[evidence('<b>原始引文</b>','javascript:bad()')]}]},
  BVmany:{dishes:['甲','乙','丙'].map(name=>({name,main:['牛肉'],auxiliary:[]}))}
};
const context={window:{INGREDIENT_DATA:{recipes:fixtures},RECIPE_COLLECTION:{recipes:[]},addEventListener(){}},document:{addEventListener(){}},console,URL};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/ingredient-search.js','utf8'),context);
const app=fs.readFileSync(__dirname+'/app.js','utf8');
vm.runInContext(app.split('const stateKey=')[0],context);
const index=context.window.IngredientSearch,run=code=>vm.runInContext(code,context);
const recipe=bv=>({url:`https://www.bilibili.com/video/${bv}/`});
const match=(bv,query,aux=false)=>index.match(recipe(bv),query,aux);
const names=(bv,query,aux=false)=>copy(match(bv,query,aux).matchedDishNames);

assert.deepEqual(copy(index.terms('洋葱（切丁，可选） 牛肉')),['洋葱','牛肉']);assert.equal(match('BVgrouped','洋葱（切丁，可选） 牛肉',true).matched,true);
// Multi-ingredient AND is scoped to a single dish, never to video-level unions.
for(const aux of [false,true])assert.equal(match('BVgrouped','牛肉 豆腐',aux).matched,false);
assert.equal(match('BVgrouped','牛肉 辣椒',true).matched,false);
assert.equal(match('BVgrouped','洋葱 辣椒',true).matched,false);
assert.equal(match('BVgrouped','牛肉 洋葱').matched,false);
assert.equal(match('BVgrouped','牛肉 洋葱',true).matched,true);
assert.equal(match('BVgrouped','牛肉 洋葱',true).rank,1);
assert.deepEqual(names('BVgrouped','牛肉 洋葱',true),['A 牛肉菜']);
assert.deepEqual(names('BVgrouped','牛肉'),['A 牛肉菜']);
assert.deepEqual(names('BVgrouped','豆腐'),['B 豆腐菜']);
assert.deepEqual(names('BVgrouped','辣椒',true),['B 豆腐菜']);
assert.equal(match('BVgrouped','辣椒').matched,false);
assert.deepEqual(names('BVgrouped','牛肉 豆腐',true),[]);

// A main match wins ranking even when an earlier dish uses it as an auxiliary.
const ranked=match('BVrank','牛肉',true);
assert.equal(ranked.rank,0);
assert.deepEqual(copy(ranked.matchedDishNames),['主料命中菜','辅料命中菜']);
assert.deepEqual(copy(ranked.matchedDishes.map(d=>[d.index,d.rank])),[[1,0],[0,1]]);
assert.deepEqual(names('BVrank','牛肉'),['主料命中菜']);
assert.equal(match('BVrank','牛肉 豆腐',true).rank,1);
assert.deepEqual(names('BVrank','牛肉 豆腐',true),['辅料命中菜']);

// Coverage unions are derived from the declared dishes and never mutate source data.
const grouped=index.get(recipe('BVgrouped'));
assert.deepEqual(copy(grouped.main),['牛肉','豆腐']);
assert.deepEqual(copy(grouped.auxiliary),['洋葱','辣椒']);
assert.deepEqual(copy(grouped.dishes[0].main),['牛肉']);
assert.equal(fixtures.BVgrouped.dishes[0].main.length,2);
for(const aux of [false,true]){
  assert.equal(match('BVgrouped','aggregate-only',aux).matched,false);
  assert.equal(match('BVgrouped','aggregate-aux-only',aux).matched,false);
  assert.equal(match('BVempty','牛肉',aux).matched,false);
  assert.equal(match('BVunknown','辣椒',aux).matched,false);
}
assert.equal(index.get(recipe('BVempty')).main.length,0);
assert.equal(index.get(recipe('BVunknown')).auxiliary.length,0);
assert.equal(match('BVempty','').matched,true);
assert.deepEqual(names('BVgrouped',''),['A 牛肉菜','B 豆腐菜']);

// Aliases, parent categories, separators, and auxiliary opt-in survive grouping.
assert.deepEqual(names('BValias','牛肉，番茄'),['番茄牛腩']);
assert.deepEqual(names('BValias','牛腩＋西红柿;老抽',true),['番茄牛腩']);
assert.equal(match('BValias','牛肉 花生',true).matched,false);
assert.equal(match('BVflat','牛肉 洋葱').matched,false);
assert.deepEqual(copy(match('BVflat','牛肉 洋葱',true)),{matched:true,rank:1,main:['牛肉'],auxiliary:['洋葱']});
assert.deepEqual(copy(match('BVflat','牛肉')),{matched:true,rank:0,main:['牛肉'],auxiliary:[]});

// Cards name individual dishes, restrict search previews, and never display aggregates.
const card=(bv,query='',aux=false)=>{
  run(`query=${JSON.stringify(query)};includeAuxiliary=${aux};searchMode='ingredient'`);
  return run(`cardIngredients(${JSON.stringify(recipe(bv))})`);
};
let html=card('BVgrouped');
assert(html.includes('视频内分菜记录 · 2 道'));
assert(html.includes('A 牛肉菜')&&html.includes('B 豆腐菜'));
assert(!html.includes('aggregate-only'));
html=card('BVgrouped','牛肉 洋葱',true);
assert(html.includes('匹配菜品 · 1 道'));
assert(html.includes('A 牛肉菜')&&!html.includes('B 豆腐菜'));
assert(!html.includes('豆腐')&&!html.includes('辣椒'));
assert(html.includes('含辅料匹配')&&html.includes('ingredient-hit'));
html=card('BVrank','牛肉',true);
assert(html.indexOf('主料命中菜')<html.indexOf('辅料命中菜'));
assert(html.includes('主料匹配')&&html.includes('含辅料匹配'));
assert(card('BVmany','牛肉').includes('另 1 道匹配菜品'));
assert(!card('BVflat').includes('视频内分菜记录'));

// Detail renders independent lists, notes, and sources, with click roles per dish.
const detail=bv=>run(`detailIngredients(${JSON.stringify(recipe(bv))})`);
html=detail('BVgrouped');
assert(html.includes('视频中的菜品用料')&&!html.includes('这道菜用什么'));
assert.equal((html.match(/class="ingredient-dish"/g)||[]).length,2);
const sections=[...html.matchAll(/<section class="ingredient-dish">([\s\S]*?)<\/section>/g)].map(m=>m[1]);
assert(sections[0].includes('A 牛肉菜')&&sections[0].includes('A 菜来源说明')&&sections[0].includes('A 菜 00:20'));
assert(!sections[0].includes('豆腐')&&!sections[0].includes('B 菜来源说明'));
assert(sections[1].includes('B 豆腐菜')&&sections[1].includes('B 菜来源说明')&&sections[1].includes('B 菜 01:30'));
assert(!sections[1].includes('牛肉')&&!sections[1].includes('A 菜来源说明'));
assert(html.includes('data-find-ingredient="牛肉" data-ingredient-role="main"'));
assert(html.includes('data-find-ingredient="洋葱" data-ingredient-role="auxiliary"'));
assert(html.includes('查看视频整体核对依据与原文')&&html.includes('视频整体核对记录'));
assert(!html.includes('aggregate-only'));
assert(detail('BVempty').includes('分菜用料待核对'));
assert(detail('BVflat').includes('这道菜用什么'));
assert(!detail('BVflat').includes('data-ingredient-role='));
assert(app.includes("includeAuxiliary=b.dataset.ingredientRole?b.dataset.ingredientRole==='auxiliary':entry.auxiliary.includes(b.dataset.findIngredient)"));

// Escape source-provided text and reject unsafe source links.
html=detail('BVescape');
assert(html.includes('&lt;img src=x onerror=bad()&gt;'));
assert(html.includes('&lt;b&gt;原始说明&lt;/b&gt;'));
assert(html.includes('&lt;b&gt;原始引文&lt;/b&gt;'));
assert(!html.includes('<img')&&!html.includes('<script>')&&!html.includes('href="javascript:'));
assert(html.includes('href="#"'));
console.log(JSON.stringify({passed:true,tests:['same-dish AND','no aggregate fallback','main-first dish ranking','matched dish names','coverage-only unions','aliases and auxiliary switch','separate card previews','separate detail lists and sources','dish-specific click roles','HTML and URL escaping']},null,2));
