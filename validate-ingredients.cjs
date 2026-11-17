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
// Fish slices are an explicit fish-family member, not a broad substring or a species guess.
assert(index.matchesName('鱼片（品种待核）','鱼'));
assert(index.matchesName('鱼片（品种待核）','鱼片'));
assert(!index.matchesName('鱼','鱼片'));
for(const name of ['鱼露','鱼子酱','鲍鱼','鱿鱼'])assert(!index.matchesName(name,'鱼'));
for(const q of ['鳜鱼','桂鱼','草鱼','鲤鱼'])assert(!index.matchesName('鱼片（品种待核）',q));
assert(index.matchesName('黑鱼（鱼片）','鱼'));assert(index.matchesName('黑鱼（鱼片）','鱼片'));assert(index.matchesName('黑鱼（鱼片）','黑鱼'));assert(!index.matchesName('鱼片（品种待核）','黑鱼'));assert(!index.matchesName('黑鱼（鱼片）','鳜鱼'));assert(index.matchesName('桂鱼','鱼'));assert(index.matchesName('桂鱼','鳜鱼'));
for(const bv of ['BV1GY411B7mE','BV1kh4y1R7s4','BV1hM4y1T7zE']){
 const entry=dataset.recipes[bv];const r={url:'https://www.bilibili.com/video/'+bv+'/'};
 assert(entry.main.includes(bv==='BV1GY411B7mE'?'黑鱼（鱼片）':'鱼片（品种待核）'));assert(index.match(r,'鱼').matched);assert(index.match(r,'鱼片').matched);
 assert(!index.match(r,'鳜鱼').matched);assert(!index.match(r,'桂鱼').matched);
 assert.equal(entry.recipeComplete,false);assert.equal(entry.sourceReview.fullVideo,false);
}
assert(!index.match({url:'https://www.bilibili.com/video/BV1kh4y1R7s4/'},'鱼 姜').matched);
assert(index.match({url:'https://www.bilibili.com/video/BV1kh4y1R7s4/'},'鱼 姜',true).matched);
assert.equal(dataset.recipes.BV1kh4y1R7s4.status,'title_only');
assert.equal(dataset.recipes.BV1hM4y1T7zE.status,'verified_partial');
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
assert.equal(Object.values(dataset.recipes).filter(e=>e.ingredientListCoverage==='source_list_transcribed').length,19);
for(const e of Object.values(dataset.recipes).filter(e=>e.ingredientListCoverage==='source_list_transcribed')){
  assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(index.statusLabel(e),'作者食材清单已收录');
  assert(e.ingredientListNote.includes('不等于'));assert(e.evidence.some(x=>['recipe_card','description','pinned_comment'].includes(x.source)));
  for(const name of e.sourceIngredientList?.indexedNames||[])assert([...e.main,...e.auxiliary].includes(name),'Author list name omitted: '+name);
}
assert.equal(dataset.stats.withAuxiliary,Object.values(dataset.recipes).filter(e=>e.auxiliary.length).length);
assert.equal(dataset.stats.authorIngredientListsTranscribed,19);
// Exact grabbed-fish original: partial ingredients, no unverified cross-post or recipe-card claim.
const grabbedFish=dataset.recipes.BV1GY411B7mE;
for(const term of ['黑鱼','鱼片','鱼'])assert(recovered('BV1GY411B7mE',term));
for(const term of ['水','酱油','醋','盐','姜','水淀粉','食用油']){assert(recovered('BV1GY411B7mE',term,true));assert(!recovered('BV1GY411B7mE',term));}
for(const term of ['草鱼','鳜鱼','桂鱼','乌鱼','葱','蒜','白糖','料酒','生抽','玉米淀粉'])assert(!recovered('BV1GY411B7mE',term,true));
assert.equal(grabbedFish.ingredientListCoverage,'partial_video_evidence');assert.equal(grabbedFish.status,'verified_partial');assert.equal(grabbedFish.main.length+grabbedFish.auxiliary.length,8);
assert(grabbedFish.evidence.some(x=>x.source==='video_frame'&&x.quote.includes('黑鱼肉质比较嫩')));
assert(grabbedFish.evidence.every(x=>x.url.includes('BV1GY411B7mE')));
assert(!grabbedFish.sourceIngredientList);assert(!grabbedFish.sourceReview.crosspostMatched);
assert.equal(grabbedFish.quantityObservations.filter(x=>x.name==='盐').length,2);
assert(grabbedFish.quantityObservations.some(x=>x.name==='盐'&&x.scope==='碗汁'&&x.amount==='2克'));
assert(grabbedFish.quantityObservations.some(x=>x.name==='盐'&&x.scope.includes('腌鱼')&&x.amount==='一小勺'));
const grabFishHTML=run("detailIngredients({url:'https://www.bilibili.com/video/BV1GY411B7mE/'})");assert(grabFishHTML.includes('黑鱼（鱼片）'));assert(grabFishHTML.includes('部分食材已核对'));assert(!grabFishHTML.includes('作者食材清单已收录'));
// Six historical description gaps now have sampled original-video evidence, not complete inventories.
const gapIds=['BV1M34y1D7hb','BV17g4y1f7bU','BV1ab4y1s7wk','BV1RC411p79s','BV1gr4y1n7uv','BV15P411V7YS'];
for(const bv of gapIds){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);assert(!e.notes.includes('仅据原视频标题'));assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(e.evidence.some(x=>x.source==='video_frame'));assert(e.ingredientListNote.includes('不等于'));}
assert(recovered('BV1M34y1D7hb','米饭 芹菜',true));assert(!recovered('BV1M34y1D7hb','芹菜'));
assert(recovered('BV17g4y1f7bU','排骨 话梅',true));assert(!recovered('BV17g4y1f7bU','话梅'));assert(!recovered('BV17g4y1f7bU','猪肉'));
assert(recovered('BV1ab4y1s7wk','鸡蛋 黄酒 淀粉',true));assert(!recovered('BV1ab4y1s7wk','咸蛋黄',true));assert(!recovered('BV1ab4y1s7wk','鱼',true));assert(!recovered('BV1ab4y1s7wk','蚝油',true));
assert(recovered('BV1RC411p79s','肠'));assert(recovered('BV1RC411p79s','肝 酒',true));assert(!recovered('BV1RC411p79s','猪肉'));
assert(recovered('BV1gr4y1n7uv','腰花 酱油',true));assert(!recovered('BV1gr4y1n7uv','猪肉'));assert(!recovered('BV1gr4y1n7uv','高汤',true));
assert(recovered('BV15P411V7YS','面粉'));assert(recovered('BV15P411V7YS','低筋面粉'));assert(recovered('BV15P411V7YS','面粉 红菜头汁',true));assert(!recovered('BV15P411V7YS','蜜枣',true));assert(!recovered('BV15P411V7YS','枣泥',true));
assert.equal(dataset.stats.withMain,862);assert.equal(dataset.stats.withAuxiliary,283);assert.equal(dataset.stats.status.unknown,73);assert.equal(dataset.stats.sampledVideoRecipes,52);assert.equal(dataset.limits.fullVideosWatched,0);assert.equal(dataset.limits.originalDescriptionsMissing,6);
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
// Original soup: actual solids differ from optional stock, unavailable tofu, and serving rice.
for(const term of ['冻豆腐','豆腐','肉丸子','猪蹄','猪板筋','腐竹','粉条','方便面'])assert(recovered('BV1Bw411m7Gg',term));
for(const term of ['西红柿','番茄','酸汤','水','食用油','姜','蒜','味精','盐','鸡汁','芹菜','葱','香菜','木姜子油']){assert(recovered('BV1Bw411m7Gg',term,true));assert(!recovered('BV1Bw411m7Gg',term));}
for(const term of ['米豆腐','鸡汤','米饭','牛肉','猪肉丸','红薯粉','花生油'])assert(!recovered('BV1Bw411m7Gg',term,true));
assert(dataset.recipes.BV1Bw411m7Gg.evidence.some(e=>e.quote.includes('一勺酸汤三勺水')));
assert(recovered('BV1Bw411m7Gg','冻豆腐 木姜子油',true));assert(!recovered('BV1Bw411m7Gg','冻豆腐 木姜子油'));
// Author brine card: nine foods, optional broth, duplicate source amounts, and missing units.
for(const term of ['鸡爪','鸡心','鸭头','鸭脖','鸡腿','鸭胗','莲藕','藕片','海带结','豆腐','炸豆腐'])assert(recovered('BV1jC4y1e7TK',term));
for(const term of ['朝天椒','辣椒','肉蔻','草蔻','白蔻','桂皮','甘草','砂仁','草果','白芷','陈皮','八角','丁香','小茴香','花椒','食用油','大葱','姜','洋葱','香菜','豆瓣酱','鸡汤','冰糖','盐','味精','酱油','麻椒','花雕酒']){assert(recovered('BV1jC4y1e7TK',term,true));assert(!recovered('BV1jC4y1e7TK',term));}
for(const term of ['牛肉','猪蹄','土豆','蒜','香叶','生抽','老抽','清水'])assert(!recovered('BV1jC4y1e7TK',term,true));
const brine=dataset.recipes.BV1jC4y1e7TK;assert.equal(brine.main.length,9);assert.equal(brine.auxiliary.length,27);assert(brine.auxiliary.includes('鸡汤（可不放）'));assert.equal(brine.sourceIngredientList.quantities.length,38);
assert.deepEqual(get(brine.sourceIngredientList.quantities.filter(x=>x.name==='丁香').map(x=>x.amount)),['15g','10g']);assert.deepEqual(get(brine.sourceIngredientList.quantities.filter(x=>x.name==='白芷').map(x=>x.amount)),['15g','20g']);assert.equal(brine.sourceIngredientList.quantities.find(x=>x.name==='花雕酒').amount,'50');
assert(brine.unresolved.some(x=>x.includes('不可据此自行求和')));assert(recovered('BV1jC4y1e7TK','鸭头 丁香',true));assert(!recovered('BV1jC4y1e7TK','鸭头 丁香'));
// Jellyfish author card plus explicit washing/blanching water, with cut/form retained.
assert(recovered('BV1Fa4y1z7kG','海蜇头'));for(const term of ['老抽','盐','胡椒粉','味精','醋','香油','料酒','食用油','葱','姜','蒜','红尖椒丝','红椒','辣椒','香菜杆','香菜','水']){assert(recovered('BV1Fa4y1z7kG',term,true));assert(!recovered('BV1Fa4y1z7kG',term));}
for(const term of ['白胡椒','生抽','白醋','淀粉'])assert(!recovered('BV1Fa4y1z7kG',term,true));
const jelly=dataset.recipes.BV1Fa4y1z7kG;assert.equal(jelly.sourceIngredientList.quantities.length,14);assert.equal(jelly.sourceIngredientList.quantities.find(x=>x.name==='老抽').amount,'20克');assert.equal(jelly.main.length+jelly.auxiliary.length,15);
for(const bv of ['BV1jC4y1e7TK','BV1Fa4y1z7kG']){const e=dataset.recipes[bv];assert.equal(e.ingredientListCoverage,'source_list_transcribed');const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('作者食材清单已收录'));assert(html.includes('不等于'));}
for(const bv of ['BV1Bw411m7Gg','BV1jC4y1e7TK','BV1Fa4y1z7kG']){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);assert(!e.sourceReview.crosspostMatched);}
// Original cold-dish cards: AND must not cross individual recipes.
const cold=dataset.recipes.BV1Gw4m197fR;assert.equal(cold.dishes.length,4);assert.equal(cold.searchScope,'same_dish');assert.equal(cold.ingredientAggregation,'coverage_only');
assert.deepEqual(get(cold.dishes.map(d=>d.name)),['浇汁松花蛋','拍黄瓜','捞汁秋葵','老醋花生米']);
assert.deepEqual(get(cold.dishes.map(d=>d.main.length+d.auxiliary.length)),[7,7,13,14]);
assert(cold.dishes.every(d=>d.evidence.length&&d.evidence.every(e=>e.source==='recipe_card'&&e.url.includes('BV1Gw4m197fR'))));
for(const term of ['松花蛋','皮蛋','黄瓜','秋葵','花生米'])assert(recovered('BV1Gw4m197fR',term));
for(const term of ['黄瓜 花生','松花蛋 黄瓜','黄瓜 姜','黄瓜 香叶','松花蛋 蒜','秋葵 香油'])for(const aux of [false,true])assert(!recovered('BV1Gw4m197fR',term,aux),'Cross-dish false positive: '+term);
for(const term of ['黄瓜 麻酱','秋葵 盐','花生 香叶','松花蛋 姜']){assert(recovered('BV1Gw4m197fR',term,true));assert(!recovered('BV1Gw4m197fR',term));}
assert.deepEqual(get(index.match({url:'https://www.bilibili.com/video/BV1Gw4m197fR/'},'黄瓜 麻酱',true).matchedDishNames),['拍黄瓜']);
assert(recovered('BV1Gw4m197fR','麻酱（纯，可选）',true));assert(recovered('BV13F4m1M7Y1','肉馅（肉种待核，制成丸子）'));assert.deepEqual(get(index.terms('麻酱（纯，可选） 黄瓜')),['麻酱','黄瓜']);assert(cold.dishes[1].auxiliary.includes('麻酱（纯，可选）'));assert(cold.dishes[3].notes.includes('冲突'));
assert(cold.dishes[3].sourceIngredientList.quantities.find(x=>x.name==='香叶').conflictingAmounts.length===2);
const coldHTML=run("detailIngredients({url:'https://www.bilibili.com/video/BV1Gw4m197fR/'})");assert(coldHTML.includes('视频中的菜品用料'));assert(coldHTML.includes('多食材搜索只匹配同一道菜'));for(const dish of cold.dishes)assert(coldHTML.includes(dish.name));
// Exact 05:32 reunion source, with actual ingredients and unconfirmed species kept unknown.
for(const term of ['火腿','胡萝卜','豆腐','干香菇','肉馅','白菜','鸡腿','莴笋','冬笋','粉丝'])assert(recovered('BV13F4m1M7Y1',term));
for(const term of ['鸡汤','葱','姜','味精','胡椒','鸡蛋','盐']){assert(recovered('BV13F4m1M7Y1',term,true));assert(!recovered('BV13F4m1M7Y1',term));}
for(const term of ['猪肉馅','牛肉','白胡椒','淀粉','玉米淀粉','蛋饺'])assert(!recovered('BV13F4m1M7Y1',term,true));
assert.equal(dataset.recipes.BV13F4m1M7Y1.main.length,10);assert.equal(dataset.recipes.BV13F4m1M7Y1.auxiliary.length,7);assert.equal(dataset.recipes.BV13F4m1M7Y1.ingredientListCoverage,'partial_video_evidence');
// Fish source card confirms tomato paste, not fresh tomato or an inferred fish species.
assert(recovered('BV1Kw411n74A','鱼'));assert(!recovered('BV1Kw411n74A','莴笋'));
for(const term of ['莴笋','淀粉','番茄酱','白醋','盐','白糖','水','葱','姜','花椒','蒜','食用油'])assert(recovered('BV1Kw411n74A',term,true));
for(const term of ['草鱼','鲤鱼','生抽','胡椒','鸡蛋','料酒','玉米淀粉'])assert(!recovered('BV1Kw411n74A',term,true));
assert(!recovered('BV1Kw411n74A','番茄'));assert(!dataset.recipes.BV1Kw411n74A.auxiliary.includes('番茄'));assert.equal(dataset.recipes.BV1Kw411n74A.main.length+dataset.recipes.BV1Kw411n74A.auxiliary.length,13);
for(const bv of ['BV1Kw411n74A','BV1Gw4m197fR'])assert.equal(dataset.recipes[bv].ingredientListCoverage,'source_list_transcribed');
for(const bv of ['BV1Kw411n74A','BV1Gw4m197fR','BV13F4m1M7Y1']){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);assert(!e.sourceReview.crosspostMatched);}
assert.equal(dataset.stats.groupedMultiDishVideos,3);assert.equal(dataset.stats.withMain,862);assert.equal(dataset.stats.withAuxiliary,283);

