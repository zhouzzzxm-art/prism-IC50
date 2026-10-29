(function(root){
  'use strict';
  const DEFAULT={color:'#ff9b3d',shape:'square',fill:'hollow',font:'Arial',stroke:3.5,axisWidth:4,fontSize:27,markerSize:11,xTitle:'',yTitle:'Cell Viability (%)'};
  const allowedFonts=['Arial','Times New Roman','Helvetica'];
  function normalize(value={}){
    const s={...DEFAULT};if(!value||typeof value!=='object')return s;
    if(/^#[0-9a-f]{6}$/i.test(value.color||''))s.color=value.color.toLowerCase();
    for(const [key,values] of Object.entries({shape:['square','circle','triangle'],fill:['hollow','solid'],font:allowedFonts}))if(values.includes(value[key]))s[key]=value[key];
    for(const [key,min,max] of [['stroke',1,6],['axisWidth',1,6],['fontSize',16,34],['markerSize',5,20]]){const n=Number(value[key]);if(Number.isFinite(n))s[key]=Math.max(min,Math.min(max,n));}
    for(const key of ['xTitle','yTitle'])if(typeof value[key]==='string')s[key]=value[key].slice(0,100);
    return s;
  }
  function describe(text,base=DEFAULT){
    const s=normalize(base),changes=[];text=String(text).slice(0,2000);
    const set=(key,value)=>{s[key]=value;changes.push(key);};
    const hex=text.match(/#[0-9a-f]{6}\b/i);
    if(hex)set('color',hex[0]);else for(const [pattern,color] of [[/橙色|orange|オレンジ|주황/i,'#ff9b3d'],[/蓝色|blue|青色|파란/i,'#377eb8'],[/红色|red|赤色|빨간/i,'#e34848'],[/绿色|green|緑色|초록/i,'#2b8c60'],[/紫色|purple|紫|보라/i,'#8856a7'],[/黑色曲线|黑色线|black|黒色|검은색/i,'#222222']])if(pattern.test(text)){set('color',color);break;}
    if(/方块|方形|square|四角|사각형/i.test(text))set('shape','square');else if(/空心圆|实心圆|圆形|圆点|圆圈|circle|円形|원형/i.test(text))set('shape','circle');else if(/三角|triangle|삼각형/i.test(text))set('shape','triangle');
    if(/空心|hollow|白抜き|빈/i.test(text))set('fill','hollow');else if(/实心|solid|塗りつぶし|채움/i.test(text))set('fill','solid');
    if(/Times New Roman|新罗马/i.test(text))set('font','Times New Roman');else if(/Arial/i.test(text))set('font','Arial');else if(/Helvetica/i.test(text))set('font','Helvetica');
    for(const [key,pattern] of [['stroke',/(?:曲线线宽|线宽|線幅|선 너비)\s*[:：=]?\s*(\d+(?:\.\d+)?)/],['fontSize',/(?:字号|font\s*size|文字サイズ|글자 크기)\s*[:：=]?\s*(\d+(?:\.\d+)?)/i],['markerSize',/(?:点大小|符号大小|記号サイズ|기호 크기)\s*[:：=]?\s*(\d+(?:\.\d+)?)/]]){const match=text.match(pattern);if(match)set(key,Number(match[1]));}
    return {style:normalize(s),changes};
  }
  // A local palette heuristic, not image recognition or extraction of data.
  function dominantColor(pixels){
    const bins=new Map();
    for(let i=0;i<pixels.length;i+=4){
      const r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];
      if(a<160||Math.max(r,g,b)-Math.min(r,g,b)<45||Math.max(r,g,b)<70)continue;
      const key=[r>>4,g>>4,b>>4].join(',');const bucket=bins.get(key)||{n:0,r:0,g:0,b:0};bucket.n++;bucket.r+=r;bucket.g+=g;bucket.b+=b;bins.set(key,bucket);
    }
    const best=[...bins.values()].sort((a,b)=>b.n-a.n)[0];
    return best?'#'+[best.r,best.g,best.b].map(v=>Math.round(v/best.n).toString(16).padStart(2,'0')).join(''):null;
  }
  function readJSON(text){
    const obj=JSON.parse(text);if(obj.schema!=='ic50-reference-style/v1'||!obj.style)throw Error('请选择本工具导出的参考样式 JSON。');
    return normalize(obj.style);
  }
  function writeJSON(style){return JSON.stringify({schema:'ic50-reference-style/v1',style:normalize(style)},null,2);}
  const api={DEFAULT,normalize,describe,dominantColor,readJSON,writeJSON};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.IC50Reference=api;
})(typeof globalThis!=='undefined'?globalThis:this);
