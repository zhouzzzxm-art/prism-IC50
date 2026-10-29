(function(root){
  'use strict';
  function init({onStyle,onMessage}){
    const R=root.IC50Reference,$=id=>document.getElementById(id);
    const controls={color:'ref-color',shape:'ref-shape',fill:'ref-fill',font:'ref-font',stroke:'ref-stroke',axisWidth:'ref-axis',fontSize:'ref-size',markerSize:'ref-marker',xTitle:'ref-x-title',yTitle:'ref-y-title'};
    let current=R.normalize(),previewURL=null,uploadSequence=0;
    const populate=s=>{for(const [key,id] of Object.entries(controls))$(id).value=s[key];};
    const read=()=>R.normalize(Object.fromEntries(Object.entries(controls).map(([key,id])=>[key,$(id).value])));
    const status=text=>{$('reference-status').textContent=text;root.IC50I18n?.refresh();};
    function clearPreview(){if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('reference-preview').hidden=true;$('reference-image').removeAttribute('src');$('reference-image').hidden=false;}
    function apply(s,message,mode='reference'){current=R.normalize(s);populate(current);$('reference-panel').open=true;onStyle({...current},mode);status(message);}
    populate(current);
    for(const id of Object.values(controls))$(id).addEventListener('change',()=>apply(read(),'参考样式已应用；拟合参数与输入数据保持不变。'));
    $('reference-apply').addEventListener('click',()=>apply(read(),'已应用到当前预览和 SVG 导出。'));
    $('reference-parse').addEventListener('click',()=>{
      const parsed=R.describe($('reference-prompt').value,read());
      if(!parsed.changes.length){status('未识别到支持的样式项，请使用颜色、符号、字体、线宽或字号描述，或直接调整下方选项。');return;}
      apply(parsed.style,`已应用 ${parsed.changes.length} 个可识别样式项；请查看预览确认。`);
    });
    $('reference-reset').addEventListener('click',()=>{uploadSequence++;clearPreview();$('reference-file').value='';$('reference-prompt').value='';apply(R.DEFAULT,'已恢复默认样式；数据与拟合结果未改变。','prism');});
    $('reference-save').addEventListener('click',()=>{
      const url=URL.createObjectURL(new Blob([R.writeJSON(read())],{type:'application/json;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='Prism-reference-style.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
      status('已保存可复用的样式 JSON；不含观测数据或拟合结果。');
    });
    $('reference-file').addEventListener('change',async()=>{
      const file=$('reference-file').files?.[0];if(!file)return;
      const attempt=++uploadSequence;
      try{
        if(file.size>10*1024*1024)throw Error('参考文件过大，请选择不超过 10 MB 的文件。');
        const name=file.name.toLowerCase();
        if(name.endsWith('.json')||name.endsWith('.svg')){
          const text=await file.text();if(attempt!==uploadSequence)return;
          let style;
          if(name.endsWith('.json'))style=R.readJSON(text);
          else{
            const doc=new DOMParser().parseFromString(text,'image/svg+xml');
            const metadata=doc.querySelector('[id="ic50-reference-style"]');
            if(doc.querySelector('parsererror')||!metadata)throw Error('此 SVG 不含本工具的样式配置。请上传 PNG / JPG 参考图，或本工具导出的 SVG / JSON。');
            style=R.readJSON(metadata.textContent);
          }
          clearPreview();$('reference-preview').hidden=false;$('reference-image').hidden=true;$('reference-filename').textContent=file.name;
          apply(style,'已恢复文件中的颜色、符号、字体、线宽和标题，并应用到预览及导出；未导入其中的实验数据。');
          return;
        }
        if(!/\.(png|jpe?g|webp)$/.test(name))throw Error('请选择 PNG、JPG、WebP，或本工具导出的 SVG / JSON。');
        const url=URL.createObjectURL(file);
        let image;
        try{
          image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('无法读取参考图片，请重新导出为 PNG 或 JPG。'));img.src=url;});
          if(attempt!==uploadSequence){URL.revokeObjectURL(url);return;}
          if(!image.width||!image.height||image.width*image.height>50000000)throw Error('图片尺寸不适合读取，请缩小后再上传。');
          const scale=Math.min(1,512/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
          const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('当前浏览器无法读取图片颜色，请手动选择主色。');
          ctx.drawImage(image,0,0,canvas.width,canvas.height);
          const color=R.dominantColor(ctx.getImageData(0,0,canvas.width,canvas.height).data);
          clearPreview();previewURL=url;$('reference-preview').hidden=false;$('reference-image').src=url;$('reference-filename').textContent=file.name;
          apply({...read(),...(color?{color}:{})},color?'已载入参考图并提取主色。字体、符号和布局未自动识别，请调整下方选项确认。':'未找到明显彩色主色，已保留当前颜色；请根据参考图手动调整样式。');
        }catch(error){URL.revokeObjectURL(url);throw error;}
      }catch(error){if(attempt!==uploadSequence)return;status(error.message);onMessage(error.message);}
      finally{if(attempt===uploadSequence)$('reference-file').value='';}
    });
    return {read,apply};
  }
  const api={init};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.IC50ReferenceUI=api;
})(typeof globalThis!=='undefined'?globalThis:this);