// Exact 2026-11-15 original clips: no generic substitutions or guessed stock.
for(const term of ['猪肚头','猪肚','鸡胗'])assert(recovered('BV1XT411i7RV',term));
for(const term of ['葱','姜','蒜','花椒','玉米淀粉','水淀粉','盐','胡椒粉','味精','香油','花椒油','料酒','食用油','水']){assert(recovered('BV1XT411i7RV',term,true));assert(!recovered('BV1XT411i7RV',term));}
for(const term of ['鸭胗','猪油','白胡椒','黑胡椒','白糖','酱油'])assert(!recovered('BV1XT411i7RV',term,true));
const crisp=dataset.recipes.BV1XT411i7RV;assert.equal(crisp.ingredientListCoverage,'source_list_transcribed');assert.equal(crisp.main.length+crisp.auxiliary.length,16);assert(crisp.unresolved.some(x=>x.includes('不是干玉米淀粉5g')));assert(crisp.sourceIngredientList.quantityAmbiguities[0].raw==='放入香油花椒油1g');
assert(recovered('BV1SD4y1P7TE','猪通脊'));assert(recovered('BV1SD4y1P7TE','猪肉'));assert(!recovered('BV1SD4y1P7TE','牛肉'));assert(!recovered('BV1SD4y1P7TE','猪里脊'));
for(const term of ['葱','姜','蒜','番茄酱','白糖','白醋','盐','淀粉','食用油','水']){assert(recovered('BV1SD4y1P7TE',term,true));assert(!recovered('BV1SD4y1P7TE',term));}
for(const term of ['玉米淀粉','生抽','鸡蛋','胡萝卜','香菜'])assert(!recovered('BV1SD4y1P7TE',term,true));
assert.equal(dataset.recipes.BV1SD4y1P7TE.sourceStepQuantities[0].quantity,'120g');assert.equal(dataset.recipes.BV1SD4y1P7TE.ingredientListCoverage,'partial_video_evidence');
assert(index.matchesName('猪通脊','猪肉'));assert(!index.matchesName('猪肉','猪通脊'));assert(!index.matchesName('通脊（品种待核）','猪肉'));
assert(recovered('BV1pb4y1u7y4','大虾 白菜'));for(const term of ['葱','姜','水','食用油','白糖']){assert(recovered('BV1pb4y1u7y4',term,true));assert(!recovered('BV1pb4y1u7y4',term));}
for(const term of ['盐','鸡汤','高汤','料酒','酱油','鸡精'])assert(!recovered('BV1pb4y1u7y4',term,true));
for(const bv of ['BV1XT411i7RV','BV1SD4y1P7TE','BV1pb4y1u7y4']){const e=dataset.recipes[bv];assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.status,'verified_partial');assert(e.evidence.some(x=>x.url.includes(bv)&&['recipe_card','video_frame'].includes(x.source)));const h=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(h.includes('不等于'));}

