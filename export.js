(function(root){
  'use strict';
  const FORMATS={svg:{extension:'svg',type:'image/svg+xml;charset=utf-8'},png:{extension:'png',type:'image/png'},jpeg:{extension:'jpg',type:'image/jpeg'},tiff:{extension:'tif',type:'image/tiff'},pdf:{extension:'pdf',type:'application/pdf'}};
  function size(svg,dpi=300,widthMm=180){
    const m=svg.match(/viewBox="\s*([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s*"/);
    if(!m||!(Number(m[3])>0&&Number(m[4])>0))throw Error('无法读取图形尺寸。');
    dpi=Number(dpi);widthMm=Number(widthMm);
    if(![150,300,600].includes(dpi)||![90,180].includes(widthMm))throw Error('请选择支持的图宽和分辨率。');
    const width=Math.round(widthMm/25.4*dpi),height=Math.round(width*Number(m[4])/Number(m[3]));
    if(width*height>25000000)throw Error('图片过大，请降低分辨率。');
    return {width,height,dpi,widthMm,heightMm:widthMm*Number(m[4])/Number(m[3])};
  }
  const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function join(chunks){const out=new Uint8Array(chunks.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of chunks){out.set(a,offset);offset+=a.length;}return out;}
  function pngDPI(input,dpi){
    const b=new Uint8Array(input);if(b.length<33||b[0]!==137||b[1]!==80||b[2]!==78||b[3]!==71)throw Error('PNG 编码失败。');
    const chunk=new Uint8Array(21),dv=new DataView(chunk.buffer);dv.setUint32(0,9);chunk.set([112,72,89,115],4);const ppm=Math.round(dpi/0.0254);dv.setUint32(8,ppm);dv.setUint32(12,ppm);chunk[16]=1;dv.setUint32(17,crc32(chunk.subarray(4,17)));
    const source=new DataView(b.buffer,b.byteOffset,b.byteLength),parts=[b.subarray(0,8)];let offset=8,inserted=false,ended=false;
    while(offset+12<=b.length){const length=source.getUint32(offset),end=offset+12+length;if(end>b.length)throw Error('PNG 文件不完整。');const tag=String.fromCharCode(...b.subarray(offset+4,offset+8));if(tag!=='pHYs')parts.push(b.subarray(offset,end));if(tag==='IHDR'){parts.push(chunk);inserted=true;}offset=end;if(tag==='IEND'){ended=true;break;}}
    if(!inserted||!ended)throw Error('PNG 文件不完整。');return join(parts);
  }
  function jpegDPI(input,dpi){
    const b=new Uint8Array(input);if(b[0]!==255||b[1]!==216)throw Error('JPG 编码失败。');
    let p=2;
    while(p+4<b.length){if(b[p]!==255)break;const marker=b[p+1];if(marker===218||marker===217)break;const length=(b[p+2]<<8)|b[p+3];if(length<2||p+2+length>b.length)break;
      if(marker===224&&length>=16&&String.fromCharCode(...b.subarray(p+4,p+9))==='JFIF\0'){const out=b.slice();out[p+11]=1;out[p+12]=dpi>>8;out[p+13]=dpi&255;out[p+14]=dpi>>8;out[p+15]=dpi&255;return out;}p+=length+2;
    }
    const segment=new Uint8Array([255,224,0,16,74,70,73,70,0,1,1,1,dpi>>8,dpi&255,dpi>>8,dpi&255,0,0]);
    return join([b.subarray(0,2),segment,b.subarray(2)]);
  }
  function tiffRGBA(rgba,width,height,dpi=300){
    if(!(width>0&&height>0&&Number.isInteger(width)&&Number.isInteger(height))||rgba.length!==width*height*4)throw Error('TIFF 图像尺寸无效。');
    const entries=13,ifd=8,bits=ifd+2+entries*12+4,xres=bits+6,yres=xres+8,pixels=yres+8,byteCount=width*height*3;
    const out=new Uint8Array(pixels+byteCount),v=new DataView(out.buffer);out.set([73,73,42,0,8,0,0,0]);v.setUint16(ifd,entries,true);
    const tags=[[256,4,1,width],[257,4,1,height],[258,3,3,bits],[259,3,1,1],[262,3,1,2],[273,4,1,pixels],[277,3,1,3],[278,4,1,height],[279,4,1,byteCount],[282,5,1,xres],[283,5,1,yres],[284,3,1,1],[296,3,1,2]];
    tags.forEach(([tag,type,count,value],i)=>{const p=ifd+2+i*12;v.setUint16(p,tag,true);v.setUint16(p+2,type,true);v.setUint32(p+4,count,true);if(type===3&&count===1)v.setUint16(p+8,value,true);else v.setUint32(p+8,value,true);});
    for(let i=0;i<3;i++)v.setUint16(bits+2*i,8,true);for(const offset of [xres,yres]){v.setUint32(offset,dpi,true);v.setUint32(offset+4,1,true);}
    let dest=pixels;for(let i=0;i<rgba.length;i+=4){const a=rgba[i+3]/255;for(let c=0;c<3;c++)out[dest++]=Math.round(rgba[i+c]*a+255*(1-a));}return out;
  }
  async function rasterize(svg,options){
    const dimensions=size(svg,options.dpi,options.widthMm);
    const sized=svg.replace(/<svg\b[^>]*>/,tag=>tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace('>',` width="${dimensions.width}" height="${dimensions.height}">`));
    const url=URL.createObjectURL(new Blob([sized],{type:'image/svg+xml;charset=utf-8'}));
    try{
      if(document.fonts?.ready)await document.fonts.ready;
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('无法渲染图形，请尝试 SVG 导出。'));img.src=url;});
      const canvas=document.createElement('canvas');canvas.width=dimensions.width;canvas.height=dimensions.height;const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('当前浏览器不支持图片导出，请使用 SVG。');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      return {...dimensions,canvas,context};
    }finally{URL.revokeObjectURL(url);}
  }
  function canvasBytes(canvas,type){return new Promise((resolve,reject)=>canvas.toBlob(async blob=>{try{if(!blob||blob.type!==type)throw Error('浏览器不支持所选图片编码。');resolve(new Uint8Array(await blob.arrayBuffer()));}catch(e){reject(e);}},type,0.96));}
  let libraryPromise;
  function loadPDF(){
    if(root.PDFLib)return Promise.resolve(root.PDFLib);
    if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/pdf-lib-1.17.1.min.js';s.onload=()=>root.PDFLib?resolve(root.PDFLib):reject(Error('PDF 组件加载失败。'));s.onerror=()=>{libraryPromise=null;reject(Error('PDF 组件加载失败，请重试或选择 PNG。'));};document.head.appendChild(s);});return libraryPromise;
  }
  async function pdfFromPNG(png,dimensions,library){
    const lib=library||await loadPDF(),pdf=await lib.PDFDocument.create();
    const width=dimensions.widthMm/25.4*72,height=dimensions.heightMm/25.4*72;
    const page=pdf.addPage([width,height]),image=await pdf.embedPng(png);page.drawImage(image,{x:0,y:0,width,height});pdf.setTitle('IC50 dose-response curve');pdf.setCreator('IC50 curve fitting');return pdf.save();
  }
  async function convert(svg,format,options={dpi:300,widthMm:180}){
    if(!FORMATS[format])throw Error('请选择支持的导出格式。');if(format==='svg')return {content:svg,...FORMATS.svg};
    const raster=await rasterize(svg,options);let content;
    if(format==='tiff')content=tiffRGBA(raster.context.getImageData(0,0,raster.width,raster.height).data,raster.width,raster.height,raster.dpi);
    else if(format==='jpeg')content=jpegDPI(await canvasBytes(raster.canvas,'image/jpeg'),raster.dpi);
    else {const png=pngDPI(await canvasBytes(raster.canvas,'image/png'),raster.dpi);content=format==='pdf'?await pdfFromPNG(png,raster):png;}
    raster.canvas.width=1;raster.canvas.height=1;return {content,...FORMATS[format],width:raster.width,height:raster.height};
  }
  const api={FORMATS,size,pngDPI,jpegDPI,tiffRGBA,pdfFromPNG,convert};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.IC50Export=api;
})(typeof globalThis!=='undefined'?globalThis:this);
