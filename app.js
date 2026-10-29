(function(){
  'use strict';
  const L=window.IC50I18n||{refresh(){},init(){},t:s=>s,svg:s=>s};
  const E=window.IC50Engine,P=window.IC50Plot,$=id=>document.getElementById(id);
  let axis='log',data=[],result=null,errors=[],sample=false,busy=false,timer;
  let referenceStyle=window.IC50Reference.normalize();
  const model=()=>document.querySelector('input[name="model"]:checked').value;
  const unit=()=>$('unit').value;
  const prism=()=>['prism','reference'].includes($('plot-style').value);
  const figureOptions=()=>({ticks:$('log-labels').value,points:$('point-display').value==='raw'?'raw':'summary',sample,style:$('plot-style').value==='reference'?referenceStyle:undefined});
  const figure=()=>prism()?P.prismChart(data,result,axis,unit(),figureOptions()):P.chart(data,result,axis,unit());
  const num=n=>P.fmt(n);
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;L.refresh();clearTimeout(timer);timer=setTimeout(()=>{$('toast').hidden=true;},4200);}
  function validate(){
    const parsed=E.parseData($('data').value);data=parsed.data;errors=parsed.errors;
    $('data-count').textContent=data.length?`${new Set(data.map(d=>d.x)).size} 个浓度 · ${data.length} 个观测`:'等待输入';
    let html=errors.slice(0,3).map(s=>`<div class="input-error">${P.esc(s)}</div>`).join('');
    if(errors.length>3)html+=`<div class="input-error">另有 ${errors.length-3} 个问题，请检查其余行。</div>`;
    if(!errors.length&&data.length&&Math.max(...data.map(d=>d.y))<=1&&Math.min(...data.map(d=>d.y))>=0)html+='<div class="input-tip">存活率均在 0–1 之间。若这些值是比例，请自行乘 100 后粘贴；本工具不会自动换算。</div>';
    $('input-messages').innerHTML=html;
    $('sample-tag').hidden=!sample;
  }
  function resetResults(){
    result=null;
    for(const id of ['ic50','top','bottom','hill'])$(id).textContent='—';
    $('ic50-desc').textContent='Top 与 Bottom 中点对应的浓度';
    $('top-desc').textContent='低浓度端的拟合响应';$('bottom-desc').textContent='高浓度端的拟合响应';$('hill-desc').textContent='下降曲线为负；绝对值越大越陡';
    $('fit-meta').innerHTML='<span>R² <b>—</b></span><span>RMSE <b>—</b></span><span>观测数 <b>—</b></span><span>残差自由度 <b>—</b></span>';
    $('fit-status').textContent=data.length?'数据已输入 · 等待拟合':'参数尚未计算';$('fit-status').className='';
    $('curve-badge').textContent=data.length?'仅显示输入值':'等待拟合';
    $('interpretation').innerHTML='<p>IC50 对应 Top 与 Bottom 的中点。仅当 Top=100、Bottom=0 时，该点存活率为 50%。</p>';
    $('diagnostics').innerHTML='';$('export-results').disabled=true;$('export-svg').disabled=true;
  }
  function redraw(){
    $('linear').classList.toggle('selected',axis==='linear');$('log').classList.toggle('selected',axis==='log');
    $('linear').setAttribute('aria-pressed',String(axis==='linear'));$('log').setAttribute('aria-pressed',String(axis==='log'));
    $('axis-note').textContent=axis==='log'?(prism()&&$('log-labels').value!=='raw'?'横轴显示 log10(C/所选单位)（0、1、2…）；输入区仍填原始浓度，不要重复取 log。':'log10 轴按浓度的倍数间隔排布，刻度仍标原始浓度；改变刻度不会改变拟合。'):'线性轴按浓度差值排布，0 浓度可直接显示；改变刻度不会改变拟合。';
    const current=errors.length?[]:data;
    $('log-labels').disabled=axis!=='log'||!prism();$('point-display').disabled=!prism();
    $('chart').innerHTML=prism()?P.prismChart(current,result,axis,unit(),figureOptions()):P.chart(current,result,axis,unit());
    const groups=P.summarize(current),singletons=groups.filter(g=>g.n<2).length;
    $('figure-help').textContent=prism()?($('point-display').value==='raw'?'显示每个输入观测；不显示误差棒。':'符号 = 同浓度实际观测均值，误差棒 = 样本 SD（n−1）。'+(singletons?`${singletons} 个浓度只有单个观测，未生成误差棒。`:'未输入复孔时，不生成误差棒。'))+' 拟合仍使用全部原始观测。'+(axis==='log'&&$('log-labels').value!=='raw'?'当前刻度为 log10(C/所选单位)，输入区仍填原始浓度。':''):'散点为全部输入观测；绿色曲线为模型预测，虚线为半最大响应。';
    $('chart-legend').innerHTML=prism()?'<span>'+({circle:'○',triangle:'△',square:'□'}[figureOptions().style?.shape||'square'])+' '+($('point-display').value==='raw'?'输入观测':'复孔均值')+'</span><span>— 拟合曲线</span><span>'+($('point-display').value==='raw'?'无误差棒':'误差棒 = SD（n≥2）')+'</span>':'<span>○ 输入观测</span><span>— 模型预测曲线</span><span>- - 半最大响应</span>';
    const zeros=current.filter(d=>d.x===0);
    $('zero-note').hidden=!(zeros.length&&axis==='log');
    if(zeros.length&&axis==='log')$('zero-note').innerHTML='<strong>0 浓度无法取 log10。</strong> '+(result?'已用 Y(0)=Top 纳入拟合，':'拟合时将用 Y(0)=Top 保留，')+'未放在 log 横轴上，也未替换为小数。0 浓度存活率：'+zeros.slice(0,12).map(d=>num(d.y)+'%').join('、')+(zeros.length>12?` … 共 ${zeros.length} 个`:'')+'。';
    const show=$('show-residual').checked&&!!result;
    $('residual-wrap').hidden=!show;
    if(show)$('residual-chart').innerHTML=P.chart(current,result,axis,unit(),true);
    updateExportOptions();
  }
  function renderResult(){
    const r=result;
    $('ic50').innerHTML=num(r.ic50)+`<small>${P.esc(unit())}</small>`;
    $('top').innerHTML=num(r.top)+'<small>%</small>';$('bottom').innerHTML=num(r.bottom)+'<small>%</small>';$('hill').textContent=num(r.hill);
    $('ic50-desc').textContent='log10(IC50) = '+num(r.logIC50)+(r.outside?' · 区间外推':'');
    $('top-desc').textContent=r.model==='normalized'?'固定为 100%，未自由估计':'上平台 · 自由拟合估计';
    $('bottom-desc').textContent=r.model==='normalized'?'固定为 0%，未自由估计':'下平台 · 自由拟合估计';
    $('hill-desc').textContent=r.model==='fixed'?'固定为 −1，未自由估计':'自由拟合 · 绝对值越大，曲线越陡';
    $('fit-meta').innerHTML=`<span>R² <b>${num(r.r2)}</b></span><span>RMSE <b>${num(r.rmse)} 百分点</b></span><span>观测数 <b>${r.n}</b></span><span>残差自由度 <b>${r.df}</b></span>`;
    const danger=r.warnings.some(w=>w.level==='danger'),warn=r.warnings.some(w=>w.level==='warning');
    $('fit-status').textContent=danger?'拟合完成，有重要限制':warn?'拟合完成，有提示':'拟合已收敛';
    $('fit-status').className=danger?'danger':warn?'warn':'';
    $('curve-badge').textContent=E.MODELS[r.model].name;
    $('interpretation').innerHTML=`<p>半最大响应：<b>${num(r.midpoint)}%</b>；<b>IC50 = ${num(r.ic50)} ${P.esc(unit())}</b>。`+(r.absolute50!==null?`存活率为 50% 的预测浓度：${num(r.absolute50)} ${P.esc(unit())}${r.absolute50<r.min||r.absolute50>r.max?'（超出已测正浓度范围）':''}。`:'50% 不在拟合平台之间，无有限的 50% 响应浓度。')+`<br>正浓度范围：${num(r.min)}–${num(r.max)} ${P.esc(unit())}。未计算置信区间；R² 不用于验证模型是否正确。</p>`;
    $('diagnostics').innerHTML=r.warnings.map(w=>`<div class="diagnostic ${w.level}"><span aria-hidden="true">${w.level==='danger'?'!':w.level==='info'?'i':'△'}</span><div>${P.esc(w.text)}</div></div>`).join('');
    $('export-results').disabled=false;$('export-svg').disabled=false;redraw();
  }
  function runFit(){
    if(busy)return;
    validate();resetResults();redraw();
    if(errors.length){$('fit-status').textContent='先修正输入问题';$('fit-status').className='danger';toast('输入有错误，未拟合或忽略任何行。');return;}
    if(!data.length){toast('请先粘贴浓度与存活率。');$('data').focus();return;}
    busy=true;$('fit').disabled=true;$('data').disabled=true;$('example').disabled=true;$('clear').disabled=true;
    for(const radio of document.querySelectorAll('input[name="model"]'))radio.disabled=true;
    $('fit').innerHTML='<span>拟合中…</span>';L.refresh();
    setTimeout(()=>{
      try{result=E.fit(data,model());renderResult();}
      catch(error){result=null;$('diagnostics').innerHTML=`<div class="diagnostic danger"><span>!</span><div>${P.esc(error.message)}</div></div>`;$('fit-status').textContent='未得到可解释结果';$('fit-status').className='danger';redraw();}
      finally{busy=false;$('fit').disabled=false;$('data').disabled=false;$('example').disabled=false;$('clear').disabled=false;for(const radio of document.querySelectorAll('input[name="model"]'))radio.disabled=false;$('fit').innerHTML='<span>拟合</span>';L.refresh();}
    },30);
  }
  function download(content,name,type){
    const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  const csv=s=>'"'+L.t(String(s)).replace(/"/g,'""')+'"';
  $('data').addEventListener('input',()=>{validate();resetResults();redraw();});
  $('fit').addEventListener('click',runFit);
  $('example').addEventListener('click',()=>{sample=true;$('data').value=E.SAMPLE;runFit();toast('载入的是固定软件测试值，非实验数据。');});
  $('clear').addEventListener('click',()=>{$('data').value='';sample=false;validate();resetResults();redraw();$('data').focus();});
  $('linear').addEventListener('click',()=>{axis='linear';redraw();});$('log').addEventListener('click',()=>{axis='log';redraw();});
  $('show-residual').addEventListener('change',redraw);
  $('help-link').addEventListener('click',()=>{$('guide').open=true;});
  for(const id of ['plot-style','log-labels','point-display'])$(id).addEventListener('change',()=>{if($('plot-style').value==='reference')$('reference-panel').open=true;redraw();});
  $('unit').addEventListener('change',()=>{if(result)renderResult();else redraw();});
  for(const radio of document.querySelectorAll('input[name="model"]'))radio.addEventListener('change',()=>{
    const notes={free:'存活率写成 %，并不意味着应固定 Top=100、Bottom=0。',fixed:'固定 −1 是一个模型假设；中间浓度少不等于该假设自动成立。',normalized:'将强制 Top=100、Bottom=0。请确认真实对照准确界定两端，不能只因为数据是 % 就使用。'};
    $('model-note').textContent=notes[model()];resetResults();redraw();toast('模型已更改，请重新拟合。');
  });
  $('export-results').addEventListener('click',()=>{
    if(!result)return;const r=result;
    const rows=[['IC50 拟合实验室 · 计算结果'],['数据来源',sample?'软件测试示例（可能已编辑），非实验数据':'用户输入'],['模型',E.MODELS[r.model].name],['方法','不加权非线性最小二乘；每个复孔等权；无置信区间'],['单位（仅标签）',unit()],['Top (%)',r.top],['Bottom (%)',r.bottom],['HillSlope',r.hill],['IC50',r.ic50],['log10(IC50)',r.logIC50],['半最大响应 (%)',r.midpoint],['50% 响应浓度（模型预测）',r.absolute50??'无有限解'],['R²',r.r2],['RMSE (百分点)',r.rmse],['SSE',r.sse],['n',r.n],['自由参数数',r.k],['残差自由度',r.df],['收敛',r.converged],['IC50 外推',r.outside],['横轴（不改变拟合）',axis],['0 浓度处理','保留拟合，Y(0)=Top；log 图不显示 0 浓度散点'],...r.warnings.map(w=>['提示',w.text]),[],['以下为输入观测与对应预测，预测不是实验数据'],['原始浓度','输入存活率 (%)','模型预测 (%)','残差 (百分点)','原始行号']];
    for(const d of data)rows.push([d.x,d.y,E.predict(d.x,r),d.y-E.predict(d.x,r),d.line]);
    download('\uFEFF'+rows.map(row=>row.map(csv).join(',')).join('\r\n'),'IC50_'+(sample?'software-test':'results')+'.csv','text/csv;charset=utf-8');toast('已导出结果；输入观测与模型预测分列保存。');
  });
  function exportChartSVG(){
    if(prism())return L.svg(figure());
    const note=(sample?'软件测试示例（非实验数据）。 ':'')+(axis==='log'&&result.zeroCount?`0 浓度 ${result.zeroCount} 个观测保留拟合，不显示在 log 横轴。 `:'')+E.MODELS[result.model].name+`；IC50=${num(result.ic50)} ${unit()}；Top=${num(result.top)}%；Bottom=${num(result.bottom)}%；HillSlope=${num(result.hill)}。`;
    const chart=P.chart(data,result,axis,unit()).replace('viewBox="0 0 940 426"','viewBox="0 0 940 510"').replace('</svg>',`<text x="74" y="455" font-family="sans-serif" font-size="11" fill="#6c807b">${P.esc(note)}</text><text x="74" y="480" font-family="sans-serif" font-size="11" fill="#6c807b">○ 输入观测　— 模型预测曲线　- - 半最大响应；未计算置信区间</text></svg>`);
    return L.svg(chart);
  }
  function updateExportOptions(){
    const format=$('export-format').value||'svg',isVector=format==='svg';$('export-dpi').disabled=isVector;$('export-width').disabled=isVector;
    if(isVector){$('export-help').textContent='SVG 中的文字、坐标轴、散点和曲线可分别编辑。';L.refresh();return;}
    const dpi=Number($('export-dpi').value||300),widthMm=Number($('export-width').value||180);
    const size=result?window.IC50Export.size(exportChartSVG(),dpi,widthMm):null;
    $('export-help').textContent=(size?`${size.width} × ${size.height} 像素，${dpi} dpi，图宽 ${widthMm} mm。`:`${dpi} dpi，图宽 ${widthMm} mm；像素尺寸在拟合后显示。`)+({png:'PNG 无损压缩，适合插入文档。',jpeg:'JPG 为有损压缩。',tiff:'TIFF 为未压缩 RGB 图片，文件较大。',pdf:'PDF 内嵌高清图片；文字和曲线不再是独立矢量对象。'}[format]||'');L.refresh();
  }
  for(const id of ['export-format','export-dpi','export-width'])$(id).addEventListener('change',updateExportOptions);
  let exporting=false;
  $('export-svg').addEventListener('click',async()=>{
    if(!result||exporting)return;
    const format=$('export-format').value||'svg',svg=exportChartSVG();
    const stem='IC50_'+(sample?'software-test-':'')+(prism()?'Prism':'curve');
    if(format==='svg'){download(svg,stem+(prism()?'-editable':'')+'.svg','image/svg+xml;charset=utf-8');toast('已导出可编辑 SVG。');return;}
    exporting=true;$('export-svg').disabled=true;$('export-svg').textContent='导出中…';L.refresh();
    const dpi=Number($('export-dpi').value||300),widthMm=Number($('export-width').value||180);
    try{
      const output=await window.IC50Export.convert(svg,format,{dpi,widthMm});
      download(output.content,stem+'-'+dpi+'dpi.'+output.extension,output.type);
      toast('已导出 '+format.toUpperCase()+'。');
    }catch(error){toast('导出失败：'+error.message);}
    finally{exporting=false;$('export-svg').disabled=!result||busy;$('export-svg').textContent='导出图形';L.refresh();}
  });
  // Observations remain in page memory. Only the UI language preference is persisted.
  window.IC50ReferenceUI.init({onStyle:(style,mode)=>{referenceStyle=style;$('plot-style').value=mode;redraw();},onMessage:toast});
  validate();resetResults();redraw();L.init();
})();