// Two exact 2026-11-15 originals: fish species and rice cake, not generic same-name recipes.
for(const term of ['鳜鱼','桂鱼','鱼'])assert(recovered('BV1XyAne5Emr',term));
assert(!recovered('BV1XyAne5Emr','三文鱼',true));
for(const term of ['葱','姜','蒜','食用油','黄酒','盐','沙姜粉']){assert(recovered('BV1XyAne5Emr',term,true));assert(!recovered('BV1XyAne5Emr',term));}
for(const term of ['淀粉','胡椒粉','糖','酱油','味精','花生油','普通姜粉'])assert(!recovered('BV1XyAne5Emr',term,true));
assert(recovered('BV1XyAne5Emr','桂鱼 沙姜粉',true));assert(!recovered('BV1XyAne5Emr','桂鱼 沙姜粉'));
assert.equal(dataset.recipes.BV1XyAne5Emr.main.length+dataset.recipes.BV1XyAne5Emr.auxiliary.length,8);
assert.equal(dataset.recipes.BV12b4y1D7wd.main.length+dataset.recipes.BV12b4y1D7wd.auxiliary.length,9);
for(const term of ['大米','醪糟'])assert(recovered('BV12b4y1D7wd',term));
assert(recovered('BV12b4y1D7wd','大米 醪糟'));
for(const term of ['水','酵母','泡打粉','白糖','葡萄干','柑橘片','白酒']){assert(recovered('BV12b4y1D7wd',term,true));assert(!recovered('BV12b4y1D7wd',term));}
for(const term of ['糯米','米饭','粘米粉','面粉','吉利丁','琼脂','牛奶','鸡蛋','黄酒','朗姆酒','蟹黄汁','红豆'])assert(!recovered('BV12b4y1D7wd',term,true));
assert(recovered('BV12b4y1D7wd','白酒（作者指示，可换其他酒）',true));
assert.equal(dataset.recipes.BV12b4y1D7wd.sourceStepQuantities.find(x=>x.name==='醪糟').quantity,'150克');
assert.equal(dataset.recipes.BV12b4y1D7wd.sourceStepQuantities.find(x=>x.name==='酵母').quantity,'10克');
for(const bv of ['BV1XyAne5Emr','BV12b4y1D7wd']){const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(e.evidence.some(x=>x.source==='video_frame'&&x.url.includes(bv)));const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('不等于'));assert(html.includes('部分食材已核对'));}

// Explicit shrimp-meat family: recover real catalog records, not shrimp paste or oil.
assert(index.matchesName('虾肉','虾'));assert(!index.matchesName('虾','虾肉'));
for(const x of ['虾酱','虾油','虾皮'])assert(!index.matchesName(x,'虾'));
assert(recovered('BV1ZY4y1H7DZ','虾'));assert(recovered('BV1ZY4y1H7DZ','虾肉'));
assert(recovered('BV1ZY4y1H7DZ','虾 橙子',true));assert(!recovered('BV1ZY4y1H7DZ','虾 橙子'));
assert.equal(dataset.recipes.BV1ZY4y1H7DZ.status,'title_only');

