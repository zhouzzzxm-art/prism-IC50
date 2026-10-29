/* Deterministic, unweighted nonlinear least squares. No data synthesis. */
(function(root) {
  'use strict';
  const SAMPLE = '浓度,存活率\n0,100\n1,99\n3,97\n10,92\n30,79\n100,55\n300,32\n1000,18\n3000,13';
  const MODELS = {
    free: {name:'4PL · 可变斜率', p:4, prism:'[Inhibitor] vs. response — Variable slope'},
    fixed: {name:'固定 HillSlope = −1', p:3, prism:'[Inhibitor] vs. response'},
    normalized: {name:'固定 Top = 100 / Bottom = 0', p:2, prism:'[Inhibitor] vs. normalized response — Variable slope'}
  };
  function parseData(text) {
    const data=[], errors=[];
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
    let observations=0;
    for(let i=0;i<lines.length;i++) {
      const line=lines[i].trim(); if(!line) continue;
      const parts=line.split(/[\t,，;；\s]+/).filter(Boolean);
      const header=/^(浓度|濃度|농도|concentration|dose|x)\b/i.test(parts[0]) || /^(浓度|濃度|농도)/.test(parts[0]);
      if(observations===0 && data.length===0 && header) continue;
      observations++;
      if(parts.length<2) { errors.push(`第 ${i+1} 行需要浓度和至少一个存活率。`); continue; }
      if(parts.some(s=>!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?%?$/.test(s))) {
        errors.push(`第 ${i+1} 行包含非数值或缺失值；请填写数字，不能用 NA、空格或符号补值。`); continue;
      }
      if(parts[0].endsWith('%')) { errors.push(`第 ${i+1} 行浓度不能带 %。`); continue; }
      // Delimited blank fields must never silently disappear.
      if(/[,，;；\t]/.test(line) && line.split(/[,，;；\t]/).some(s=>!s.trim())) {
        errors.push(`第 ${i+1} 行有空单元格；请删除空列或补充真实测量值。`); continue;
      }
      const x=Number(parts[0]), ys=parts.slice(1).map(s=>Number(s.replace(/%$/,'')));
      if(!Number.isFinite(x)||ys.some(y=>!Number.isFinite(y))) {errors.push(`第 ${i+1} 行数值超出可计算范围。`);continue;}
      if(x<0) { errors.push(`第 ${i+1} 行浓度为负：这里需要原始浓度，不能输入 log10 值。`); continue; }
      ys.forEach(y=>data.push({x,y,line:i+1}));
    }
    if(data.length>5000) errors.push('最多支持 5,000 个观测值，请缩小数据集。');
    return {data,errors};
  }
  function fraction(x,lnIC,h) {
    if(x===0) return 1;
    const z=h*(Math.log(x)-lnIC);
    if(z>40) return Math.exp(-z);
    if(z< -40) return 1-Math.exp(z);
    return 1/(1+Math.exp(z));
  }
  function predict(x,result) {
    return result.bottom+(result.top-result.bottom)*fraction(x,Math.log(result.ic50),-result.hill);
  }
  function solveLinear(data,fs,model) {
    if(model==='normalized') {
      let sse=0; for(let i=0;i<data.length;i++) sse+=(data[i].y-100*fs[i])**2;
      return {top:100,bottom:0,sse};
    }
    const n=data.length, mf=fs.reduce((a,b)=>a+b,0)/n, my=data.reduce((a,d)=>a+d.y,0)/n;
    let vf=0,cov=0; for(let i=0;i<n;i++){vf+=(fs[i]-mf)**2;cov+=(fs[i]-mf)*(data[i].y-my);}
    if(vf<1e-20) return {sse:Infinity};
    const gap=cov/vf; if(!(gap>0)) return {sse:Infinity};
    const bottom=my-gap*mf,top=bottom+gap;
    let sse=0;for(let i=0;i<n;i++)sse+=(data[i].y-bottom-gap*fs[i])**2;
    return {top,bottom,sse};
  }
  // Bounded Nelder–Mead over log(IC50), log(|HillSlope|), with plateaus
  // solved exactly by linear least squares at each nonlinear step.
  function simplex(fn,start,bounds) {
    const dim=start.length;
    const clamp=a=>a.map((v,j)=>Math.max(bounds[j][0],Math.min(bounds[j][1],v)));
    const evalAt=a=>{const q=clamp(a);return {q,value:fn(q).sse};};
    let vertices=[evalAt(start)];
    for(let j=0;j<dim;j++){const p=start.slice();p[j]+=0.35;vertices.push(evalAt(p));}
    let converged=false,iteration=0;
    for(;iteration<600;iteration++) {
      vertices.sort((a,b)=>a.value-b.value);
      const best=vertices[0],worst=vertices[dim];
      const distance=Math.max(...vertices.map(v=>Math.max(...v.q.map((x,j)=>Math.abs(x-best.q[j])))));
      if(distance<2e-8 && Number.isFinite(best.value)){converged=true;break;}
      const center=Array(dim).fill(0);
      for(let i=0;i<dim;i++)for(let j=0;j<dim;j++)center[j]+=vertices[i].q[j]/dim;
      const reflected=evalAt(center.map((c,j)=>2*c-worst.q[j]));
      if(reflected.value<best.value){
        const expanded=evalAt(center.map((c,j)=>c+2*(reflected.q[j]-c)));
        vertices[dim]=expanded.value<reflected.value?expanded:reflected;
      } else if(reflected.value<vertices[dim-1].value) vertices[dim]=reflected;
      else {
        const outside=reflected.value<worst.value;
        const contracted=evalAt(center.map((c,j)=>c+0.5*((outside?reflected.q[j]:worst.q[j])-c)));
        if(contracted.value<(outside?reflected.value:worst.value)) vertices[dim]=contracted;
        else vertices=vertices.map((v,i)=>i===0?v:evalAt(v.q.map((x,j)=>best.q[j]+0.5*(x-best.q[j]))));
      }
    }
    vertices.sort((a,b)=>a.value-b.value);
    return {...vertices[0],converged,iteration};
  }
  function condition(data,r,model) {
    const p=MODELS[model].p, cols=Array.from({length:p},()=>[]);
    for(const d of data) {
      const f=fraction(d.x,Math.log(r.ic50),-r.hill),gap=r.top-r.bottom;
      const lnRatio=d.x===0?0:Math.log(d.x/r.ic50);
      const row=model==='normalized'?[gap*(-r.hill)*f*(1-f),-gap*f*(1-f)*lnRatio*(-r.hill)]
        :model==='fixed'?[f,1-f,gap*f*(1-f)]
        :[f,1-f,gap*(-r.hill)*f*(1-f),-gap*f*(1-f)*lnRatio*(-r.hill)];
      row.forEach((v,j)=>cols[j].push(v));
    }
    const norm=cols.map(c=>Math.sqrt(c.reduce((a,b)=>a+b*b,0)));
    if(norm.some(v=>v<1e-12))return Infinity;
    const gram=cols.map((a,j)=>cols.map((b,k)=>a.reduce((s,v,i)=>s+v*b[i],0)/(norm[j]*norm[k])));
    const aug=gram.map((row,j)=>[...row,...Array.from({length:p},(_,k)=>j===k?1:0)]);
    for(let j=0;j<p;j++){
      let pivot=j;for(let i=j+1;i<p;i++)if(Math.abs(aug[i][j])>Math.abs(aug[pivot][j]))pivot=i;
      [aug[j],aug[pivot]]=[aug[pivot],aug[j]];
      if(Math.abs(aug[j][j])<1e-12)return Infinity;
      const v=aug[j][j];aug[j]=aug[j].map(x=>x/v);
      for(let i=0;i<p;i++)if(i!==j){const a=aug[i][j];aug[i]=aug[i].map((x,k)=>x-a*aug[j][k]);}
    }
    return Math.max(...gram.map(r=>r.reduce((s,v)=>s+Math.abs(v),0)))*Math.max(...aug.map(r=>r.slice(p).reduce((s,v)=>s+Math.abs(v),0)));
  }
  function fit(data,model='free') {
    if(!MODELS[model])throw Error('未知模型。');
    const p=MODELS[model].p;
    if(data.some(d=>!Number.isFinite(d.x)||!Number.isFinite(d.y)||d.x<0))throw Error('数据必须为非负浓度及有限存活率。');
    const groups=Array.from(new Set(data.map(d=>d.x))).sort((a,b)=>a-b);
    if(data.length<=p||groups.length<p+1)throw Error(`${MODELS[model].name} 至少需要 ${p+1} 个不同浓度，且观测数必须大于自由参数数 ${p}。`);
    const positive=groups.filter(x=>x>0);
    if(positive.length<2)throw Error('至少需要两个不同的正浓度。');
    const allY=data.map(d=>d.y),range=Math.max(...allY)-Math.min(...allY);
    if(range<1e-6)throw Error('存活率几乎不变，无法识别下降曲线或 IC50。');
    const means=groups.map(x=>{const vals=data.filter(d=>d.x===x);return vals.reduce((a,d)=>a+d.y,0)/vals.length;});
    const part=Math.max(1,Math.floor(groups.length/3));
    const low=means.slice(0,part).reduce((a,b)=>a+b,0)/part, high=means.slice(-part).reduce((a,b)=>a+b,0)/part;
    if(high-low>range*0.05)throw Error('总体响应随浓度上升；当前工具仅拟合下降型抑制曲线，请在 Prism 检查刺激型 EC50 或其他模型。');
    const min=positive[0],max=positive.at(-1),logMin=Math.log(min),logMax=Math.log(max);
    const bounds=[[logMin-6*Math.LN10,logMax+6*Math.LN10],[-6.9,Math.log(50)]];
    const fn=q=>{const h=model==='fixed'?1:Math.exp(q[1]);const lin=solveLinear(data,data.map(d=>fraction(d.x,q[0],h)),model);return {...lin,lnIC:q[0],h};};
    const starts=[];
    for(const t of [0.15,0.4,0.65,0.85])for(const h of (model==='fixed'?[1]:[0.4,1,2,4]))starts.push([logMin+t*(logMax-logMin),Math.log(h)].slice(0,model==='fixed'?1:2));
    let best;
    for(const start of starts){const candidate=simplex(fn,start,bounds);if(!best||candidate.value<best.value)best=candidate;}
    const raw=fn(best.q);
    if(!Number.isFinite(raw.sse)||!Number.isFinite(Math.exp(raw.lnIC)))throw Error('未找到可计算的下降曲线；请检查浓度范围、存活率变化和模型。');
    const mean=allY.reduce((a,b)=>a+b,0)/allY.length,sst=allY.reduce((s,y)=>s+(y-mean)**2,0);
    const r={top:raw.top,bottom:raw.bottom,ic50:Math.exp(raw.lnIC),hill:-raw.h,logIC50:raw.lnIC/Math.LN10,
      sse:raw.sse,r2:1-raw.sse/sst,rmse:Math.sqrt(raw.sse/data.length),n:data.length,k:p,df:data.length-p,model,
      converged:best.converged,min,max,zeroCount:data.filter(d=>d.x===0).length,warnings:[]};
    r.condition=condition(data,r,model);
    r.outside=r.ic50<min||r.ic50>max;
    r.boundary=best.q.some((v,j)=>Math.min(v-bounds[j][0],bounds[j][1]-v)<1e-4);
    const warn=(code,text,level='warning')=>r.warnings.push({code,text,level});
    if(!r.converged)warn('convergence','优化未充分收敛；不要将当前 IC50 作为确定结果。','danger');
    if(r.boundary)warn('boundary','参数到达数值搜索边界（IC50 为正浓度区间外扩 6 个数量级；|HillSlope| 约 0.001–50）。当前数值可能不稳定。','danger');
    if(r.condition>1e8)warn('identifiability','参数之间高度相关，平台或 IC50 难以独立识别；即使 R² 很高也不能确认结果。','danger');
    if(r.outside)warn('extrapolation','IC50 在已测正浓度范围之外，是区间外推；应补测覆盖中点的真实浓度。','danger');
    const fmin=fraction(min,raw.lnIC,raw.h),fmax=fraction(max,raw.lnIC,raw.h);
    if((fmin<0.9&&r.zeroCount===0)||fmax>0.1)warn('plateaus','数据未充分覆盖上、下平台；自由 Top / Bottom 的估计依赖外推。建议用真实数据扩展浓度范围。');
    const transitional=positive.filter(x=>{const f=fraction(x,raw.lnIC,raw.h);return f>0.1&&f<0.9;}).length;
    if(model!=='fixed'&&transitional<3)warn('slope','中间响应区只有 '+transitional+' 个不同正浓度，可变斜率支持不足；有依据时可比较固定 −1 斜率模型。');
    if(r.df<=1)warn('few','残差自由度仅 '+r.df+'；参数数值可算出，但对拟合可靠性的判断很有限。');
    if(model!=='normalized'&&(r.top>110||r.bottom< -10))warn('endpoints','拟合平台超出常见存活率范围；数值未裁剪，请检查归一化、平台覆盖及模型。');
    if(data.some(d=>d.y<0||d.y>100))warn('response','存在低于 0% 或高于 100% 的输入值；已保留原值，请核对空白扣除与归一化。');
    if(model==='normalized')warn('normalized','已强制 Top=100、Bottom=0。仅当真实对照准确界定两个平台时适用；数据写成百分比并不自动满足这一条件。','info');
    let rises=0;for(let i=1;i<means.length;i++)if(means[i]-means[i-1]>Math.max(5,range*0.12))rises++;
    if(rises)warn('nonmonotone','存在明显局部上升；请检查残差。双相、钟形或明显不对称响应可能不适合单一对称 4PL。');
    if(r.r2<0.8)warn('poor','R² 较低；当前下降模型对数据的描述有限，请检查散点与残差。');
    r.midpoint=(r.top+r.bottom)/2;
    r.absolute50=(50>r.bottom&&50<r.top)?r.ic50*Math.pow((r.top-50)/(50-r.bottom),1/(-r.hill)):null;
    return r;
  }
  const api={SAMPLE,MODELS,parseData,fit,predict,fraction};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.IC50Engine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
