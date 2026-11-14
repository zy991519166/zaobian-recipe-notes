const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{addEventListener(){}},document:{addEventListener(){}},console};vm.createContext(context);
for(const file of ['data.js','laofangu.js','tag-enrichment.js','ingredient-data.js','ingredient-search.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),context);
const app=fs.readFileSync(__dirname+'/app.js','utf8');vm.runInContext(app.split("const stateKey=")[0],context);
const run=s=>vm.runInContext(s,context),get=value=>JSON.parse(JSON.stringify(value));
const originalPath=__dirname+'/../recipe-live-source/zaobian-recipe-notes-main/';
if(fs.existsSync(originalPath+'data.js')){const original={window:{}};vm.createContext(original);for(const file of ['data.js','laofangu.js','tag-enrichment.js'])vm.runInContext(fs.readFileSync(originalPath+file,'utf8'),original);assert.deepEqual(get(context.window.RECIPE_COLLECTION),get(original.window.RECIPE_COLLECTION),'Existing catalog was modified');}
assert.equal(run('recipes.length'),945);assert.equal(run('filteredRecipes().length'),918);
const dataset=context.window.INGREDIENT_DATA,index=context.window.IngredientSearch;
assert.deepEqual(get(dataset),JSON.parse(fs.readFileSync(__dirname+'/ingredient-data.json','utf8')),'Browser and reusable ingredient data differ');
assert.equal(Object.keys(dataset.recipes).length,945);
for(const recipe of context.window.RECIPE_COLLECTION.recipes){const entry=index.get(recipe);assert(dataset.recipes[index.recipeKey(recipe)],recipe.id+' missing index');assert(Array.isArray(entry.main)&&Array.isArray(entry.auxiliary));assert(entry.evidence.length>0,recipe.id+' missing source evidence');assert(new Set(entry.main).size===entry.main.length);assert(new Set(entry.auxiliary).size===entry.auxiliary.length);for(const e of entry.evidence){assert(e.quote&&e.url,recipe.id+' incomplete evidence');assert(/^https?:\/\//.test(e.url));}}
assert(index.matchesName('牛腩','牛肉'));assert(index.matchesName('黄牛肉','牛肉'));assert(!index.matchesName('牛肉','牛腩'));assert(index.matchesName('西红柿','番茄'));assert(index.matchesName('番茄','西红柿'));assert(index.matchesName('马铃薯','土豆'));assert(!index.matchesName('五花肉（品种待核）','猪肉'));assert(index.matchesName('牛肋排','牛肉'));assert(index.matchesName('牛肉丝','牛肉'));assert(!index.matchesName('牛油果','牛肉'));assert(index.matchesName('生蚝','牡蛎'));assert(index.matchesName('包菜','圆白菜'));assert(!index.matchesName('鸡蛋','鸡肉'));assert(!index.matchesName('鸡精','鸡肉'));assert(!index.matchesName('排骨（品种待核）','猪肉'));assert(!index.matchesName('肘子（品种待核）','猪肉'));assert(!index.matchesName('鲍鱼','鱼'));assert(!index.matchesName('鱿鱼','鱼'));
// Author-source recovery must remain searchable without inventing missing species or optional steps.
const recovered=(bv,term,aux=false)=>index.match({url:'https://www.bilibili.com/video/'+bv+'/'},term,aux).matched;
assert(recovered('BV1eKgY6CEEH','牛腱子'));assert(recovered('BV1eKgY6CEEH','牛肉'));
assert(!recovered('BV1eKgY6CEEH','黄酱'));assert(recovered('BV1eKgY6CEEH','黄酱',true));
assert(recovered('BV1eKgY6CEEH','牛腱子 桂皮',true));assert(recovered('BV1eKgY6CEEH','食用油',true));
assert(dataset.recipes.BV1eKgY6CEEH.auxiliary.includes('食用油（可选糖色用）'));
assert(recovered('BV1cPjc6EEyM','虾 葱',true));assert(!recovered('BV1cPjc6EEyM','葱'));
assert(recovered('BV1GoMw6HEDP','豆角'));assert(recovered('BV1GoMw6HEDP','油豆角'));assert(recovered('BV1GoMw6HEDP','土豆',true));assert(!recovered('BV1GoMw6HEDP','猪肉'));
assert(dataset.recipes.BV1GoMw6HEDP.auxiliary.includes('干辣椒（可选）'));
assert(recovered('BV1GoMw6HEDP','干辣椒（可选）',true));
assert(recovered('BV1GoMw6HEDP','排骨（品种待核）'));
assert(recovered('BV1eKgY6CEEH','食用油（可选糖色用）',true));
assert(recovered('BV1qd2tYwE7A','水',true));
assert(recovered('BV1JY411K7PJ','蔬菜汁',true));assert(recovered('BV1eV4y1h7P9','蔬菜',true));assert(!recovered('BV1eV4y1h7P9','可乐',true));
assert.equal(Object.values(dataset.recipes).filter(e=>e.ingredientListCoverage==='source_list_transcribed').length,12);
for(const e of Object.values(dataset.recipes).filter(e=>e.ingredientListCoverage==='source_list_transcribed')){
  assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(index.statusLabel(e),'作者食材清单已收录');
  assert(e.ingredientListNote.includes('不等于'));assert(e.evidence.some(x=>['recipe_card','description','pinned_comment'].includes(x.source)));
  for(const name of e.sourceIngredientList?.indexedNames||[])assert([...e.main,...e.auxiliary].includes(name),'Author list name omitted: '+name);
}
assert.equal(dataset.stats.withAuxiliary,Object.values(dataset.recipes).filter(e=>e.auxiliary.length).length);
assert.equal(dataset.stats.authorIngredientListsTranscribed,12);
// Six historical description gaps now have sampled original-video evidence, not complete inventories.
const gapIds=['BV1M34y1D7hb','BV17g4y1f7bU','BV1ab4y1s7wk','BV1RC411p79s','BV1gr4y1n7uv','BV15P411V7YS'];
for(const bv of gapIds){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);assert(!e.notes.includes('仅据原视频标题'));assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(e.evidence.some(x=>x.source==='video_frame'));assert(e.ingredientListNote.includes('不等于'));}
assert(recovered('BV1M34y1D7hb','米饭 芹菜',true));assert(!recovered('BV1M34y1D7hb','芹菜'));
assert(recovered('BV17g4y1f7bU','排骨 话梅',true));assert(!recovered('BV17g4y1f7bU','话梅'));assert(!recovered('BV17g4y1f7bU','猪肉'));
assert(recovered('BV1ab4y1s7wk','鸡蛋 黄酒 淀粉',true));assert(!recovered('BV1ab4y1s7wk','咸蛋黄',true));assert(!recovered('BV1ab4y1s7wk','鱼',true));assert(!recovered('BV1ab4y1s7wk','蚝油',true));
assert(recovered('BV1RC411p79s','肠'));assert(recovered('BV1RC411p79s','肝 酒',true));assert(!recovered('BV1RC411p79s','猪肉'));
assert(recovered('BV1gr4y1n7uv','腰花 酱油',true));assert(!recovered('BV1gr4y1n7uv','猪肉'));assert(!recovered('BV1gr4y1n7uv','高汤',true));
assert(recovered('BV15P411V7YS','面粉'));assert(recovered('BV15P411V7YS','低筋面粉'));assert(recovered('BV15P411V7YS','面粉 红菜头汁',true));assert(!recovered('BV15P411V7YS','蜜枣',true));assert(!recovered('BV15P411V7YS','枣泥',true));
assert.equal(dataset.stats.withMain,847);assert.equal(dataset.stats.withAuxiliary,257);assert.equal(dataset.stats.status.unknown,88);assert.equal(dataset.stats.sampledVideoRecipes,22);assert.equal(dataset.limits.fullVideosWatched,0);assert.equal(dataset.limits.originalDescriptionsMissing,6);
// Exact user beef examples: author card vs partial video evidence remain distinct.
assert(recovered('BV1KDdSBZEVw','牛腩'));assert(recovered('BV1KDdSBZEVw','牛肉 西红柿'));
for(const term of ['料包','香芹','胡萝卜','黄油','水','食用油','番茄沙司','香菜']){assert(recovered('BV1KDdSBZEVw',term,true));assert(!recovered('BV1KDdSBZEVw',term));}
assert(!recovered('BV1KDdSBZEVw','八角',true));assert(!recovered('BV1KDdSBZEVw','桂皮',true));
assert(dataset.recipes.BV1KDdSBZEVw.auxiliary.includes('香菜（可不放）'));
assert(dataset.recipes.BV1KDdSBZEVw.auxiliary.includes('番茄沙司（可替代番茄酱）'));
assert.equal(dataset.recipes.BV1KDdSBZEVw.ingredientListCoverage,'source_list_transcribed');
assert(recovered('BV1WU4y1n7Xr','牛肉 青椒 生抽',true));assert(recovered('BV1WU4y1n7Xr','胡椒',true));assert(!recovered('BV1WU4y1n7Xr','牛外脊'));assert(!recovered('BV1WU4y1n7Xr','黄牛肉'));assert(!recovered('BV1WU4y1n7Xr','芹菜',true));
assert(recovered('BV14P4y1X77X','牛外脊'));assert(recovered('BV14P4y1X77X','黄牛肉'));assert(recovered('BV14P4y1X77X','牛肉'));assert(recovered('BV14P4y1X77X','牛外脊 泡辣椒',true));assert(!recovered('BV14P4y1X77X','牛里脊'));assert(!recovered('BV14P4y1X77X','黄酒',true));
assert(index.matchesName('牛外脊','牛肉'));assert(!index.matchesName('牛肉','牛外脊'));assert(index.matchesName('泡辣椒（红）','辣椒'));
for(const bv of ['BV1KDdSBZEVw','BV1WU4y1n7Xr','BV14P4y1X77X']){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);}
assert(app.split('const sourceLabel=source=>')[1].split(';')[0].includes("official_crosspost_description:'官方同片简介（跨平台）'"));assert(app.split('const sourceLabel=source=>')[1].split(';')[0].includes("crosspost_match:'跨平台同片核对记录'"));
// Confirmed official cross-posts: ingredient facts, not title-based substitution or complete recipes.
for(const bv of ['BV1MM4m1R7iD','BV1Uv4y1m7ve','BV1BxpMeqE5F','BV1Zu4y1U7pL','BV1zD4y117Bf','BV1uV4y1W7rZ','BV1a24y1b7aW','BV1Rj41177bg','BV1Q5411J7PE','BV1FT4y1P7Ca']){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.crosspostMatched,true);assert.equal(e.ingredientListCoverage,'partial_crosspost_evidence');assert(e.evidence.some(x=>x.source==='official_crosspost_description'&&x.url.includes('youtube.com/watch?v=')));assert(e.evidence.some(x=>x.source==='crosspost_match'));assert(e.evidence.some(x=>x.source==='video_frame'&&x.url.includes(bv)));}
assert.equal(dataset.stats.officialCrosspostDescriptionsReviewed,10);
const crosspostHTML=run("detailIngredients({url:'https://www.bilibili.com/video/BV1MM4m1R7iD/'})");assert(crosspostHTML.includes('官方同片简介（跨平台）'));assert(crosspostHTML.includes('跨平台同片核对记录'));assert(!crosspostHTML.includes('official_crosspost_description'));assert(!crosspostHTML.includes('crosspost_match'));

assert(recovered('BV1MM4m1R7iD','老母鸡'));assert(recovered('BV1MM4m1R7iD','鸡肉'));assert(recovered('BV1MM4m1R7iD','鸡头'));assert(recovered('BV1MM4m1R7iD','鸡爪'));assert(recovered('BV1MM4m1R7iD','鸡胸肉 黄酒',true));assert(!recovered('BV1MM4m1R7iD','黄酒'));assert(!recovered('BV1MM4m1R7iD','猪肉'));assert(!recovered('BV1MM4m1R7iD','食用油',true));
for(const term of ['粘米粉','糯米粉','澄面','山药'])assert(recovered('BV1Uv4y1m7ve',term));for(const term of ['糖粉','大油','牛奶','菠菜汁','黄瓜汁','可可粉']){assert(recovered('BV1Uv4y1m7ve',term,true));assert(!recovered('BV1Uv4y1m7ve',term));}assert(!recovered('BV1Uv4y1m7ve','白菜',true));assert(!recovered('BV1Uv4y1m7ve','猪油',true));
// Matched pastry cross-posts preserve known ingredients and leave unidentified components unresolved.
for(const term of ['花生','扁桃仁','腰果','核桃仁','白芝麻','低筋面粉'])assert(recovered('BV1BxpMeqE5F',term));
for(const term of ['黄油','吉士粉','盐','熟粉','蛋液']){assert(recovered('BV1BxpMeqE5F',term,true));assert(!recovered('BV1BxpMeqE5F',term));}
assert(recovered('BV1BxpMeqE5F','花生 核桃仁'));assert(recovered('BV1BxpMeqE5F','花生 黄油',true));assert(!recovered('BV1BxpMeqE5F','糯米粉',true));assert(!recovered('BV1BxpMeqE5F','瓜子',true));
for(const term of ['中筋面粉','低筋面粉','胡萝卜'])assert(recovered('BV1Zu4y1U7pL',term));
for(const term of ['南瓜汁','火龙果汁','大油','水','蛋液','芝麻','食用油']){assert(recovered('BV1Zu4y1U7pL',term,true));assert(!recovered('BV1Zu4y1U7pL',term));}
for(const term of ['莲蓉','豆沙','荷花','白糖','食用色素','猪油'])assert(!recovered('BV1Zu4y1U7pL',term,true));
assert(dataset.recipes.BV1Zu4y1U7pL.unresolved.some(x=>x.includes('馅的其他组成')));
assert(dataset.recipes.BV1BxpMeqE5F.evidence.some(x=>x.quote.includes('馅55克')&&x.source==='video_frame'));
for(const bv of ['BV1BxpMeqE5F','BV1Zu4y1U7pL']){const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('官方同片简介（跨平台）'));assert(html.includes('跨平台同片核对记录'));assert(html.includes('部分食材已核对'));assert(html.includes('不等于'));}
// Three source-matched recoveries: not inferred species, optional variants, or an accompanying dish.
for(const term of ['瘦肉','肥肉'])assert(recovered('BV1Rj41177bg',term));
for(const term of ['黄酱','姜','水淀粉','花椒','盐','油菜叶','食用油']){assert(recovered('BV1Rj41177bg',term,true));assert(!recovered('BV1Rj41177bg',term));}
for(const term of ['猪肉','牛肉','红薯淀粉','玉米淀粉','葱'])assert(!recovered('BV1Rj41177bg',term,true));
assert(dataset.recipes.BV1Rj41177bg.auxiliary.includes('味精（菜松可选调味）'));
for(const term of ['胡萝卜','香菜','粉丝'])assert(recovered('BV1Q5411J7PE',term));
for(const term of ['姜','玉米淀粉','面粉','五香粉','盐','鸡蛋','小苏打','食用油']){assert(recovered('BV1Q5411J7PE',term,true));assert(!recovered('BV1Q5411J7PE',term));}
for(const term of ['豆腐','馒头','土豆','山药','藕丁','马蹄','十三香'])assert(!recovered('BV1Q5411J7PE',term,true));
for(const term of ['老豆腐','木耳','鸡蛋'])assert(recovered('BV1FT4y1P7Ca',term));
for(const term of ['小葱','香菜','胡椒粉','香油','醋','盐','酱油','食用油','水淀粉']){assert(recovered('BV1FT4y1P7Ca',term,true));assert(!recovered('BV1FT4y1P7Ca',term));}
for(const term of ['腊八蒜','蒜','辣椒','肉','火烧','高汤'])assert(!recovered('BV1FT4y1P7Ca',term,true));
assert.equal(dataset.recipes.BV1FT4y1P7Ca.sourceReview.crosspostMatchScope,'soup_segment');
assert(dataset.recipes.BV1FT4y1P7Ca.evidence.some(e=>e.source==='video_frame'&&e.quote.includes('鸡蛋2个')&&e.quote.includes('另加醋20克')));
for(const bv of ['BV1Rj41177bg','BV1Q5411J7PE','BV1FT4y1P7Ca']){const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('部分食材已核对'));assert(html.includes('官方同片简介（跨平台）'));assert(html.includes('原视频画面／字幕（抽查）'));assert(html.includes('不等于'));}
// Read-only classification review must not alter this existing entry or add ingredients from viewer photos.
assert.equal(dataset.recipes.BV1Mm41117uf.status,'unknown');assert.equal(dataset.recipes.BV1Mm41117uf.main.length,0);assert.equal(dataset.recipes.BV1Mm41117uf.auxiliary.length,0);
// Matched fruit/flower pastries: real fillings, grouped quantities, and unknowns kept separate.
for(const term of ['低筋面粉','核桃仁','花生米','腰果','瓜子仁','扁桃仁','五仁馅'])assert(recovered('BV1zD4y117Bf',term));
for(const term of ['黄油','绵白糖','鸡蛋','可可粉','熟面粉','白糖','食用油']){assert(recovered('BV1zD4y117Bf',term,true));assert(!recovered('BV1zD4y117Bf',term));}
for(const term of ['葵花籽','南瓜籽','猪油','盐','花椒'])assert(!recovered('BV1zD4y117Bf',term,true));
assert(dataset.recipes.BV1zD4y117Bf.evidence.some(x=>x.source==='official_crosspost_description'&&x.quote.includes('馅剂18克')&&x.quote.includes('皮剂12克')));
for(const term of ['中筋面粉','红枣','大枣','枣泥'])assert(recovered('BV1uV4y1W7rZ',term));
for(const term of ['白糖','泡打粉','酵母','水','红曲粉','可可粉','黑芝麻']){assert(recovered('BV1uV4y1W7rZ',term,true));assert(!recovered('BV1uV4y1W7rZ',term));}
for(const term of ['锡纸','牙签','低筋面粉','食用油','红菜头'])assert(!recovered('BV1uV4y1W7rZ',term,true));
assert(dataset.recipes.BV1uV4y1W7rZ.auxiliary.includes('黑芝麻（可选装饰）'));
for(const term of ['低筋面粉','中筋面粉'])assert(recovered('BV1a24y1b7aW',term));
for(const term of ['猪油','水','蛋清','可可粉','食用油','白糖']){assert(recovered('BV1a24y1b7aW',term,true));assert(!recovered('BV1a24y1b7aW',term));}
for(const term of ['玉兰花','莲蓉','豆沙','山药'])assert(!recovered('BV1a24y1b7aW',term,true));
assert(dataset.recipes.BV1a24y1b7aW.auxiliary.includes('可可粉（花蒂可选）'));
for(const bv of ['BV1zD4y117Bf','BV1uV4y1W7rZ','BV1a24y1b7aW']){const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('部分食材已核对'));assert(html.includes('官方同片简介（跨平台）'));assert(html.includes('不等于'));}
// Sui originals: distinguish dish titles, exact cuts, and a separate mock-crab recipe.
assert(recovered('BV1ow411k7qt','青椒'));assert(recovered('BV1ow411k7qt','辣椒'));
for(const term of ['蒜','生抽','糖','醋','香菜','食用油']){assert(recovered('BV1ow411k7qt',term,true));assert(!recovered('BV1ow411k7qt',term));}
for(const term of ['黑椒','黑胡椒','螺丝椒','花生','鸡蛋'])assert(!recovered('BV1ow411k7qt',term,true));
assert(!dataset.recipes.BV1ow411k7qt.evidence.some(e=>e.source==='cover'));
for(const term of ['牛肉','牛腩','牛肋腩','番茄','西红柿'])assert(recovered('BV1RN4y1r7dt',term));
for(const term of ['色拉油','葱','蒜','番茄酱','盐','味精','糖','香菜']){assert(recovered('BV1RN4y1r7dt',term,true));assert(!recovered('BV1RN4y1r7dt',term));}
for(const term of ['姜','黄油','料包','胡萝卜','高汤','水'])assert(!recovered('BV1RN4y1r7dt',term,true));
assert(recovered('BV1RN4y1r7dt','牛腩 番茄'));assert(recovered('BV1RN4y1r7dt','牛肋腩 番茄酱',true));
assert(dataset.recipes.BV1RN4y1r7dt.evidence.some(e=>e.quote.includes('味精一克')));
for(const term of ['黄鱼','鱼','咸鸭蛋黄','鸡蛋清'])assert(recovered('BV1rV411A7fE',term));
for(const term of ['姜','淀粉','醋','酱油','香油','食用油']){assert(recovered('BV1rV411A7fE',term,true));assert(!recovered('BV1rV411A7fE',term));}
for(const term of ['蟹肉','螃蟹','蟹黄','鱼头','鱼骨','黄酒'])assert(!recovered('BV1rV411A7fE',term,true));
for(const bv of ['BV1ow411k7qt','BV1RN4y1r7dt','BV1rV411A7fE']){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(!e.sourceReview.crosspostMatched);assert(!e.sourceReview.officialCrosspostDescription);assert(e.evidence.filter(x=>x.source==='video_frame').every(x=>x.url==='https://www.bilibili.com/video/'+bv+'/'));const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('部分食材已核对'));assert(html.includes('原视频画面／字幕（抽查）'));assert(html.includes('不等于'));}
// Knife-technique review is read-only: keep original ingredient data and catalog classification.
assert.equal(dataset.recipes.BV1wa4y127TD.main.length,0);assert.deepEqual(get(dataset.recipes.BV1wa4y127TD.auxiliary),['葱','姜','蒜']);assert.equal(dataset.recipes.BV1wa4y127TD.status,'title_only');
const allRecipes=context.window.RECIPE_COLLECTION.recipes;
for(const cls of ['tutorial','ambiguous']){const rs=allRecipes.filter(r=>r.classification===cls),none=rs.filter(r=>{const e=index.get(r);return !e.main.length&&!e.auxiliary.length}),mainUnknown=rs.filter(r=>!index.get(r).main.length);assert.equal(none.length,dataset.stats.unknownByClassification[cls]);assert.equal(mainUnknown.length,dataset.stats.mainUnknownByClassification[cls]);}
const splitCounts={};
for(const cls of ['tutorial','ambiguous']){const rs=allRecipes.filter(r=>r.classification===cls),missing=rs.filter(r=>!index.get(r).main.length),empty=missing.filter(r=>!index.get(r).auxiliary.length),auxOnly=missing.filter(r=>index.get(r).auxiliary.length);splitCounts[cls]={mainMissing:missing.length,whollyEmpty:empty.length,auxiliaryOnly:auxOnly.length};assert.equal(missing.length,empty.length+auxOnly.length);assert.equal(auxOnly.length,dataset.stats.auxiliaryOnlyByClassification[cls]);}
assert.deepEqual(splitCounts.tutorial,{mainMissing:88,whollyEmpty:78,auxiliaryOnly:10});assert.deepEqual(splitCounts.ambiguous,{mainMissing:10,whollyEmpty:10,auxiliaryOnly:0});
assert.equal(dataset.stats.status.verified_partial,57);assert.equal(dataset.stats.status.title_only,800);
run("query='牛肉'");const beef=get(run('filteredRecipes()'));assert(beef.some(r=>/小炒黄牛肉/.test(r.dishName||r.title)),'Missing 小炒黄牛肉');assert(beef.some(r=>/番茄.*牛腩|西红柿.*牛腩/.test(r.dishName||r.title)),'Missing tomato beef');assert(beef.every(r=>index.match(r,'牛肉').matched));
run("query='牛腩'");assert(run('filteredRecipes().length')>0);assert(run('filteredRecipes().length')<beef.length);
run("query='番茄'");const tomato=get(run('filteredRecipes().map(r=>r.id)'));run("query='西红柿'");assert.deepEqual(get(run('filteredRecipes().map(r=>r.id)')),tomato);
run("query='牛肉 番茄'");const combo=get(run('filteredRecipes()'));assert(combo.length);assert(combo.every(r=>index.match(r,'牛肉 番茄').matched));
run("query='葱';includeAuxiliary=true");const withAux=get(run('filteredRecipes()'));assert(withAux.length);const ranks=withAux.map(r=>index.match(r,'葱',true).rank);assert(ranks.every((rank,i)=>!i||rank>=ranks[i-1]),'Main results must rank before auxiliary');assert(withAux.some(r=>index.match(r,'葱',true).rank===1));run('includeAuxiliary=false');assert(run('filteredRecipes().length')<withAux.length);
run("query='';detailFilter='ready'");assert.equal(run('filteredRecipes().length'),3);run("detailFilter='ambiguous'");assert.equal(run('filteredRecipes().length'),27);
run("detailFilter='all';activeCreator='老程本味'");assert.equal(run('filteredRecipes().length'),105);run("activeCreator='老饭骨'");assert.equal(run('filteredRecipes().length'),86);
run("activeCreator='all';searchMode='text';query='特厨做饭_'");assert.equal(run('filteredRecipes().length'),140);
run("searchMode='ingredient';query='不存在的食材'");assert.equal(run('filteredRecipes().length'),0);
run("query='牛肉';selected.method.add('炖')");const filtered=get(run('filteredRecipes()'));assert(filtered.every(r=>r.facets.method.includes('炖')&&index.match(r,'牛肉').matched));
const pool=get(run('randomPool()'));assert.equal(new Set(pool.map(r=>r.dishName||r.displayName||r.title)).size,pool.length);const random=get(run('sampleMenu(randomPool())'));assert(random.length<=12);assert(random.every(r=>filtered.some(x=>x.id===r.id)));assert(!random.some(r=>r.classification==='ambiguous'));
assert.equal(run("dailyRecipe(new Date('2026-11-09T09:00:00')).id"),run("dailyRecipe(new Date('2026-11-09T23:59:59')).id"));assert.notEqual(run("dailyRecipe(new Date('2026-11-09T23:59:59')).id"),run("dailyRecipe(new Date('2026-11-10T00:00:00')).id"));
console.log(JSON.stringify({passed:true,records:945,mainDirectory:918,beef:beef.length,tomato:tomato.length,beefAndTomato:combo.length,auxiliaryOnion:withAux.length,random:random.length,mainMissingSplit:splitCounts,tests:['preserve original catalog and notes','every ingredient record has source evidence','directional families and aliases','unknown species stay unknown','beef example dishes','multi-ingredient AND','main-first ranking','auxiliary opt-in','old text search','category merges','type and facet filters','scoped random menu','daily hero']},null,2));