// Two exact Bao cards: never conflate broth names, soaking quantities or wet starch.
for(const term of ['茄子','土豆','柿子椒'])assert(recovered('BV1T1bk6CEdv',term));
for(const term of ['葱','姜','蒜','酱油','盐','胡椒粉','糖','水','水淀粉','老抽','食用油','香油']){assert(recovered('BV1T1bk6CEdv',term,true));assert(!recovered('BV1T1bk6CEdv',term));}
for(const term of ['生抽','蚝油','鸡精','猪油','玉米淀粉'])assert(!recovered('BV1T1bk6CEdv',term,true));
assert(recovered('BV1T1bk6CEdv','茄子 土豆'));assert(recovered('BV1T1bk6CEdv','土豆 香油',true));
const baoThree=dataset.recipes.BV1T1bk6CEdv;assert.equal(baoThree.main.length+baoThree.auxiliary.length,15);assert.equal(baoThree.sourceIngredientList.quantities.find(x=>x.name==='水淀粉').amount,'15g');assert(baoThree.unresolved.some(x=>x.includes('不是干淀粉')));
for(const term of ['面粉','西红柿','番茄','鸡蛋'])assert(recovered('BV1dyGw6PEy6',term));
for(const term of ['葱','酱油','盐','胡椒粉','猪油','水']){assert(recovered('BV1dyGw6PEy6',term,true));assert(!recovered('BV1dyGw6PEy6',term));}
for(const term of ['鸡汤','鸡肉','香菜','生抽','食用油','面条','淀粉'])assert(!recovered('BV1dyGw6PEy6',term,true));
const soupCard=dataset.recipes.BV1dyGw6PEy6;assert.equal(soupCard.main.length+soupCard.auxiliary.length,9);assert.equal(soupCard.sourceIngredientList.quantities.find(x=>x.name==='面粉').amount,'250g');assert.equal(soupCard.sourceIngredientList.quantities.find(x=>x.name==='葱').amount,'1个');
for(const bv of ['BV1T1bk6CEdv','BV1dyGw6PEy6']){const e=dataset.recipes[bv];assert.equal(e.ingredientListCoverage,'source_list_transcribed');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert(e.sourceReview.recipeCard);assert(e.evidence.some(x=>x.source==='recipe_card'&&x.url.includes(bv)));const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('作者食材清单已收录'));assert(html.includes('不等于'));}

// Banquet menu groups: preserve known same-dish pairing, never cross the table.
const banquet=dataset.recipes.BV1CQ4y1r75P;
assert.equal(banquet.searchScope,'same_dish');assert.equal(banquet.ingredientAggregation,'coverage_only');
assert.deepEqual(get(banquet.dishes.map(x=>x.name)),['全家福','茄辣牛肉','鲜果沙律虾球','饼叔炒油菜']);
assert.equal(banquet.dishes[0].main.length,0);assert.equal(banquet.dishes[0].auxiliary.length,0);
for(const q of ['牛肉 油菜','牛肉 虾肉','虾肉 油菜','牛肉 鲜果','油菜 鲜果'])for(const aux of [false,true])assert(!recovered('BV1CQ4y1r75P',q,aux),q);
for(const q of ['虾肉 鲜果','虾 鲜果']){assert(recovered('BV1CQ4y1r75P',q,true));assert(!recovered('BV1CQ4y1r75P',q));assert.deepEqual(get(index.match({url:'https://www.bilibili.com/video/BV1CQ4y1r75P/'},q,true).matchedDishNames),['鲜果沙律虾球']);}
assert.deepEqual(get(index.match({url:'https://www.bilibili.com/video/BV1CQ4y1r75P/'},'牛肉').matchedDishNames),['茄辣牛肉']);
assert.deepEqual(get(index.match({url:'https://www.bilibili.com/video/BV1CQ4y1r75P/'},'油菜').matchedDishNames),['饼叔炒油菜']);
for(const q of ['番茄','茄子','辣椒','苹果','菠萝','沙拉酱','海参','鸡汤'])assert(!recovered('BV1CQ4y1r75P',q,true));
assert.equal(banquet.recipeComplete,false);assert.equal(banquet.sourceReview.fullVideo,false);assert.equal(banquet.ingredientListCoverage,'partial_video_evidence');
const banquetHTML=run("detailIngredients({url:'https://www.bilibili.com/video/BV1CQ4y1r75P/'})");assert(banquetHTML.includes('多食材搜索只匹配同一道菜'));assert(banquetHTML.includes('食贫道'));assert(banquetHTML.includes('品种待核'));
for(const dish of banquet.dishes){assert(banquetHTML.includes(dish.name));assert(dish.evidence.every(x=>x.url.includes('BV1CQ4y1r75P')));}

// Exact soup / pork originals: partial observations, not general recipe assumptions.
for(const bv of ['BV1Ve4y1q7U3','BV1QP4y1m7BS','BV198411S7LW']){
 const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(!e.sourceIngredientList);assert(!e.sourceReview.crosspostMatched);
 assert(e.evidence.every(x=>x.url.includes(bv)));assert(e.evidence.some(x=>x.source==='video_frame'));
 const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('部分食材已核对'));assert(html.includes('不等于'));assert(!html.includes('作者食材清单已收录'));
}
for(const term of ['牛肉','红菜头','牛肉 红菜头'])assert(recovered('BV1Ve4y1q7U3',term));
for(const term of ['土豆','胡萝卜','洋葱','蒜','黄油','番茄调味酱（类型待核）']){assert(recovered('BV1Ve4y1q7U3',term,true));assert(!recovered('BV1Ve4y1q7U3',term));}
for(const term of ['牛腩','牛腱','白糖','糖','芹菜','包菜','奶油','番茄酱'])assert(!recovered('BV1Ve4y1q7U3',term,true));
assert.equal(dataset.recipes.BV1Ve4y1q7U3.main.length+dataset.recipes.BV1Ve4y1q7U3.auxiliary.length,8);
assert(![...dataset.recipes.BV1Ve4y1q7U3.main,...dataset.recipes.BV1Ve4y1q7U3.auxiliary].includes('番茄'));
assert(recovered('BV1Ve4y1q7U3','牛肉 黄油',true));assert(!recovered('BV1Ve4y1q7U3','牛肉 黄油'));
for(const term of ['虾','青口贝','鲍鱼'])assert(recovered('BV1QP4y1m7BS',term));
for(const term of ['黄油','南姜','香茅','番茄','冬阴功酱','柠檬叶','小米辣','鸡腿菇','鸡汁','白胡椒']){assert(recovered('BV1QP4y1m7BS',term,true));assert(!recovered('BV1QP4y1m7BS',term));}
for(const term of ['羊肉','鸡肉','鸡腿','杏鲍菇','白玉菇','草菇','鱼露','虾酱','椰浆','椰奶','牛奶','奶油','味精','盐','糖'])assert(!recovered('BV1QP4y1m7BS',term,true));
assert.equal(dataset.recipes.BV1QP4y1m7BS.main.length+dataset.recipes.BV1QP4y1m7BS.auxiliary.length,13);
assert(dataset.recipes.BV1QP4y1m7BS.evidence.some(x=>x.quote.includes('02:29')&&x.quote.includes('鸡腿菇我先搁进去')));
for(const q of ['虾 鸡腿菇','虾 蘑菇','虾 黄油','虾 南姜']){assert(recovered('BV1QP4y1m7BS',q,true));assert(!recovered('BV1QP4y1m7BS',q));}
assert(index.matchesName('鸡腿菇','蘑菇'));assert(index.matchesName('鸡腿菇','鸡腿菇'));assert(!index.matchesName('蘑菇','鸡腿菇'));
for(const q of ['鸡','鸡肉','鸡腿'])assert(!index.matchesName('鸡腿菇',q));
assert(recovered('BV198411S7LW','五花肉'));assert(recovered('BV198411S7LW','猪肉'));
for(const term of ['葱','姜','水','食用油','糖','酱油']){assert(recovered('BV198411S7LW',term,true));assert(!recovered('BV198411S7LW',term));}
for(const term of ['红枣','鸡蛋','冰糖','白糖','绵白糖','生抽','老抽','盐','料酒','八角','桂皮','猪油'])assert(!recovered('BV198411S7LW',term,true));
assert.equal(dataset.recipes.BV198411S7LW.main.length+dataset.recipes.BV198411S7LW.auxiliary.length,7);
for(const q of ['猪肉 糖','猪肉 姜','五花肉 酱油']){assert(recovered('BV198411S7LW',q,true));assert(!recovered('BV198411S7LW',q));}

