(function(root){
  'use strict';
  const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.IC50Engine;
  const Ref=typeof module!=='undefined'&&module.exports?require('./reference.js'):root.IC50Reference;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const fmt=n=>!Number.isFinite(n)?'—':Math.abs(n)>=1e5||(Math.abs(n)>0&&Math.abs(n)<0.001)?n.toExponential(1):Number(n.toPrecision(4)).toString();
  function niceStep(range,count=5){const raw=range/count,p=Math.pow(10,Math.floor(Math.log10(raw))),a=raw/p;return(a<=1?1:a<=2?2:a<=5?5:10)*p;}
  function chart(data,r,axis='log',unit='µg/mL',residual=false) {
    const W=940,H=residual?250:426,L=74,R=32,T=25,B=66,PW=W-L-R,PH=H-T-B;
    const visible=data.filter(d=>axis!=='log'||d.x>0);
    if(!visible.length)return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="待输入剂量–反应数据"><rect width="${W}" height="${H}" fill="#fff"/><path d="M${L},${T}V${H-B}H${W-R}" fill="none" stroke="#bacac6"/><text x="${W/2}" y="${H/2}" fill="#78908a" text-anchor="middle" font-size="16" font-family="sans-serif">输入真实数据，或载入软件测试示例</text><text x="${W/2}" y="${H-15}" fill="#78908a" text-anchor="middle" font-size="13" font-family="sans-serif">浓度 (${esc(unit)})</text></svg>`;
    const xs=visible.map(d=>d.x), xmin=axis==='log'?Math.log10(Math.min(...xs)):0, xmax=axis==='log'?Math.log10(Math.max(...xs)):Math.max(...xs);
    const dx=Math.max(xmax-xmin,axis==='log'?0.5:Math.max(xmax,1)),pad=axis==='log'?dx*0.035:dx*0.025;
    const xlo=axis==='log'?xmin-pad:0,xhi=xmax+pad;
    const px=x=>L+((axis==='log'?Math.log10(x):x)-xlo)/(xhi-xlo)*PW;
    const ys=visible.map(d=>residual&&r?d.y-E.predict(d.x,r):d.y);
    if(r&&!residual){ys.push(r.top,r.bottom);}
    let ymin,ymax;
    if(residual){const m=Math.max(1,...ys.map(Math.abs))*1.2;ymin=-m;ymax=m;}
    else {ymin=Math.min(0,...ys);ymax=Math.max(100,...ys);const p=(ymax-ymin)*0.075;ymin-=p;ymax+=p;}
    const py=y=>T+(ymax-y)/(ymax-ymin)*PH;
    const xticks=[];
    if(axis==='log'){
      const stride=Math.max(1,Math.ceil((xhi-xlo)/6));
      for(let e=Math.ceil(xlo);e<=xhi;e+=stride)xticks.push(10**e);
      if(!xticks.length)xticks.push(Math.min(...xs),Math.max(...xs));
    }else{const step=niceStep(xhi);for(let x=0;x<=xhi;x+=step)xticks.push(x);}
    const ystep=niceStep(ymax-ymin,residual?3:5),yticks=[];for(let y=Math.ceil(ymin/ystep)*ystep;y<=ymax;y+=ystep)yticks.push(y);
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${residual?'拟合残差图':'剂量–反应散点与拟合曲线'}，${axis==='log'?'log10':'线性'}浓度横轴"><rect width="${W}" height="${H}" fill="#ffffff"/><defs><clipPath id="${residual?'res':'fit'}Clip"><rect x="${L}" y="${T}" width="${PW}" height="${PH}"/></clipPath></defs><g font-family="Arial, sans-serif" font-size="12" fill="#6c807b">`;
    for(const y of yticks)svg+=`<line x1="${L}" y1="${py(y)}" x2="${W-R}" y2="${py(y)}" stroke="#e9efec"/><text x="${L-13}" y="${py(y)+4}" text-anchor="end">${fmt(y)}</text>`;
    for(const x of xticks)svg+=`<line x1="${px(x)}" y1="${T}" x2="${px(x)}" y2="${H-B}" stroke="#eef2ef"/><text x="${px(x)}" y="${H-B+24}" text-anchor="middle">${fmt(x)}</text>`;
    svg+=`<path d="M${L},${T}V${H-B}H${W-R}" fill="none" stroke="#adbfba"/><text x="${L+PW/2}" y="${H-12}" text-anchor="middle" font-size="13">浓度 (${esc(unit)})${axis==='log'?' · log10 刻度':''}</text><text transform="translate(19 ${T+PH/2}) rotate(-90)" text-anchor="middle" font-size="13">${residual?'残差 (百分点)':'细胞存活率 (%)'}</text></g>`;
    if(residual)svg+=`<line x1="${L}" y1="${py(0)}" x2="${W-R}" y2="${py(0)}" stroke="#58726a" stroke-dasharray="5 5"/>`;
    else if(r){
      if(r.ic50>0&&(axis!=='log'||r.ic50>0)&&px(r.ic50)>=L&&px(r.ic50)<=W-R){
        svg+=`<path d="M${L},${py(r.midpoint)}H${px(r.ic50)}V${H-B}" fill="none" stroke="#ba8d41" stroke-dasharray="5 5"/><text x="${Math.min(W-R-90,Math.max(L+8,px(r.ic50)+10))}" y="${Math.max(T+20,py(r.midpoint)-12)}" font-family="sans-serif" font-size="12" fill="#946f2d">IC50 · ${fmt(r.ic50)}</text>`;
      }
      const from=Math.min(...xs),to=Math.max(...xs),coords=[];
      for(let i=0;i<=280;i++){const x=axis==='log'?10**(Math.log10(from)+i/280*(Math.log10(to)-Math.log10(from))):from+i/280*(to-from);coords.push(`${i?'L':'M'}${px(x).toFixed(3)},${py(E.predict(x,r)).toFixed(3)}`);}
      svg+=`<path data-role="fit-curve" d="${coords.join(' ')}" fill="none" stroke="#246b55" stroke-width="3" stroke-linejoin="round" clip-path="url(#fitClip)"/>`;
    }
    for(let i=0;i<visible.length;i++){
      const d=visible[i],y=ys[i],color=residual?(y>=0?'#4d7d70':'#c29158'):'#fcfffd';
      svg+=`<circle data-role="observation" cx="${px(d.x).toFixed(3)}" cy="${py(y).toFixed(3)}" r="${residual?4:4.6}" fill="${color}" stroke="#246b55" stroke-width="${residual?0.5:1.8}" tabindex="0"><title>浓度 ${esc(fmt(d.x))} ${esc(unit)}；${residual?'残差':'存活率'} ${fmt(y)}${residual?' 百分点':'%'}${!residual&&r?'；拟合 '+fmt(E.predict(d.x,r))+'%':''}</title></circle>`;
    }
    return svg+'</svg>';
  }
  function summarize(data){
    const groups=new Map();
    for(const d of data){if(!groups.has(d.x))groups.set(d.x,[]);groups.get(d.x).push(d.y);}
    return [...groups].sort((a,b)=>a[0]-b[0]).map(([x,ys])=>{
      const mean=ys.reduce((a,b)=>a+b,0)/ys.length;
      return {x,y:mean,n:ys.length,sd:ys.length>1?Math.sqrt(ys.reduce((s,y)=>s+(y-mean)**2,0)/(ys.length-1)):null};
    });
  }
  function prismChart(data,r,axis='log',unit='µg/mL',options={}){
    const summary=options.points!=='raw',logValues=options.ticks!=='raw';
    const points=(summary?summarize(data):data.map(d=>({...d,n:1,sd:null}))).filter(d=>axis!=='log'||d.x>0);
    if(!points.length)return chart([],null,axis,unit);
    const style=Ref.normalize(options.style);
    const L=160,R=735,T=30,F=415,W=850,H=600,color=style.color;
    const xs=points.map(p=>p.x),small=Math.min(...xs),large=Math.max(...xs);
    let xmin=axis==='log'?Math.floor(Math.log10(small)):0,xmax=axis==='log'?Math.ceil(Math.log10(large)):large*1.05;
    if(xmax<=xmin)xmax=xmin+1;
    const xx=x=>L+((axis==='log'?Math.log10(x):x)-xmin)/(xmax-xmin)*(R-L);
    const ys=points.flatMap(p=>[p.y-(p.sd||0),p.y+(p.sd||0)]);
    const ymin=Math.min(0,Math.floor(Math.min(...ys)/30)*30),ymax=Math.max(120,Math.ceil(Math.max(...ys)/30)*30);
    const yy=y=>F-(y-ymin)/(ymax-ymin)*(F-T);
    const ystep=(ymax-ymin)<=150?30:niceStep(ymax-ymin,4),xstep=axis==='log'?Math.max(1,Math.ceil((xmax-xmin)/6)):niceStep(xmax-xmin,4);
    const model=r?E.MODELS[r.model].name:'not fitted';
    const zeros=data.filter(d=>d.x===0);
    const description={model,axis,logTickLabels:logValues?'log10(concentration/unit)':'original concentration',points:summary?'mean ± sample SD of actual observations':'individual observations',allObservationsFitted:!!r,
      zeroDose:axis==='log'?`${zeros.length} zero-dose observations retained for fit; omitted from log plot`:'shown on linear axis',
      source:options.sample?'software test fixture; not experimental data':'user input',parameters:r?{IC50:r.ic50,Top:r.top,Bottom:r.bottom,HillSlope:r.hill}:null,
      warnings:r?r.warnings.map(w=>w.text):[],style,observations:data};
    const g=(id,label,body)=>`<g id="${id}" inkscape:groupmode="layer" inkscape:label="${label}">${body}</g>`;
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="850" height="600" viewBox="0 0 ${W} ${H}" role="img" aria-label="Prism style editable dose response plot" font-family="${esc(style.font)}, sans-serif"><title>IC50 dose–response plot</title><desc>${esc(JSON.stringify(description))}</desc><metadata id="ic50-reference-style">${esc(Ref.writeJSON(style))}</metadata>`;
    svg+=g('background','Background','<rect width="850" height="600" fill="white"/>');
    svg+=g('axes','Axes',`<path d="M${L},${T}V${F}H${R}" fill="none" stroke="black" stroke-width="${style.axisWidth}"/>`);
    let ticks='',labels='';
    for(let y=Math.ceil(ymin/ystep)*ystep;y<=ymax;y+=ystep){ticks+=`<path d="M${L-13},${yy(y)}H${L}" stroke="black" stroke-width="${style.axisWidth}"/>`;labels+=`<text x="${L-19}" y="${yy(y)+9}" text-anchor="end" font-size="${style.fontSize}">${fmt(y)}</text>`;}
    for(let x=xmin;x<=xmax+1e-10;x+=xstep){const px=L+(x-xmin)/(xmax-xmin)*(R-L);ticks+=`<path d="M${px},${F}v17" stroke="black" stroke-width="${style.axisWidth}"/>`;labels+=`<text x="${px}" y="${F+46}" text-anchor="middle" font-size="${style.fontSize}">${axis==='log'?(logValues?fmt(x):fmt(10**x)):fmt(x)}</text>`;}
    svg+=g('tick-marks','Tick marks',ticks)+g('tick-labels','Editable tick labels',labels);
    const xTitle=axis==='log'?(logValues?'Log Concentration':'Concentration'):'Concentration';
    svg+=g('axis-titles','Editable axis titles',`<text x="${(L+R)/2}" y="502" text-anchor="middle" font-size="${style.fontSize}">${esc(style.xTitle||xTitle+' ('+unit+')')}</text><text transform="translate(80 ${(T+F)/2}) rotate(-90)" text-anchor="middle" font-size="${style.fontSize}">${esc(style.yTitle)}</text>`);
    if(r){
      const coords=[];for(let i=0;i<=400;i++){const x=axis==='log'?10**(Math.log10(small)+(Math.log10(large)-Math.log10(small))*i/400):small+(large-small)*i/400;coords.push(`${i?'L':'M'}${xx(x).toFixed(3)},${yy(E.predict(x,r)).toFixed(3)}`);}
      svg+=g('fitted-curve','4PL fitted curve',`<path data-role="fit-curve" d="${coords.join(' ')}" fill="none" stroke="${color}" stroke-width="${style.stroke}" stroke-linejoin="round"/>`);
    }
    let bars='',symbols='';
    for(let i=0;i<points.length;i++){
      const p=points[i],x=xx(p.x),y=yy(p.y);
      if(p.sd!==null){const top=yy(p.y+p.sd),bottom=yy(p.y-p.sd);bars+=`<path id="sd-${i}" data-role="error-bar" d="M${x},${top}V${bottom}M${x-6},${top}H${x+6}M${x-6},${bottom}H${x+6}" fill="none" stroke="${color}" stroke-width="${style.stroke}"><title>n=${p.n}; sample SD=${fmt(p.sd)}</title></path>`;}
      const half=style.markerSize/2,fill=style.fill==='solid'?color:'white';
      const title=`<title>Concentration=${esc(fmt(p.x))} ${esc(unit)}; ${summary?'mean':'value'}=${fmt(p.y)}%; n=${p.n}${p.sd!==null?'; SD='+fmt(p.sd):'; no error bar'}</title>`;
      const attr=`id="point-${i}" data-role="observation" fill="${fill}" stroke="${color}" stroke-width="${style.stroke}"`;
      if(style.shape==='circle')symbols+=`<circle ${attr} cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${half}">${title}</circle>`;
      else if(style.shape==='triangle')symbols+=`<path ${attr} d="M${x},${y-half}L${x+half},${y+half}L${x-half},${y+half}Z">${title}</path>`;
      else symbols+=`<rect ${attr} x="${(x-half).toFixed(3)}" y="${(y-half).toFixed(3)}" width="${style.markerSize}" height="${style.markerSize}">${title}</rect>`;
    }
    svg+=g('error-bars','Actual replicate SD',bars)+g('data-points','Editable '+style.fill+' '+style.shape+' points',symbols);
    if(r)svg+=g('ic50-label','Editable IC50 annotation',`<text x="230" y="326" font-size="${style.fontSize}">IC50=${fmt(r.ic50)} ${esc(unit)}</text>`);
    let notes='';if(options.sample)notes+='<text x="160" y="548" font-size="12" fill="#777">Software test example — not experimental data</text>';
    if(axis==='log'&&zeros.length)notes+=`<text x="160" y="568" font-size="12" fill="#777">${zeros.length} zero-dose observation(s) retained for fit; not shown on log axis.</text>`;
    svg+=g('figure-notes','Data provenance and zero-dose notes',notes);
    return svg+'</svg>';
  }
  const api={chart,prismChart,summarize,fmt,esc};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.IC50Plot=api;
})(typeof globalThis!=='undefined'?globalThis:this);
