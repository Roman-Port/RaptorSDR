var RaptorPlugin;(()=>{var t={426:(t,e,i)=>{"use strict";i.d(e,{Z:()=>r});var s=i(645),n=i.n(s)()((function(t){return t[1]}));n.push([t.id,".rplug_spectrum_handle {\r\n    position: absolute;\r\n    width: 15px;\r\n    height: 32px;\r\n    right: 0px;\r\n    z-index: 99;\r\n    border-radius: 3px;\r\n    cursor: pointer;\r\n    background-color: rgb(44, 47, 51);\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n\r\n.rplug_spectrum_handle div {\r\n    width: 15px;\r\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZmlsbD0iI0ZGRkZGRiI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDhsLTYgNiAxLjQxIDEuNDFMMTIgMTAuODNsNC41OSA0LjU4TDE4IDE0bC02LTZ6Ii8+PC9zdmc+);\r\n    background-size: 13px;\r\n    background-repeat: no-repeat;\r\n    background-position: center center;\r\n    height: 100%;\r\n    flex-grow: 1;\r\n    pointer-events: none;\r\n    opacity: 0.7;\r\n}\r\n\r\n.rplug_spectrum_handle div:last-of-type {\r\n    transform: scaleY(-1);\r\n}\r\n\r\n.rplug_spectrum_preview {\r\n    position: absolute;\r\n    z-index: 9;\r\n    border: 1px solid black;\r\n    background: black;\r\n    overflow: hidden;\r\n    cursor: move;\r\n    opacity: 0;\r\n    transition: opacity 80ms ease-in-out;\r\n}\r\n\r\n.rplug_spectrum:hover .rplug_spectrum_preview {\r\n    opacity: 0.75;\r\n}\r\n\r\n.rplug_spectrum_preview:hover {\r\n    opacity: 1 !important;\r\n}",""]);const r=n},645:t=>{"use strict";t.exports=function(t){var e=[];return e.toString=function(){return this.map((function(e){var i=t(e);return e[2]?"@media ".concat(e[2]," {").concat(i,"}"):i})).join("")},e.i=function(t,i,s){"string"==typeof t&&(t=[[null,t,""]]);var n={};if(s)for(var r=0;r<this.length;r++){var a=this[r][0];null!=a&&(n[a]=!0)}for(var o=0;o<t.length;o++){var h=[].concat(t[o]);s&&n[h[0]]||(i&&(h[2]?h[2]="".concat(i," and ").concat(h[2]):h[2]=i),e.push(h))}},e}},654:(t,e,i)=>{"use strict";i.r(e),i.d(e,{default:()=>g});var s=i(379),n=i.n(s),r=i(795),a=i.n(r),o=i(695),h=i.n(o),l=i(216),d=i.n(l),c=i(426),u={styleTagTransform:function(t,e){if(e.styleSheet)e.styleSheet.cssText=t;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(t))}},setAttributes:function(t){var e=i.nc;e&&t.setAttribute("nonce",e)},insert:function(t){var e=h()("head");if(!e)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");e.appendChild(t)}};u.domAPI=a(),u.insertStyleElement=d(),n()(c.Z,u);const g=c.Z&&c.Z.locals?c.Z.locals:void 0},695:t=>{"use strict";var e={};t.exports=function(t){if(void 0===e[t]){var i=document.querySelector(t);if(window.HTMLIFrameElement&&i instanceof window.HTMLIFrameElement)try{i=i.contentDocument.head}catch(t){i=null}e[t]=i}return e[t]}},379:t=>{"use strict";var e=[];function i(t){for(var i=-1,s=0;s<e.length;s++)if(e[s].identifier===t){i=s;break}return i}function s(t,s){for(var r={},a=[],o=0;o<t.length;o++){var h=t[o],l=s.base?h[0]+s.base:h[0],d=r[l]||0,c="".concat(l," ").concat(d);r[l]=d+1;var u=i(c),g={css:h[1],media:h[2],sourceMap:h[3]};-1!==u?(e[u].references++,e[u].updater(g)):e.push({identifier:c,updater:n(g,s),references:1}),a.push(c)}return a}function n(t,e){var i=e.domAPI(e);return i.update(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;i.update(t=e)}else i.remove()}}t.exports=function(t,n){var r=s(t=t||[],n=n||{});return function(t){t=t||[];for(var a=0;a<r.length;a++){var o=i(r[a]);e[o].references--}for(var h=s(t,n),l=0;l<r.length;l++){var d=i(r[l]);0===e[d].references&&(e[d].updater(),e.splice(d,1))}r=h}}},216:t=>{"use strict";t.exports=function(t){var e=document.createElement("style");return t.setAttributes(e,t.attributes),t.insert(e),e}},795:t=>{"use strict";t.exports=function(t){var e=t.insertStyleElement(t);return{update:function(i){!function(t,e,i){var s=i.css,n=i.media,r=i.sourceMap;n?t.setAttribute("media",n):t.removeAttribute("media"),r&&"undefined"!=typeof btoa&&(s+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(r))))," */")),e.styleTagTransform(s,t)}(e,t,i)},remove:function(){!function(t){if(null===t.parentNode)return!1;t.parentNode.removeChild(t)}(e)}}}},859:(t,e,i)=>{"use strict";var s,n,r;i.d(e,{Z:()=>S}),function(t){t[t.Top=0]="Top",t[t.Center=1]="Center",t[t.Bottom=2]="Bottom"}(s||(s={}));class a{constructor(t,e){this.x=t,this.y=e}}!function(t){t.GENRAL="GENERAL",t.EXTRA="EXTRA",t.PLUGIN="PLUGIN",t.PINNED="PINNED",t.MENU="MENU",t.NONE="NONE"}(n||(n={}));class o{constructor(t){this.container=t,this.enabled=!0,this.container.style.display="absolute",this.container.style.left="0",this.container.style.right="0",this.container.style.backgroundColor="black",this.SetOffset(0),this.mainCanvas=this.CreateComponent("canvas"),this.mainCanvasContext=this.mainCanvas.getContext("2d"),this.mainCanvas.style.position="absolute",this.mainCanvas.style.left=D.PADDING_LEFT+"px",this.mainCanvas.style.top="0"}Update(t,e,i,s){this.mainCanvas.width=t-D.PADDING_WIDTH,this.mainCanvas.height=e,this.container.style.height=e+"px"}SetOffset(t){this.container.style.top=t+"px"}SetEnabled(t){this.enabled=t}ProcessFrame(t){this.enabled&&this.DrawFrame(t)}CreateComponent(t){var e=document.createElement(t);return this.container.appendChild(e),e}}class h{static MakeGradient(t,e,i,s){var n=t.createLinearGradient(0,0,0,e);return n.addColorStop(0,i),n.addColorStop(1,s),n}static PaintSpectrum(t,e,i,s,n,r){var a;t.fillStyle=n,t.fillRect(0,0,e,i),t.beginPath(),t.moveTo(0,s[0]*i),t.strokeStyle="white",t.fillStyle=r;for(var o=1;o<s.length;o++)a=Math.floor(s[o]*i),t.lineTo(o,a),t.fillRect(o,0,1,a);t.stroke()}}class l{constructor(t,e,i){this.canvas=t,this.context=this.canvas.getContext("2d"),this.width=e,this.height=i,this.canvas.width=this.width,this.canvas.height=this.height}DrawYAxis(t,e){for(var i=(this.height-d.PADDING_HEIGHT)/12,s=5;e/s>i;)s*=2;var n=l.FindPixelPoints(t,t+e,s,this.height-d.PADDING_HEIGHT),r=this.CreateFilledImageData(this.width-D.PADDING_WIDTH,1);this.context.font="10px Roboto",this.context.fillStyle="white",this.context.textAlign="right";for(var a=0;a<n.length;a++)this.context.fillText(n[a][0].toString(),D.PADDING_LEFT-3,n[a][1]+5+d.PADDING_TOP,D.PADDING_LEFT-3),this.context.putImageData(r,D.PADDING_LEFT,n[a][1]+d.PADDING_TOP);return this}DrawXAxis(t,e,i){var s,n=e-t/2,r=e+t/2,a=(this.width-D.PADDING_WIDTH)/50;if(null==i||0==i)for(s=1;;){var o=s;if((r-n)/(s=5*o)<=a)break;if((r-n)/(s=10*o)<=a)break}else s=i;var h=l.FindPixelPoints(n,r,s,this.width-D.PADDING_WIDTH),c=this.CreateFilledImageData(1,this.height-d.PADDING_HEIGHT);this.context.font="10px Roboto",this.context.fillStyle="white",this.context.textAlign="center";for(var u=0;u<h.length;u++)this.context.fillText(this.FormatFreq(h[u][0]),h[u][1]+D.PADDING_LEFT,this.height-d.PADDING_TOP/2-5-2),this.context.putImageData(c,h[u][1]+D.PADDING_LEFT,d.PADDING_TOP);return this}FormatFreq(t){if(0==t)return"DC";for(var e=0;Math.abs(t)>=1e3;)t/=1e3,e++;return t=Math.round(t*l.FREQ_ROUNDING),Math.floor(t/l.FREQ_ROUNDING).toString()+"."+(t%l.FREQ_ROUNDING).toString().padEnd(3,"0")+" "+l.FREQ_FORMATS[e]}CreateFilledImageData(t,e){for(var i=this.context.createImageData(t,e),s=e*t*4,n=0;n<s;)i.data[n++]=255,i.data[n++]=255,i.data[n++]=255,i.data[n++]=60;return i}static FindPixelPoints(t,e,i,s){for(var n=s/(e-t),r=[],a=Math.ceil(t/i)*i;a<=e;a+=i)r.push([a,Math.floor((a-t)*n)]);return r}}l.FREQ_FORMATS=["","k","M","G","T"],l.FREQ_ROUNDING=100;class d extends o{constructor(t,e,i){super(t),this.height=0,this.width=0,this.info=e,this.zoomed=i,this.mainCanvas.style.top=d.PADDING_TOP+"px",this.scaleCanvas=document.createElement("canvas"),t.appendChild(this.scaleCanvas),this.scaleCanvas.style.position="absolute",this.scaleCanvas.style.top="0",this.scaleCanvas.style.left="0",this.scaleCanvas.style.pointerEvents="none"}Update(t,e,i,s){super.Update(t,e-d.PADDING_HEIGHT,i,s),this.height=e,this.width=t,this.foregroundGradient=h.MakeGradient(this.mainCanvasContext,e-d.PADDING_HEIGHT,"#70b4ff","#000050"),this.backgroundGradient=h.MakeGradient(this.mainCanvasContext,e-d.PADDING_HEIGHT,"#345375","#000014")}SettingsChanged(t,e,i,s){e=this.zoomed.GetValue(),null!=t&&null!=e&&null!=i&&null!=s&&this.width>0&&this.height>0&&this.enabled&&0!=e&&0!=s&&new l(this.scaleCanvas,this.width,this.height).DrawYAxis(i,s).DrawXAxis(e,t,this.info.fixedIncrement)}DrawFrame(t){h.PaintSpectrum(this.mainCanvasContext,this.mainCanvas.width,this.mainCanvas.height,t,this.foregroundGradient,this.backgroundGradient)}}d.PADDING_TOP=5,d.PADDING_BOTTOM=25,d.PADDING_HEIGHT=d.PADDING_TOP+d.PADDING_BOTTOM;class c extends o{constructor(t){super(t),this.precomputedColors=[];for(var e=0;e<256;e++)this.precomputedColors.push(c.CalculateColor(e/256))}SettingsChanged(t,e,i,s){}Update(t,e,i,s){if(0==t||0==e||0==this.mainCanvas.width||0==this.mainCanvas.height)super.Update(t,e,i,s);else{var n=this.mainCanvasContext.getImageData(0,0,this.mainCanvas.width,this.mainCanvas.height),r=this.mainCanvas.width,a=this.mainCanvas.height;super.Update(t,e,i,s);var o=Math.min(e,a),h=t-D.PADDING_WIDTH,l=r/h;if(1==l)this.mainCanvasContext.putImageData(n,0,0);else{for(var d=this.mainCanvasContext.createImageData(h,o),c=0;c<o;c++)for(var u=0;u<h;u++){var g=4*(c*r+Math.floor(u*l)),p=4*(c*h+u);d.data[p+0]=n.data[g+0],d.data[p+1]=n.data[g+1],d.data[p+2]=n.data[g+2],d.data[p+3]=n.data[g+3]}this.mainCanvasContext.putImageData(d,0,0)}}}DrawFrame(t){this.mainCanvasContext.drawImage(this.mainCanvas,0,1);for(var e,i=this.mainCanvasContext.createImageData(this.mainCanvas.width,1),s=0,n=0;n<t.length;n++)e=this.precomputedColors[Math.floor(255*t[n])],i.data[s++]=e[0],i.data[s++]=e[1],i.data[s++]=e[2],i.data[s++]=255;this.mainCanvasContext.putImageData(i,0,0)}static CalculateColor(t){t=1-t,t=Math.max(0,t),t=Math.min(1,t);var e=c.WATERFALL_COLORS.length-1,i=this.WATERFALL_COLORS[Math.floor(t*e)],s=this.WATERFALL_COLORS[Math.ceil(t*e)],n=t*e-Math.floor(t*e);return[Math.ceil(s[0]*n+i[0]*(1-n)),Math.ceil(s[1]*n+i[1]*(1-n)),Math.ceil(s[2]*n+i[2]*(1-n))]}}c.WATERFALL_COLORS=[[0,0,32],[0,0,48],[0,0,80],[0,0,145],[30,144,255],[255,255,255],[255,255,0],[254,109,22],[255,0,0],[198,0,0],[159,0,0],[117,0,0],[74,0,0]];class u{constructor(){this.subscriptions=[]}Bind(t){this.subscriptions.push(t)}Unbind(t){for(var e=0;e<this.subscriptions.length;e++)if(this.subscriptions[e]==t)return this.subscriptions.splice(e,1),!0;return!1}Fire(t){for(var e=0;e<this.subscriptions.length;e++){var i=this.subscriptions[e](t);null!=i&&!0===i&&(this.subscriptions.splice(e),e--)}}}class g{constructor(t,e,i){this.currentToken=0,this.hd=i,this.FrameReceived=new u,this.sock=t.GetStream(e.id).AddQueryArgument("hd",i.toString()).AsWebSocket(),this.sock.onmessage=t=>{this.OnFrame(t.data)},this.connect=new Promise(((t,e)=>{this.sock.onopen=()=>t(),this.sock.onclose=()=>e()}))}SetSize(t){this.UpdateWebValue("size",t)}SetAttack(t){this.UpdateWebValue("attack",t)}SetDecay(t){this.UpdateWebValue("decay",t)}SetOffset(t){this.UpdateWebValue("offset",t)}SetRange(t){this.UpdateWebValue("range",t)}SetZoom(t){this.UpdateWebValue("zoom",t)}WaitConnect(){return this.connect}IsTokenCurrent(t){return t==this.currentToken}UpdateWebValue(t,e){var i={};i[t]=e,this.currentToken=(this.currentToken+1)%65535,i.token=this.currentToken,this.WaitConnect().then((()=>{this.sock.send(JSON.stringify(i))}))}OnFrame(t){var e=new DataView(t),i={protocolVersion:e.getInt8(0),opcode:e.getInt8(1),token:e.getUint16(2,!0),sampleRate:e.getUint32(4,!0),frame:new Float32Array((t.byteLength-g.HEADER_SIZE)/(this.hd?2:1))},s=g.HEADER_SIZE;if(this.hd)for(var n=0;n<i.frame.length;n++)i.frame[n]=e.getUint16(s,!0)/65535,s+=2;else for(n=0;n<i.frame.length;n++)i.frame[n]=e.getUint8(s++)/255;this.FrameReceived.Fire(i)}}g.HEADER_SIZE=8,function(t){t[t.OP_INVALID=0]="OP_INVALID",t[t.OP_FRAME_ZOOM=1]="OP_FRAME_ZOOM",t[t.OP_FRAME_FULL=2]="OP_FRAME_FULL"}(r||(r={}));class p{static CreateDom(t,e,i){var s=document.createElement(t);return s.SetStyleAttribute=function(t,e){return this.style[t]=e,this},s.Chain=function(t){return t(this),this},s.SetText=function(t){return this.innerText=t,this},s.AddClass=function(t){return this.classList.add(t),this},null!=e&&s.classList.add(e),null!=i&&i.appendChild(s),s}static AddDragEvents(t,e){this.draggingBound||(window.addEventListener("mousemove",(t=>{null!=this.currentDraggingItem&&(this.currentDraggingStarted||null==this.currentDraggingItem.xraptor_dragging_event.DragBegin||this.currentDraggingItem.xraptor_dragging_event.DragBegin(t,this.currentDraggingItem),null!=this.currentDraggingItem.xraptor_dragging_event.DragMove&&this.currentDraggingItem.xraptor_dragging_event.DragMove(t,this.currentDraggingItem),this.currentDraggingStarted=!0,t.preventDefault(),t.stopPropagation())})),window.addEventListener("mouseup",(t=>{this.currentDraggingStarted&&null!=this.currentDraggingItem&&(null!=this.currentDraggingItem.xraptor_dragging_event.DragEnd&&this.currentDraggingItem.xraptor_dragging_event.DragEnd(t,this.currentDraggingItem),this.currentDraggingItem=null,this.currentDraggingStarted=!1,t.preventDefault(),t.stopPropagation())})),this.draggingBound=!0),t.xraptor_dragging_event=e,t.addEventListener("mousedown",(t=>{null==this.currentDraggingItem&&(this.currentDraggingItem=t.currentTarget,this.currentDraggingStarted=!1,t.preventDefault(),t.stopPropagation())}))}static ForceBeginDrag(t){this.currentDraggingItem=t,this.currentDraggingStarted=!1}}p.currentDraggingStarted=!1,p.draggingBound=!1;class m{constructor(t,e){this.zoom=t,this.center=e,this.mount=p.CreateDom("div","rplug_spectrum_preview").SetStyleAttribute("top","20px").SetStyleAttribute("left",D.PADDING_LEFT+15+"px").SetStyleAttribute("right",D.PADDING_RIGHT+15+"px").SetStyleAttribute("height",m.HEIGHT+"px"),this.canvas=p.CreateDom("canvas",null,this.mount).SetStyleAttribute("width","100%").SetStyleAttribute("height","100%"),this.context=this.canvas.getContext("2d"),this.region=p.CreateDom("div",null,this.mount).SetStyleAttribute("position","absolute").SetStyleAttribute("border-left","1px solid black").SetStyleAttribute("border-right","1px solid black").SetStyleAttribute("top","0").SetStyleAttribute("bottom","0"),this.CreatePickerMask(!0),this.CreatePickerMask(!1),this.foregroundGradient=h.MakeGradient(this.context,m.HEIGHT,"#70b4ff","#000050"),this.backgroundGradient=h.MakeGradient(this.context,m.HEIGHT,"#345375","#000014"),p.AddDragEvents(this.region,{DragBegin:t=>{var e=this.region.getBoundingClientRect();this.dragOffset=t.clientX-e.left-e.width/2},DragMove:t=>{var e=this.mount.getBoundingClientRect(),i=(t.clientX-e.left-this.dragOffset)/e.width;this.UpdateConstrainedCenter(i)}})}MountTo(t){t.appendChild(this.mount)}AddFrame(t){this.canvas.width=t.length,this.canvas.height=m.HEIGHT,h.PaintSpectrum(this.context,t.length,m.HEIGHT,t,this.foregroundGradient,this.backgroundGradient)}UpdateRegion(){var t=this.canvas.width*this.zoom.GetValue()/2,e=this.canvas.width*this.center.GetValue(),i=e-t,s=e+t;this.region.style.left=i+"px",this.region.style.width=s-i+"px"}UpdateConstrainedCenter(t){var e=this.zoom.GetValue()/2;this.center.SetValue(Math.max(e,Math.min(1-e,t)))}CreatePickerMask(t){var e=p.CreateDom("div",null,this.region).SetStyleAttribute("position","absolute").SetStyleAttribute("top","0").SetStyleAttribute("bottom","0").SetStyleAttribute(t?"left":"right","0");p.CreateDom("div",null,e).SetStyleAttribute("position","absolute").SetStyleAttribute("top","0").SetStyleAttribute("bottom","0").SetStyleAttribute("width","100vw").SetStyleAttribute("background","#0000003b").SetStyleAttribute(t?"right":"left","0")}}m.HEIGHT=60;class f{constructor(t,e,i,s){this.OnChanged=new u,this.host=t,this.persistKey=e,this.sockKey=i,this.persist=this.host.persist,null==this.persist[this.persistKey]&&(this.persist[this.persistKey]=s),this.host.sock.UpdateWebValue(this.sockKey,this.GetValue())}SetAllowed(){return!0}GetValue(){return this.persist[this.persistKey]}SetValue(t){return e=this,i=void 0,n=function*(){this.persist[this.persistKey]=t,this.host.sock.UpdateWebValue(this.sockKey,t),this.OnChanged.Fire(t),this.host.SettingsChanged()},new((s=void 0)||(s=Promise))((function(t,r){function a(t){try{h(n.next(t))}catch(t){r(t)}}function o(t){try{h(n.throw(t))}catch(t){r(t)}}function h(e){var i;e.done?t(e.value):(i=e.value,i instanceof s?i:new s((function(t){t(i)}))).then(a,o)}h((n=n.apply(e,i||[])).next())}));var e,i,s,n}}class v{constructor(t,e){this.OnChanged=new u,this.baseProvider=t,this.scale=e,this.baseProvider.OnChanged.Bind((t=>{this.OnChanged.Fire(Math.floor(t*this.scale))}))}GetValue(){return Math.floor(this.baseProvider.GetValue()*this.scale)}SetValue(t){return this.baseProvider.SetValue(t/this.scale)}SetAllowed(){return!0}}i(654);class D{constructor(t){this.parts=[],this.persistentSpectrumHeightUpdated=!1,this.sampleRate=1,this.ctx=t,this.conn=t.conn,this.info=t.info,this.persist=t.persist,this.sock=new g(this.conn,this.info,!0),this.SettingOffset=new f(this,"offset","offset",this.info.defaultOffset),this.SettingRange=new f(this,"range","range",this.info.defaultRange),this.SettingAttack=new f(this,"attack","attack",this.info.defaultAttack),this.SettingDecay=new f(this,"decay","decay",this.info.defaultDecay),this.SettingZoom=new f(this,"zoom","zoom",.5),this.SettingCenter=new f(this,"center","center",.5),this.SampleRate={GetValue:()=>this.sampleRate,SetValue:()=>{throw new Error("Cannot set sample rate.")},SetAllowed:()=>!1,OnChanged:new u},this.SampleRateZoomed={GetValue:()=>this.sampleRate*this.SettingZoom.GetValue(),SetValue:()=>{throw new Error("Cannot set sample rate.")},SetAllowed:()=>!1,OnChanged:new u},this.preview=new m(this.SettingZoom,this.SettingCenter);var e=t.CreateSettingsRegion(this.info.name+" Settings","settings").AddOptionRange("Offset",this.SettingOffset,0,200).AddOptionRange("Range",this.SettingRange,1,200).AddOptionRange("Attack",new v(this.SettingAttack,100),0,100).AddOptionRange("Decay",new v(this.SettingDecay,100),0,100).Build();t.RegisterSettingsRegionSidebar(e,n.EXTRA)}GetWindowName(){return this.info.name}CreateWindow(t){this.window=t,this.window.classList.add("rplug_spectrum"),null!=this.info.freqDataProvider&&(this.freqDataProvider=this.conn.GetPrimitiveDataProvider(this.info.freqDataProvider),this.freqDataProvider.OnChanged.Bind((()=>{this.SettingsChanged()}))),this.parts=[new d(this.CreateContainer(t),this.info,this.SampleRateZoomed),new c(this.CreateContainer(t))],this.sock.FrameReceived.Bind((t=>{if(this.sampleRate!=t.sampleRate&&(this.sampleRate=t.sampleRate,this.SampleRate.OnChanged.Fire(this.SampleRate.GetValue()),this.SampleRateZoomed.OnChanged.Fire(this.SampleRateZoomed.GetValue()),this.SettingsChanged()),t.opcode==r.OP_FRAME_ZOOM&&this.sock.IsTokenCurrent(t.token))for(var e=0;e<this.parts.length;e++)this.parts[e].ProcessFrame(t.frame);t.opcode==r.OP_FRAME_FULL&&this.sock.IsTokenCurrent(t.token)&&this.preview.AddFrame(t.frame)})),this.preview.MountTo(t),t.addEventListener("wheel",(t=>{var e=this.SettingZoom.GetValue()+.03*Math.max(-1,Math.min(1,t.deltaY));this.SettingZoom.SetValue(Math.max(0,Math.min(1,e)));var i=this.SettingZoom.GetValue()/2;this.SettingCenter.SetValue(Math.max(i,Math.min(1-i,this.SettingCenter.GetValue()))),t.preventDefault(),t.stopPropagation()})),this.slider=p.CreateDom("div","rplug_spectrum_handle",t),p.CreateDom("div",null,this.slider),p.CreateDom("div",null,this.slider),this.slider.addEventListener("mousedown",(()=>this.sliderDragging=!0)),window.addEventListener("mouseup",(()=>this.sliderDragging=!1)),window.addEventListener("mousemove",(t=>{this.sliderDragging&&(this.spectrumHeight+=t.movementY,this.ConfigureLayout(),t.preventDefault(),t.stopPropagation())}))}DestoryWindow(){}ResizeWindow(t,e){0!=e&&(this.persistentSpectrumHeightUpdated||(this.spectrumHeight=e*(null==this.persist.spectrumHeightPercent?.5:this.persist.spectrumHeightPercent),this.persistentSpectrumHeightUpdated=!0),this.ConfigureLayout(),this.sock.SetSize(t-D.PADDING_WIDTH))}SettingsChanged(){var t=null==this.freqDataProvider?0:this.freqDataProvider.GetValue();t+=(this.SettingCenter.GetValue()-.5)*(1*this.sampleRate),this.info.useCenterFreq||(t+=this.sampleRate/2);for(var e=0;e<this.parts.length;e++)this.parts[e].SettingsChanged(t,this.sampleRate,this.persist.offset,this.persist.range);null!=this.preview&&this.preview.UpdateRegion()}ConfigureLayout(){var t=this.window.clientHeight,e=this.window.clientWidth;this.spectrumHeight=Math.max(0,Math.min(this.window.clientHeight,this.spectrumHeight)),this.spectrumHeight<30?(this.parts[1].Update(e,t,this.persist.offset,this.persist.range),this.parts[1].SetEnabled(!0),this.parts[1].SetOffset(0),this.parts[0].SetEnabled(!1),this.parts[0].Update(e,0,this.persist.offset,this.persist.range),this.slider.style.top="-15px"):this.window.clientHeight-this.spectrumHeight<30?(this.parts[0].Update(e,t,this.persist.offset,this.persist.range),this.parts[0].SetEnabled(!0),this.parts[0].SetOffset(0),this.parts[1].SetEnabled(!1),this.parts[1].Update(e,0,this.persist.offset,this.persist.range),this.slider.style.top=t-15+"px"):(this.parts[0].Update(e,this.spectrumHeight,this.persist.offset,this.persist.range),this.parts[1].Update(e,t-this.spectrumHeight,this.persist.offset,this.persist.range),this.parts[0].SetOffset(0),this.parts[1].SetOffset(this.spectrumHeight),this.parts[0].SetEnabled(!0),this.parts[1].SetEnabled(!0),this.slider.style.top=this.spectrumHeight-15+"px"),this.SettingsChanged(),this.persist.spectrumHeightPercent=this.spectrumHeight/t}CreateContainer(t){var e=document.createElement("div");return e.style.position="absolute",t.appendChild(e),e}CreateSliderIcon(t,e){var i=document.createElement("div");i.style.width="15px",i.style.backgroundImage="url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZmlsbD0iI0ZGRkZGRiI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDhsLTYgNiAxLjQxIDEuNDFMMTIgMTAuODNsNC41OSA0LjU4TDE4IDE0bC02LTZ6Ii8+PC9zdmc+)",i.style.backgroundSize="13px",i.style.backgroundRepeat="no-repeat",i.style.backgroundPosition="center",i.style.height="100%",i.style.flexGrow="1",i.style.pointerEvents="none",i.style.opacity="0.7",e&&(i.style.transform="scaleY(-1)"),t.appendChild(i)}}D.PADDING_LEFT=25,D.PADDING_RIGHT=15,D.PADDING_WIDTH=D.PADDING_LEFT+D.PADDING_RIGHT;class S{constructor(t){this.ctx=t}Init(){for(var t=this.ctx.conn.GetPrimitiveDataProvider(this.ctx.GetId()+".Spectrums").GetValue(),e=this.ctx.RegisterWindowClass({displayName:"Spectrum",id:"RomanPort.SpectrumPlugin.Spectrum",createInstance:t=>new D(t),hideHeader:!1,sizeMin:new a(100,100),sizeDefault:new a(400,300),sizeMax:new a(3840,99999)}),i=0;i<t.length;i++)e.RegisterInstance({displayName:t[i].name,info:t[i],id:t[i].id}).RequestMount(s.Center,10)}}},138:(t,e,i)=>{const s=i(859).Z;t.exports=s}},e={};function i(s){var n=e[s];if(void 0!==n)return n.exports;var r=e[s]={id:s,exports:{}};return t[s](r,r.exports,i),r.exports}i.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return i.d(e,{a:e}),e},i.d=(t,e)=>{for(var s in e)i.o(e,s)&&!i.o(t,s)&&Object.defineProperty(t,s,{enumerable:!0,get:e[s]})},i.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),i.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};var s=i(138);RaptorPlugin=s})();