// Explicit existing family members: no data/species inference and no reciprocal expansion.
for(const name of ['鳗鱼','小黄鱼','大黄鱼','老板鱼']){assert(index.matchesName(name,'鱼'));assert(!index.matchesName('鱼',name));assert(!index.matchesName('鱼片（品种待核）',name));}
for(const name of ['草菇','干香菇']){assert(index.matchesName(name,'蘑菇'));assert(!index.matchesName('蘑菇',name));}
assert(index.matchesName('鲶鱼','鱼'));assert(!index.matchesName('鳗鱼','鲶鱼'));assert(!index.matchesName('鲶鱼','鳗鱼'));
assert(!index.matchesName('鱼露','鱼'));assert(!index.matchesName('虾酱','虾'));
assert(!index.matchesName('排骨（品种待核）','猪肉'));assert(!index.matchesName('肉馅（肉种待核，制成丸子）','猪肉'));
for(const name of ['鸡','鸡肉','鸡腿'])assert(!index.matchesName('鸡腿菇',name));
for(const bv of ['BV1W5BzYnEa6','BV1vK411A7vQ','BV1hMpT68E7W','BV1x6ZHBmEW4'])assert(recovered(bv,'鱼'));
assert.deepEqual(get(dataset.recipes.BV1W5BzYnEa6.main),['鳗鱼']);assert(!recovered('BV1W5BzYnEa6','鲶鱼'));
for(const bv of ['BV1W5BzYnEa6','BV1hMpT68E7W','BV1x6ZHBmEW4','BV17hzmYvEpk'])assert.equal(dataset.recipes[bv].status,'title_only'); // 炸小黄鱼 now has sampled original evidence.
for(const q of ['鱼 番茄','鱼 西红柿'])assert(recovered('BV1x6ZHBmEW4',q));
for(const bv of ['BV17hzmYvEpk','BV13F4m1M7Y1']){assert(recovered(bv,'蘑菇'));assert(recovered(bv,'蘑菇 鸡肉'));}
assert(recovered('BV17hzmYvEpk','蘑菇 生菜',true));assert(!recovered('BV17hzmYvEpk','蘑菇 生菜'));
assert.equal(dataset.recipes.BV13F4m1M7Y1.ingredientListCoverage,'partial_video_evidence');

// Exact original eel/scallop sources: partial evidence, not complete recipes.
for(const bv of ['BV1EH4y1s7Zs','BV1dr4y1B7iA']){
 const e=dataset.recipes[bv];
 assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);assert.equal(e.sourceReview.fullVideo,false);
 assert.equal(e.sourceReview.videoFrames,true);assert(!e.sourceIngredientList);
 assert(e.ingredientListCoverage.startsWith('partial_'));
 assert(e.evidence.some(x=>x.source==='video_frame'&&x.url.includes(bv)));
 const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");
 assert(html.includes('部分食材已核对'));assert(html.includes('不等于'));
}
assert.deepEqual(get(dataset.recipes.BV1EH4y1s7Zs.main),['鳝鱼']);
for(const q of ['鳝鱼','鱼','鱼 鳝鱼'])assert(recovered('BV1EH4y1s7Zs',q));
for(const q of ['鳝鱼 笋','鱼 香菜']){assert(!recovered('BV1EH4y1s7Zs',q));assert(recovered('BV1EH4y1s7Zs',q,true));}
for(const q of ['鳗鱼','鲶鱼','草鱼','桂鱼','冬笋','春笋','鱼露','虾酱'])assert(!recovered('BV1EH4y1s7Zs',q,true));
assert.deepEqual(get(dataset.recipes.BV1dr4y1B7iA.main),['干贝','豆腐']);
for(const q of ['干贝 黄酒','干贝 葱','干贝 姜','干贝 盐','干贝 生粉']){assert(!recovered('BV1dr4y1B7iA',q));assert(recovered('BV1dr4y1B7iA',q,true));}
for(const q of ['鸡汤','鸡汁','鱼露','虾酱'])assert(!recovered('BV1dr4y1B7iA',q,true));
for(const name of ['鱼露','鱼子酱','鲍鱼','鱿鱼'])assert(!index.matchesName(name,'鱼'));
assert(index.matchesName('鳝鱼','鱼'));assert(!index.matchesName('鱼','鳝鱼'));

assert(recovered('BV1dr4y1B7iA','干贝 老抽',true));assert(!recovered('BV1dr4y1B7iA','干贝 老抽'));
assert(!recovered('BV1dr4y1B7iA','干贝 冰糖',true));assert(!dataset.recipes.BV1dr4y1B7iA.auxiliary.some(n=>n.includes('冰糖')));
assert(dataset.recipes.BV1dr4y1B7iA.evidence.some(e=>e.quote.includes('冰糖老抽')));
assert(dataset.recipes.BV1dr4y1B7iA.auxiliary.includes('玉米粉（生粉）'));
for(const bv of ['BV1EH4y1s7Zs','BV1dr4y1B7iA']){assert(!dataset.recipes[bv].sourceReview.crosspostMatched);assert(!dataset.recipes[bv].sourceReview.officialCrosspostDescription);}

