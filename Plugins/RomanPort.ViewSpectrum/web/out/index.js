var RaptorPlugin;(()=>{var t={764:(t,e,s)=>{"use strict";var i;s.d(e,{Z:()=>p}),function(t){t[t.Top=0]="Top",t[t.Center=1]="Center",t[t.Bottom=2]="Bottom"}(i||(i={}));class a{constructor(t,e){this.x=t,this.y=e}}class n{constructor(t){this.container=t,this.enabled=!0,this.container.style.display="absolute",this.container.style.left="0",this.container.style.right="0",this.container.style.backgroundColor="black",this.SetOffset(0),this.mainCanvas=this.CreateComponent("canvas"),this.mainCanvasContext=this.mainCanvas.getContext("2d"),this.mainCanvas.style.position="absolute",this.mainCanvas.style.left=d.PADDING_WIDTH/2+"px",this.mainCanvas.style.top="0"}Resize(t,e){this.mainCanvas.width=t-d.PADDING_WIDTH,this.mainCanvas.height=e,this.container.style.height=e+"px"}SetOffset(t){this.container.style.top=t+"px"}SetEnabled(t){this.enabled=t}ProcessFrame(t){this.enabled&&this.DrawFrame(t)}CreateComponent(t){var e=document.createElement(t);return this.container.appendChild(e),e}}class r{constructor(t,e,s){this.canvas=t,this.context=this.canvas.getContext("2d"),this.width=e,this.height=s,this.pixels=this.context.createImageData(this.width,this.height)}DrawYAxis(t,e,s){for(var i=r.FindPixelPoints(t,t+e,s,this.height),a=0;a<i.length;a++){i[a][0];for(var n=i[a][1]*this.width*4,h=0;h<this.width;h++)this.pixels.data[n++]=255,this.pixels.data[n++]=255,this.pixels.data[n++]=255,this.pixels.data[n++]=128}return this}Apply(){this.canvas.width=this.width,this.canvas.height=this.height,this.context.putImageData(this.pixels,0,0)}static FindPixelPoints(t,e,s,i){for(var a=i/(e-t),n=[],r=t+t%s;r<=e;r+=s)n.push([r,Math.floor((r-t)*a)]);return n}}class h extends n{constructor(t){super(t),this.scaleCanvas=document.createElement("canvas"),t.appendChild(this.scaleCanvas),this.scaleCanvas.style.position="absolute",this.scaleCanvas.style.top="0",this.scaleCanvas.style.left="0",this.scaleCanvas.style.pointerEvents="none"}Resize(t,e){super.Resize(t,e),this.foregroundGradient=this.mainCanvasContext.createLinearGradient(0,0,0,e),this.foregroundGradient.addColorStop(0,"#70b4ff"),this.foregroundGradient.addColorStop(1,"#000050"),this.backgroundGradient=this.mainCanvasContext.createLinearGradient(0,0,0,e),this.backgroundGradient.addColorStop(0,"#345375"),this.backgroundGradient.addColorStop(1,"#000014"),t>0&&e>0&&this.enabled&&new r(this.scaleCanvas,t,e).DrawYAxis(0,80,5).Apply()}DrawFrame(t){var e;this.mainCanvasContext.fillStyle=this.foregroundGradient,this.mainCanvasContext.fillRect(0,0,this.mainCanvas.width,this.mainCanvas.height),this.mainCanvasContext.beginPath(),this.mainCanvasContext.moveTo(0,t[0]*this.mainCanvas.height),this.mainCanvasContext.strokeStyle="white",this.mainCanvasContext.fillStyle=this.backgroundGradient;for(var s=1;s<t.length;s++)e=Math.floor(t[s]*this.mainCanvas.height),this.mainCanvasContext.lineTo(s,e),this.mainCanvasContext.fillRect(s,0,1,e);this.mainCanvasContext.stroke()}}class o extends n{constructor(t){super(t),this.precomputedColors=[];for(var e=0;e<256;e++)this.precomputedColors.push(o.CalculateColor(e/256))}DrawFrame(t){this.mainCanvasContext.drawImage(this.mainCanvas,0,1);for(var e,s=this.mainCanvasContext.createImageData(this.mainCanvas.width,1),i=0,a=0;a<t.length;a++)e=this.precomputedColors[Math.floor(255*t[a])],s.data[i++]=e[0],s.data[i++]=e[1],s.data[i++]=e[2],s.data[i++]=255;this.mainCanvasContext.putImageData(s,0,0)}static CalculateColor(t){t=1-t,t=Math.max(0,t),t=Math.min(1,t);var e=o.WATERFALL_COLORS.length-1,s=this.WATERFALL_COLORS[Math.floor(t*e)],i=this.WATERFALL_COLORS[Math.ceil(t*e)],a=t*e-Math.floor(t*e);return[Math.ceil(i[0]*a+s[0]*(1-a)),Math.ceil(i[1]*a+s[1]*(1-a)),Math.ceil(i[2]*a+s[2]*(1-a))]}}o.WATERFALL_COLORS=[[0,0,32],[0,0,48],[0,0,80],[0,0,145],[30,144,255],[255,255,255],[255,255,0],[254,109,22],[255,0,0],[198,0,0],[159,0,0],[117,0,0],[74,0,0]];class l{constructor(){this.subscriptions=[]}Bind(t){this.subscriptions.push(t)}Fire(t){for(var e=0;e<this.subscriptions.length;e++){var s=this.subscriptions[e](t);null!=s&&!0===s&&(this.subscriptions.splice(e),e--)}}}class c{constructor(t,e,s){this.hd=s,this.SampleRateChanged=new l,this.FrameReceived=new l,this.sock=t.GetStream(e.id).AddQueryArgument("hd",s.toString()).AsWebSocket(),this.sock.onmessage=t=>{this.OnFrame(t.data)},this.connect=new Promise(((t,e)=>{this.sock.onopen=()=>t(),this.sock.onclose=()=>e()}))}SetSize(t){this.UpdateWebValue("size",t)}SetAttack(t){this.UpdateWebValue("attack",t)}SetDecay(t){this.UpdateWebValue("decay",t)}SetOffset(t){this.UpdateWebValue("offset",t)}SetRange(t){this.UpdateWebValue("range",t)}GetSampleRate(){return this.sampleRate}WaitConnect(){return this.connect}UpdateWebValue(t,e){var s={};s[t]=e,this.WaitConnect().then((()=>{this.sock.send(JSON.stringify(s))}))}OnFrame(t){var e=new DataView(t);this.sampleRate!=e.getUint32(0,!0)&&(this.sampleRate=e.getUint32(0,!0),this.SampleRateChanged.Fire(this.sampleRate));var s=(t.byteLength-4)/(this.hd?2:1),i=new Float32Array(s),a=4;if(this.hd)for(var n=0;n<s;n++)i[n]=e.getUint16(a,!0)/65535,a+=2;else for(n=0;n<s;n++)i[n]=e.getUint8(a++)/255;this.FrameReceived.Fire(i)}}class d{constructor(t,e){this.lastFrame=new Float32Array(1),this.conn=t,this.info=e,this.spectrumHeight=500}GetWindowName(){return this.info.name}CreateWindow(t){this.window=t,this.sock=new c(this.conn,this.info,!0),this.parts=[new h(this.CreateContainer(t)),new o(this.CreateContainer(t))],this.sock.FrameReceived.Bind((t=>{this.lastFrame=t;for(var e=0;e<this.parts.length;e++)this.parts[e].ProcessFrame(t)})),this.slider=this.CreateContainer(t),this.slider.style.width="15px",this.slider.style.height="31px",this.slider.style.right="0",this.slider.style.zIndex="99",this.slider.style.borderRadius="5px",this.slider.style.backgroundColor="#2C2F33",this.slider.addEventListener("mousedown",(()=>this.sliderDragging=!0)),window.addEventListener("mouseup",(()=>this.sliderDragging=!1)),window.addEventListener("mousemove",(t=>{this.sliderDragging&&(this.spectrumHeight+=t.movementY,this.ConfigureLayout())}))}DestoryWindow(){}ResizeWindow(t,e){0!=e&&(this.ConfigureLayout(),this.sock.SetSize(t-d.PADDING_WIDTH))}ConfigureLayout(){var t=this.window.clientHeight,e=this.window.clientWidth;this.spectrumHeight=Math.max(0,Math.min(this.window.clientHeight,this.spectrumHeight)),this.slider.style.top=this.spectrumHeight-15+"px",this.spectrumHeight<30?(this.parts[1].Resize(e,t),this.parts[1].SetEnabled(!0),this.parts[1].SetOffset(0),this.parts[0].SetEnabled(!1),this.parts[0].Resize(e,t)):this.window.clientHeight-this.spectrumHeight<30?(this.parts[0].Resize(e,t),this.parts[0].SetEnabled(!0),this.parts[0].SetOffset(0),this.parts[1].SetEnabled(!1),this.parts[1].Resize(e,t)):(this.parts[0].Resize(e,this.spectrumHeight),this.parts[1].Resize(e,t-this.spectrumHeight),this.parts[0].SetOffset(0),this.parts[1].SetOffset(this.spectrumHeight),this.parts[0].SetEnabled(!0),this.parts[1].SetEnabled(!0));for(var s=0;s<this.parts.length;s++)this.parts[s].ProcessFrame(this.lastFrame)}CreateContainer(t){var e=document.createElement("div");return e.style.position="absolute",t.appendChild(e),e}}d.PADDING_WIDTH=30;class p{constructor(t){this.ctx=t}Init(){for(var t=this.ctx.conn.GetPrimitiveDataProvider(this.ctx.GetId()+".Spectrums").GetValue(),e=this.ctx.RegisterWindowClass({displayName:"Spectrum",id:"RomanPort.SpectrumPlugin.Spectrum",createInstance:t=>new d(this.ctx.conn,t),hideHeader:!1,sizeMin:new a(100,100),sizeDefault:new a(400,300),sizeMax:new a(3840,99999)}),s=0;s<t.length;s++)e.RegisterInstance({displayName:t[s].name,info:t[s],id:t[s].id}).RequestMount(i.Center,10)}}},138:(t,e,s)=>{const i=s(764).Z;t.exports=i}},e={};function s(i){var a=e[i];if(void 0!==a)return a.exports;var n=e[i]={exports:{}};return t[i](n,n.exports,s),n.exports}s.d=(t,e)=>{for(var i in e)s.o(e,i)&&!s.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},s.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e);var i=s(138);RaptorPlugin=i})();