// Exact salmon and tofu-sheet family members only, without conflating narrow ingredient names.
assert(index.matchesName('三文鱼','鱼'));assert(!index.matchesName('鱼','三文鱼'));
for(const name of ['鱼露','鱼子酱','鲍鱼','鱿鱼','三文鱼头'])assert(!index.matchesName(name,'鱼'));
for(const q of ['鳜鱼','桂鱼','鳝鱼','鲶鱼'])assert(!index.matchesName('三文鱼',q));
assert(index.matchesName('干豆腐','豆腐'));assert(!index.matchesName('豆腐','干豆腐'));
for(const q of ['豆腐干','豆干','豆皮','嫩豆腐'])assert(!index.matchesName('干豆腐',q));
for(const name of ['豆腐干','豆皮','腐乳'])assert(!index.matchesName(name,'豆腐'));
assert(index.matchesName('豆干','豆腐干'));assert(index.matchesName('嫩豆腐','豆腐'));
for(const bv of ['BV14i7nzcEiH','BV1YqJ8zMENR','BV1jM4m1y7f6','BV1yT42167se']){
 assert(recovered(bv,'鱼 三文鱼'));assert.equal(dataset.recipes[bv].status,'title_only');
 for(const q of ['鳜鱼','桂鱼','鱼露'])assert(!recovered(bv,q,true));
}
assert(recovered('BV1GctTeeEAV','豆腐 干豆腐 尖椒'));
for(const q of ['豆腐干','豆干','豆皮','嫩豆腐'])assert(!recovered('BV1GctTeeEAV',q,true));
for(const bv of ['BV1GctTeeEAV','BV1D54y1k7pZ','BV1bt4y1v7ig']){
 const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);
 assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);
 assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(!e.sourceIngredientList);
 assert(e.evidence.some(x=>x.source==='video_frame'&&x.url.includes(bv)));
 assert(!e.sourceReview.crosspostMatched);assert(!e.sourceReview.officialCrosspostDescription);
}
assert.deepEqual(get(dataset.recipes.BV1D54y1k7pZ.main),['海参','虾仁','肉馅（品种待核）','韭菜']);
for(const q of ['海参 虾','虾 韭菜','肉馅'])assert(recovered('BV1D54y1k7pZ',q));
for(const q of ['海参 姜','虾 黄酒','韭菜 香油']){assert(!recovered('BV1D54y1k7pZ',q));assert(recovered('BV1D54y1k7pZ',q,true));}
for(const q of ['猪肉','牛肉','羊肉','鸡肉','鸡蛋','面粉'])assert(!recovered('BV1D54y1k7pZ',q,true));
assert.deepEqual(get(dataset.recipes.BV1bt4y1v7ig.main),['鸡腿肉']);
assert(recovered('BV1bt4y1v7ig','鸡肉 鸡腿肉'));
for(const q of ['鸡肉 淀粉','鸡肉 鸡蛋','鸡肉 老抽','鸡肉 盐','鸡肉 胡椒粉','鸡肉 黄酒','鸡肉 香油','鸡肉 番茄酱','鸡肉 辣酱油','鸡肉 糖','鸡肉 食用油','鸡肉 洋葱']){assert(!recovered('BV1bt4y1v7ig',q));assert(recovered('BV1bt4y1v7ig',q,true));}
for(const q of ['鸡胸肉','冰糖','白糖','玉米淀粉','蒜'])assert(!recovered('BV1bt4y1v7ig',q,true));
assert(!dataset.recipes.BV1bt4y1v7ig.auxiliary.includes('葱')); // Existing textual 葱 query also finds 洋葱; not an asserted scallion ingredient.
assert(dataset.recipes.BV1bt4y1v7ig.evidence.some(e=>e.quote.includes('冰糖老抽')));
assert.equal(dataset.recipes.BV1bt4y1v7ig.main.length+dataset.recipes.BV1bt4y1v7ig.auxiliary.length,13);

// Two exact original beef videos: no other edition, pork aside, or vinegar Q&A ingredients.
for(const bv of ['BV1QR4y1t7Ku','BV1L5411e7AW']){
 const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);
 assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);
 assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(!e.sourceIngredientList);
 assert(e.evidence.some(x=>x.source==='video_frame'&&x.url.includes(bv)));
 assert(e.evidence.every(x=>x.url.includes(bv)));assert(!e.sourceReview.crosspostMatched);
 assert(!e.sourceReview.officialCrosspostDescription);
 const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");assert(html.includes('部分食材已核对'));assert(html.includes('不等于'));
}
const beefSauce=dataset.recipes.BV1L5411e7AW;
assert.deepEqual(get(beefSauce.main),['牛腩']);assert(recovered('BV1L5411e7AW','牛肉 牛腩'));
for(const q of ['香菇','甜面酱','豆瓣酱','蒜蓉辣酱','花生油','香油','葱','姜','黄酒','熟芝麻']){assert(!recovered('BV1L5411e7AW',q));assert(recovered('BV1L5411e7AW','牛肉 '+q,true));}
for(const q of ['五花肉','猪肉','醋','盐','糖','生抽','老抽','酱油'])assert(!recovered('BV1L5411e7AW',q,true));
assert.equal(beefSauce.main.length+beefSauce.auxiliary.length,11);
assert.deepEqual(get(beefSauce.quantityObservations.map(x=>[x.name,x.amount])),[['甜面酱','4勺'],['豆瓣酱','4勺'],['蒜蓉辣酱','4勺']]);
assert(beefSauce.quantityObservations.every(x=>x.scope.includes('勺容量未知')));
assert(beefSauce.notes.includes('香菇水'));assert(!beefSauce.auxiliary.includes('香菇水'));
assert.deepEqual(get(dataset.recipes.BV1Fp4y1k7Xw.main),['牛肉','面条']);assert.deepEqual(get(dataset.recipes.BV1Fp4y1k7Xw.auxiliary),[]);assert.equal(dataset.recipes.BV1Fp4y1k7Xw.status,'title_only');assert(!dataset.recipes.BV1Fp4y1k7Xw.sourceReview.videoFrames);
const braisedBeef=dataset.recipes.BV1QR4y1t7Ku;assert.deepEqual(get(braisedBeef.main),['牛肉']);
for(const q of ['陈皮','葱','姜','黄酒','食用油','水']){assert(!recovered('BV1QR4y1t7Ku',q));assert(recovered('BV1QR4y1t7Ku','牛肉 '+q,true));}
for(const q of ['牛腩','牛肋条','面条','醋','糖','盐','酱油','豆瓣酱','胡萝卜','八角','干辣椒'])assert(!recovered('BV1QR4y1t7Ku',q,true));
assert.equal(braisedBeef.main.length+braisedBeef.auxiliary.length,7);
assert(braisedBeef.evidence.some(e=>e.quote.includes('冷水下锅')));assert(braisedBeef.evidence.some(e=>e.quote.includes('焯了15分钟')));
assert(braisedBeef.notes.includes('2021-11-18'));assert.equal(braisedBeef.browserSourceReview.runtimeObserved,'10:51');

// Exact Shandong originals: ingredients are not inferred from dish names or unverified reposts.
for(const bv of ['BV1Hpun6nECx','BV1N6an6EEx8','BV1vK411A7vQ']){
 const e=dataset.recipes[bv]; assert.equal(e.status,'verified_partial'); assert.equal(e.recipeComplete,false);
 assert.equal(e.sourceReview.fullVideo,false); assert.equal(e.sourceReview.videoFrames,true);
 assert.equal(e.ingredientListCoverage,'partial_video_evidence'); assert(!e.sourceIngredientList);
 assert(e.evidence.some(x=>x.source==='video_frame'&&x.url.includes(bv)));
 assert(e.evidence.every(x=>x.url.includes(bv))); assert(!e.sourceReview.officialCrosspostDescription);
 const html=run("detailIngredients({url:'https://www.bilibili.com/video/"+bv+"/'})");
 assert(html.includes('部分食材已核对')); assert(html.includes('不等于')); assert(!html.includes('作者食材清单已收录'));
}
const lion=dataset.recipes.BV1Hpun6nECx;
assert(recovered('BV1Hpun6nECx','肉馅 海参'));
assert(!recovered('BV1Hpun6nECx','猪肉')); assert(!recovered('BV1Hpun6nECx','牛肉'));
for(const q of ['马蹄','荸荠','葱','姜','黄酱','鸡蛋','玉米淀粉','面粉']){
 assert(!recovered('BV1Hpun6nECx',q)); assert(recovered('BV1Hpun6nECx','肉馅 '+q,true));
}
assert.equal(lion.browserSourceReview.runtimeObserved,'09:53');
const scallop=dataset.recipes.BV1N6an6EEx8;
assert.deepEqual(get(scallop.main),['扇贝肉']);
for(const q of ['扇贝','扇贝肉'])assert(recovered('BV1N6an6EEx8',q));
for(const q of ['鸡蛋清','猪油','牛奶','水淀粉','葱姜水','大葱']){
 assert(!recovered('BV1N6an6EEx8',q)); assert(recovered('BV1N6an6EEx8','扇贝 '+q,true));
}
for(const q of ['鱼','鱼茸','猪肉','鸡肉','鸡汤','绿豆粉','干贝'])assert(!recovered('BV1N6an6EEx8',q,true));
assert.equal(scallop.main.length+scallop.auxiliary.length,7);
assert.deepEqual(get(scallop.quantityObservations.map(x=>[x.name,x.amount])),[['扇贝肉','600克'],['鸡蛋清','1个'],['牛奶','100克'],['葱姜水','约300克']]);
assert(!scallop.quantityObservations.some(x=>x.amount==='150克'));assert(scallop.notes.includes('建议选项'));
const smallFish=dataset.recipes.BV1vK411A7vQ;
assert.deepEqual(get(smallFish.main),['小黄鱼']); assert(recovered('BV1vK411A7vQ','鱼 小黄鱼'));
assert(!recovered('BV1vK411A7vQ','味精')); assert(recovered('BV1vK411A7vQ','小黄鱼 味精',true));
assert(!recovered('BV1vK411A7vQ','大黄鱼')); assert(!recovered('BV1vK411A7vQ','鳜鱼'));assert(!recovered('BV1vK411A7vQ','鱼露',true));

assert.equal(lion.main.length+lion.auxiliary.length,9);assert.deepEqual(get(lion.quantityRelations[0].items),['玉米淀粉','面粉']);assert.equal(lion.quantityRelations[0].ratio,'8:2');assert.equal(lion.quantityRelations[0].absoluteAmounts,null);
assert.equal(smallFish.main.length+smallFish.auxiliary.length,8);
for(const q of ['花椒','味精','葱','鸡蛋','面粉','淀粉','水']){assert(!recovered('BV1vK411A7vQ',q));assert(recovered('BV1vK411A7vQ','小黄鱼 '+q,true));}
for(const q of ['盐','姜','料酒','玉米淀粉','食用油'])assert(!recovered('BV1vK411A7vQ',q,true));
assert.deepEqual(get(smallFish.quantityRelations[0].items),['面粉','淀粉']);assert.equal(smallFish.quantityRelations[0].ratio,'2:1');assert.equal(smallFish.quantityRelations[0].absoluteAmounts,null);assert(smallFish.notes.includes('不声称截图已显示倒水'));

// A standalone 鸡 query must not be satisfied by egg ingredients.
for(const name of ['鸡蛋','鸡蛋清','鸡蛋液','鸡蛋黄','鸡蛋白','鸡子','鸡蛋（可选）']){
 assert(!index.matchesName(name,'鸡'));
 assert(index.matchesName(name,'鸡蛋'));
}
for(const name of ['鸡','鸡肉','鸡腿肉','鸡爪','鸡翅','鸡胸肉','老母鸡（含鸡头、鸡爪）'])assert(index.matchesName(name,'鸡'));
for(const term of ['鸡','鸡肉','鸡腿'])assert(!index.matchesName('鸡腿菇',term));
assert(index.matchesName('鸡腿菇','鸡腿菇'));assert(index.matchesName('鸡腿菇','蘑菇'));
assert(!recovered('BV1Z6gczgEA1','鸡'));assert(recovered('BV1Z6gczgEA1','鸡蛋'));
assert(!recovered('BV1N6an6EEx8','扇贝 鸡',true));assert(recovered('BV1N6an6EEx8','扇贝 鸡蛋',true));
assert(!recovered('BV1Hpun6nECx','海参 鸡',true));assert(recovered('BV1Hpun6nECx','海参 鸡蛋',true));
for(const bv of ['BV13F4m1M7Y1','BV1bt4y1v7ig','BV1Zt4y1e7z5']){
 assert(recovered(bv,'鸡'));assert(recovered(bv,'鸡 鸡蛋',true));
}
for(const aux of [false,true]){
 const rows=context.window.RECIPE_COLLECTION.recipes.filter(r=>r.classification==='tutorial'&&index.match(r,'鸡',aux).matched);
 assert.equal(rows.length,aux?92:87);
 for(const r of rows){const m=index.match(r,'鸡',aux);assert(![...m.main,...m.auxiliary].some(x=>/^鸡蛋/.test(x)));}
}
// AND must find actual chicken and egg within one component, never across dishes.
dataset.recipes.chickenEggOne={main:['鸡腿肉'],auxiliary:['鸡蛋'],evidence:[]};
dataset.recipes.chickenEggSplit={main:['鸡腿肉','鸡蛋'],auxiliary:[],evidence:[],dishes:[{name:'蒸蛋',main:['鸡蛋'],auxiliary:[]},{name:'鸡肉菜',main:['鸡腿肉'],auxiliary:[]}]};
assert(!index.match({id:'chickenEggOne'},'鸡 鸡蛋').matched);
assert(index.match({id:'chickenEggOne'},'鸡 鸡蛋',true).matched);
assert(!index.match({id:'chickenEggSplit'},'鸡 鸡蛋',true).matched);
assert.deepEqual(get(index.match({id:'chickenEggSplit'},'鸡',true).matchedDishNames),['鸡肉菜']);
assert.deepEqual(get(index.match({id:'chickenEggSplit'},'鸡蛋',true).matchedDishNames),['蒸蛋']);
delete dataset.recipes.chickenEggOne;delete dataset.recipes.chickenEggSplit;

// Exact Foshou and Henan steamed-vegetable originals, source-limited and variant-aware.
for(const bv of ['BV1XU4y1F7xa','BV1nb421e7tJ']){
 const e=dataset.recipes[bv];assert.equal(e.status,'verified_partial');assert.equal(e.recipeComplete,false);
 assert.equal(e.sourceReview.fullVideo,false);assert.equal(e.sourceReview.videoFrames,true);
 assert.equal(e.ingredientListCoverage,'partial_video_evidence');assert(!e.sourceIngredientList);
 assert(!e.sourceReview.crosspostMatched);assert(!e.sourceReview.officialCrosspostDescription);
 assert(e.evidence.every(x=>x.url.includes(bv)));assert.equal(e.quantityObservations.length,0);
}
const foshou=dataset.recipes.BV1XU4y1F7xa;
assert.deepEqual(get(foshou.main),['鸡蛋','肉馅（品种待核）']);assert.equal(foshou.main.length+foshou.auxiliary.length,12);
assert(recovered('BV1XU4y1F7xa','鸡蛋 肉馅'));
for(const q of ['马蹄','荸荠','葱','姜','味精','盐','玉米淀粉','水淀粉','面粉','水','食用油']){assert(recovered('BV1XU4y1F7xa',q,true));assert(!recovered('BV1XU4y1F7xa',q));}
for(const q of ['鸡','鸡肉','猪肉','牛肉','黄酒','料酒','面包糠','豆腐皮'])assert(!recovered('BV1XU4y1F7xa',q,true));
assert(foshou.unresolved.some(x=>x.includes('08:39')&&x.includes('11:47')));
const steamed=dataset.recipes.BV1nb421e7tJ;
assert.equal(steamed.searchScope,'same_dish');assert.equal(steamed.ingredientAggregation,'coverage_only');
assert.equal(steamed.dishes.length,2);assert.equal(steamed.main.length+steamed.auxiliary.length,10);
assert.deepEqual(get(steamed.dishes[0].main),['白萝卜','胡萝卜']);assert.deepEqual(get(steamed.dishes[0].auxiliary),['面粉','蒜汁']);
assert.deepEqual(get(steamed.dishes[1].main),['白萝卜','胡萝卜','蒿菜（嫩叶）']);
assert(!steamed.dishes[1].auxiliary.includes('蒜汁'));
for(const q of ['白萝卜 胡萝卜','白萝卜 蒿菜','胡萝卜 蒿菜'])assert(recovered('BV1nb421e7tJ',q));
for(const q of ['白萝卜 胡萝卜 面粉','白萝卜 蒜汁','蒿菜 干辣椒','蒿菜 味精','胡萝卜 食用油']){assert(recovered('BV1nb421e7tJ',q,true));assert(!recovered('BV1nb421e7tJ',q));}
for(const q of ['蒿菜 蒜汁','蒜汁 干辣椒','蒜汁 盐','蒜汁 食用油','蒜汁 味精'])for(const aux of [false,true])assert(!recovered('BV1nb421e7tJ',q,aux),q);
for(const q of ['茼蒿','菠菜','醋','酱油','鸡蛋'])assert(!recovered('BV1nb421e7tJ',q,true));
assert.deepEqual(get(index.match({url:'https://www.bilibili.com/video/BV1nb421e7tJ/'},'蒜汁',true).matchedDishNames),['河南蒸菜（蒜汁拌法）']);
assert.deepEqual(get(index.match({url:'https://www.bilibili.com/video/BV1nb421e7tJ/'},'蒿菜 干辣椒',true).matchedDishNames),['河南蒸菜（蒜末干辣椒炒法）']);
const steamedHTML=run("detailIngredients({url:'https://www.bilibili.com/video/BV1nb421e7tJ/'})");
assert(steamedHTML.includes('多食材搜索只匹配同一道菜'));assert(steamedHTML.includes('编辑'));assert(steamedHTML.includes('部分食材已核对'));
for(const dish of steamed.dishes){assert(steamedHTML.includes(dish.name));assert(dish.evidence.every(x=>x.url.includes('BV1nb421e7tJ')));}
assert.equal(dataset.stats.groupedMultiDishVideos,3);

const allRecipes=context.window.RECIPE_COLLECTION.recipes;
for(const cls of ['tutorial','ambiguous']){const rs=allRecipes.filter(r=>r.classification===cls),none=rs.filter(r=>{const e=index.get(r);return !e.main.length&&!e.auxiliary.length}),mainUnknown=rs.filter(r=>!index.get(r).main.length);assert.equal(none.length,dataset.stats.unknownByClassification[cls]);assert.equal(mainUnknown.length,dataset.stats.mainUnknownByClassification[cls]);}
const splitCounts={};
for(const cls of ['tutorial','ambiguous']){const rs=allRecipes.filter(r=>r.classification===cls),missing=rs.filter(r=>!index.get(r).main.length),empty=missing.filter(r=>!index.get(r).auxiliary.length),auxOnly=missing.filter(r=>index.get(r).auxiliary.length);splitCounts[cls]={mainMissing:missing.length,whollyEmpty:empty.length,auxiliaryOnly:auxOnly.length};assert.equal(missing.length,empty.length+auxOnly.length);assert.equal(auxOnly.length,dataset.stats.auxiliaryOnlyByClassification[cls]);}
assert.deepEqual(splitCounts.tutorial,{mainMissing:73,whollyEmpty:63,auxiliaryOnly:10});assert.deepEqual(splitCounts.ambiguous,{mainMissing:10,whollyEmpty:10,auxiliaryOnly:0});
assert.equal(dataset.stats.status.verified_partial,85);assert.equal(dataset.stats.status.title_only,787);
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
run("query='虾';searchMode='ingredient';detailFilter='all';activeCreator='all';selected.method.clear()");const shrimp=get(run('filteredRecipes()'));assert.equal(shrimp.length,53);assert(shrimp.some(r=>r.url.includes('BV1ZY4y1H7DZ')));
run("query='鱼';includeAuxiliary=false");const fish=get(run('filteredRecipes()'));assert.equal(fish.length,96);
for(const bv of ['BV1GY411B7mE','BV1kh4y1R7s4','BV1hM4y1T7zE'])assert(fish.some(r=>r.url.includes(bv)));
run("query='鱼片'");const fishSlices=get(run('filteredRecipes()'));assert.equal(fishSlices.length,3);
run("query='鳜鱼'");const mandarinFish=get(run('filteredRecipes().map(r=>r.id)'));run("query='桂鱼'");assert.deepEqual(get(run('filteredRecipes().map(r=>r.id)')),mandarinFish);assert.equal(mandarinFish.length,7);
run("query='鱼 姜'");assert.equal(run('filteredRecipes().length'),0);run("includeAuxiliary=true");const fishGinger=get(run('filteredRecipes()'));assert(fishGinger.some(r=>r.url.includes('BV1kh4y1R7s4')));assert(fishGinger.every(r=>index.match(r,'鱼 姜',true).rank===1));
run("query='猪肉';includeAuxiliary=false");const pork=get(run('filteredRecipes()'));assert.equal(pork.length,30);assert(pork.some(r=>r.url.includes('BV198411S7LW')));assert.equal(beef.length,84);
run("query='鱼 番茄';includeAuxiliary=false");const fishTomato=get(run('filteredRecipes()'));assert.equal(fishTomato.length,1);assert(fishTomato[0].url.includes('BV1x6ZHBmEW4'));
run("query='蘑菇'");const mushrooms=get(run('filteredRecipes()'));assert.equal(mushrooms.length,8);
run("query='蘑菇 鸡肉'");const mushroomsChicken=get(run('filteredRecipes()'));assert.equal(mushroomsChicken.length,3);
run("query='蘑菇 生菜'");assert.equal(run('filteredRecipes().length'),0);run("includeAuxiliary=true");const mushroomsLettuce=get(run('filteredRecipes()'));assert.equal(mushroomsLettuce.length,1);assert(mushroomsLettuce[0].url.includes('BV17hzmYvEpk'));
run("query='鱼 大黄鱼';includeAuxiliary=false");assert.equal(run('filteredRecipes().length'),0);run("detailFilter='ambiguous'");const pendingYellow=get(run('filteredRecipes()'));assert.equal(pendingYellow.length,1);assert(pendingYellow[0].url.includes('BV1hMpT68E7W'));assert.equal(pendingYellow[0].classification,'ambiguous');
run("query='鱼';detailFilter='all'");assert.equal(run('filteredRecipes().length'),96);
run("query='鳝鱼';includeAuxiliary=false");const eels=get(run('filteredRecipes()'));assert.equal(eels.length,5);assert(eels.some(r=>r.url.includes('BV1EH4y1s7Zs')));
run("query='鱼 鳝鱼'");const fishEels=get(run('filteredRecipes()'));assert.equal(fishEels.length,4);
run("query='干贝 冰糖';includeAuxiliary=true");assert.equal(run('filteredRecipes().length'),0);
run("query='干贝 老抽'");const scallopsSoy=get(run('filteredRecipes()'));assert.equal(scallopsSoy.length,1);assert(scallopsSoy[0].url.includes('BV1dr4y1B7iA'));
console.log(JSON.stringify({passed:true,eels:eels.length,fishEels:fishEels.length,scallopsSoyAux:scallopsSoy.length,mushrooms:mushrooms.length,mushroomsChicken:mushroomsChicken.length,mushroomsLettuceAux:mushroomsLettuce.length,fishTomato:fishTomato.length,pendingYellow:pendingYellow.length,pork:pork.length,soupPorkOriginals:3,fish:fish.length,fishSlices:fishSlices.length,fishAndGingerAuxiliary:fishGinger.length,shrimp:shrimp.length,records:945,mainDirectory:918,beef:beef.length,tomato:tomato.length,beefAndTomato:combo.length,auxiliaryOnion:withAux.length,random:random.length,mainMissingSplit:splitCounts,tests:['preserve original catalog and notes','every ingredient record has source evidence','directional families and aliases','unknown species stay unknown','beef example dishes','multi-ingredient AND','main-first ranking','auxiliary opt-in','old text search','category merges','type and facet filters','scoped random menu','daily hero']},null,2));
