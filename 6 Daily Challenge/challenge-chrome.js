// MOON DAILY CHALLENGE - SHARED APP CHROME (JS)
// =================================================
// The canonical, single source of truth for what a Daily Challenge task's
// surrounding app frame looks like - topbar, view tabs, bottom toolbar,
// floor plan, and win/wrong feedback - matched against the real Sales
// Designer App's Figma file. See challenge-chrome.css for the exact node
// IDs each piece was built from.
//
// Load this (plus challenge-chrome.css) in every Daily Challenge file:
//   <link rel="stylesheet" href="challenge-chrome.css">
//   <script src="challenge-chrome.js"></script>
// then build the challenge's own content with these functions rather than
// re-implementing or copy-pasting any of them. If the real app's chrome
// changes, this is the one file to update - every challenge picks it up
// automatically instead of drifting file-by-file.
//
// Plain globals (no bundler in this repo - see CLAUDE.md's "no shared
// code" note; this file and catalog-data.js are the two deliberate
// exceptions, for the same reason: duplicating this much shared surface
// area per-file is exactly how it drifts).

function elc(html){ var t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }

// ---------- icons ----------
var MICN='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">';
// Exact undo/redo glyphs pulled from the real design (node 23739:41365's
// imgUndo/imgRedo assets) - a filled hook-shaped arrow, not a hand-drawn
// circular "refresh" icon.
var REAL_UNDO='<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18.6122 14.0425C18.6122 12.2094 17.1868 10.7233 15.4285 10.7233H6.42659L9.09082 13.5009C9.37773 13.8001 9.37773 14.2849 9.09082 14.584C8.8039 14.8832 8.33883 14.8832 8.05191 14.584L4.13354 10.4989C3.84662 10.1998 3.84662 9.71494 4.13354 9.41582L8.05191 5.3307C8.33883 5.03157 8.8039 5.03157 9.09082 5.3307C9.37773 5.62983 9.37773 6.11469 9.09082 6.41381L6.42659 9.19141H15.4285C17.9983 9.19141 20.0816 11.3633 20.0816 14.0425C20.0816 16.7217 17.9983 18.8936 15.4285 18.8936H14.4489C14.0432 18.8936 13.7142 18.5506 13.7142 18.1276C13.7142 17.7046 14.0432 17.3616 14.4489 17.3616H15.4285C17.1868 17.3616 18.6122 15.8756 18.6122 14.0425Z"/></svg>';
var REAL_REDO='<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3.91835 13.8823C3.91835 12.6966 4.40893 11.5599 5.28155 10.7215C6.15417 9.88306 7.33735 9.41172 8.57142 9.41172H17.5734L14.9091 6.85197C14.6222 6.5763 14.6222 6.12947 14.9091 5.8538C15.196 5.57814 15.6611 5.57814 15.948 5.8538L19.8664 9.61852C20.1533 9.89418 20.1533 10.341 19.8664 10.6167L15.948 14.3814C15.6611 14.6571 15.196 14.6571 14.9091 14.3814C14.6222 14.1057 14.6222 13.6589 14.9091 13.3832L17.5734 10.8235H8.57142C7.72706 10.8235 6.91751 11.146 6.32046 11.7196C5.7234 12.2933 5.38774 13.0711 5.38774 13.8823C5.38774 14.6936 5.7234 15.4714 6.32046 16.045C6.91752 16.6186 7.72706 16.9411 8.57142 16.9411H9.55102C9.95678 16.9411 10.2857 17.2572 10.2857 17.647C10.2857 18.0369 9.95678 18.3529 9.55102 18.3529H8.57142C7.33735 18.3529 6.15417 17.8816 5.28155 17.0432C4.40893 16.2048 3.91835 15.068 3.91835 13.8823Z"/></svg>';
var MX_ICONS={
  pencil: MICN+'<path d="M10.5 2.5l3 3-7.5 7.5H3v-3z"/><path d="M9 4l3 3"/></svg>',
  chev: '<svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="9" height="6"><path d="M1 1l4 4 4-4"/></svg>',
  chevRight: '<svg viewBox="0 0 6 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="6" height="10"><path d="M1 1l4 4-4 4"/></svg>',
  expand: MICN+'<path d="M6 2H2v4M10 2h4v4M2 10v4h4M14 10v4h-4"/></svg>',
  clipboard: MICN+'<rect x="3" y="2.5" width="10" height="12" rx="1.5"/><path d="M6 2v1.5h4V2"/><path d="M5.5 8.5l2 2 3-4"/></svg>',
  cube: MICN+'<path d="M8 2l5.5 3.2v5.6L8 14l-5.5-3.2V5.2z"/><path d="M2.5 5.2L8 8.4l5.5-3.2M8 8.4V14"/></svg>',
  undo: REAL_UNDO,
  redo: REAL_REDO,
  comment: MICN+'<path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg>',
  ruler: MICN+'<rect x="2.5" y="6.5" width="11" height="6" rx="1" transform="rotate(-25 8 9.5)"/><path d="M6 8l.6 1.2M8 7.1l.6 1.2M10 6.2l.6 1.2" transform="rotate(-25 8 9.5)"/></svg>',
  info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.3v4M8 5.2v.1"/></svg>'
};

// ---------- chrome builders ----------
function measureTopbar(){
  return '<div class="apptop">'+
    '<div class="mx-crumb">'+
      '<span class="seg" data-x="configure">'+MX_ICONS.pencil+' Configure <span class="chev">'+MX_ICONS.chev+'</span></span>'+
      '<span class="sep"></span><span class="seg" data-x="room">Room 1 <span class="chev">'+MX_ICONS.chev+'</span></span>'+
      '<span class="sep"></span><span class="seg cur" data-x="step">Measure &amp; Design <span class="chev">'+MX_ICONS.chev+'</span></span>'+
    '</div>'+
    '<div class="expand" data-x="expand">'+MX_ICONS.expand+'</div>'+
    '<div style="display:flex;align-items:center;gap:8px;">'+
      '<div class="mx-iconbtn" data-x="clipboard">'+MX_ICONS.clipboard+'</div>'+
      '<div class="mx-orb" data-x="ai"></div>'+
      '<div class="mx-avatar">JD</div>'+
    '</div>'+
  '</div>';
}
function measureViewTabs(view){
  view=view||'Floor Plan';
  function b(n){ return '<b class="'+(n===view?'on':'')+'" data-v="'+n+'">'+n+'</b>'; }
  return '<div class="mx-viewtabs">'+b('Floor Plan')+b('Architecture')+b('Systems')+'</div>';
}
function measureToolbar(view){
  view=view||'Top';
  // `label` (plain text) drives data-x; `lead`/`trail` icons are appended
  // to the displayed content only - never folded into the attribute, or
  // their embedded quoted SVG attributes would truncate data-x early.
  function grp(lead,label,on,trail){ return '<div class="grp'+(on?' on':'')+'" data-x="'+label+'">'+(lead||'')+' '+label+(trail?' '+trail:'')+'</div>'; }
  // "Front" and "Back Wall" are one clickable unit in the real toolbar
  // (an internal divider between them, not two separate pills).
  var frontWall='<div class="grp frontwall'+(view==='Front'?' on':'')+'" data-x="Front">'+MX_ICONS.cube+' Front<span class="fwsep"></span><span class="bw">Back Wall</span>'+MX_ICONS.chev+'</div>';
  return '<div class="mx-toolbar">'+
    grp('','All Systems',false,MX_ICONS.chev)+'<div class="sep"></div>'+
    grp(MX_ICONS.cube,'Top',view==='Top')+grp(MX_ICONS.cube,'3D',view==='3D')+frontWall+
    '<div class="sep"></div>'+
    '<div class="ico" data-x="undo">'+MX_ICONS.undo+'</div><div class="ico" data-x="redo">'+MX_ICONS.redo+'</div>'+
    '<div class="sep"></div>'+
    '<div class="ico" data-x="comment">'+MX_ICONS.comment+'</div><div class="ico" data-x="ruler">'+MX_ICONS.ruler+'</div>'+
  '</div>';
}
// Draws the standard L-shaped floor plan with real-style dimension pills
// and corner handles. `hatch` is accepted for call-site compatibility but
// no longer changes anything - the real Floor Plan (node 23739:41335) is
// plain white. `reachIn` overlays a "Reach-in closet" annotation box.
function roomSVG(hatch,reachIn){
  var RI = '<g>'+
    '<text x="445" y="500" text-anchor="middle" font-size="13" font-weight="800" fill="#7239EA" font-family="Manrope">Reach-in closet</text>'+
    '<rect x="335" y="508" width="220" height="48" rx="4" fill="#f4f2fb" stroke="#7239EA" stroke-width="2.4"/>'+
    '<line x1="350" y1="520" x2="540" y2="520" stroke="#7239EA" stroke-width="2.4" stroke-linecap="round"/>'+
    '<path d="M365 520 v8 M388 520 v8 M411 520 v8 M434 520 v8 M457 520 v8 M480 520 v8 M503 520 v8 M526 520 v8" stroke="#b9a7ef" stroke-width="1.6"/>'+
    '<rect x="350" y="537" width="86" height="15" rx="2" fill="#efeafe" stroke="#d9d2f4" stroke-width="1.3"/>'+
    '<rect x="454" y="537" width="86" height="15" rx="2" fill="#efeafe" stroke="#d9d2f4" stroke-width="1.3"/>'+
    '</g>';
  var gl='#a7a7b6'; // guide line color
  // Real "Measurement Input Tab" style: light lavender pill, plum border,
  // solid plum number badge, plum text.
  function pill(cx,cy,n,txt){ return '<g><rect x="'+(cx-31)+'" y="'+(cy-12)+'" width="62" height="24" rx="12" fill="#f1e2ff" stroke="#42275a" stroke-width="1.5"/>'+
    '<circle cx="'+(cx-18)+'" cy="'+cy+'" r="8" fill="#42275a"/><text x="'+(cx-18)+'" y="'+(cy+3.3)+'" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff" font-family="Manrope">'+n+'</text>'+
    '<text x="'+(cx+7)+'" y="'+(cy+3.6)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="#42275a" font-family="Manrope">'+txt+'</text></g>'; }
  function h(x,y){ return '<circle cx="'+x+'" cy="'+y+'" r="6.5" fill="#fff" stroke="#8a8a99" stroke-width="2"/>'; }
  function dimH(x1,x2,y,wy,n,txt){ // horizontal dim line at y, wall at wy
    return '<g stroke="'+gl+'" stroke-width="1.4">'+
      '<line x1="'+x1+'" y1="'+wy+'" x2="'+x1+'" y2="'+y+'" stroke-dasharray="3 3"/>'+
      '<line x1="'+x2+'" y1="'+wy+'" x2="'+x2+'" y2="'+y+'" stroke-dasharray="3 3"/>'+
      '<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" stroke-dasharray="5 4"/></g>'+
      '<polygon points="'+x1+','+y+' '+(x1+9)+','+(y-4.5)+' '+(x1+9)+','+(y+4.5)+'" fill="'+gl+'"/>'+
      '<polygon points="'+x2+','+y+' '+(x2-9)+','+(y-4.5)+' '+(x2-9)+','+(y+4.5)+'" fill="'+gl+'"/>'+
      pill((x1+x2)/2,y,n,txt); }
  function dimV(y1,y2,x,wx,n,txt){ // vertical dim line at x, wall at wx
    return '<g stroke="'+gl+'" stroke-width="1.4">'+
      '<line x1="'+wx+'" y1="'+y1+'" x2="'+x+'" y2="'+y1+'" stroke-dasharray="3 3"/>'+
      '<line x1="'+wx+'" y1="'+y2+'" x2="'+x+'" y2="'+y2+'" stroke-dasharray="3 3"/>'+
      '<line x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'" stroke-dasharray="5 4"/></g>'+
      '<polygon points="'+x+','+y1+' '+(x-4.5)+','+(y1+9)+' '+(x+4.5)+','+(y1+9)+'" fill="'+gl+'"/>'+
      '<polygon points="'+x+','+y2+' '+(x-4.5)+','+(y2-9)+' '+(x+4.5)+','+(y2-9)+'" fill="'+gl+'"/>'+
      pill(x,(y1+y2)/2,n,txt); }
  return '<svg class="room" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet">'+
    '<path d="M520 150 H760 V560 H300 V380 H520 Z" fill="#fff" stroke="#6E6E7A" stroke-width="10" stroke-linejoin="round"/>'+
    (reachIn?RI:'')+
    dimH(520,760,116,150,'1','48.5"')+
    dimV(150,560,830,760,'2','96.5"')+
    dimH(300,760,594,560,'3','96.5"')+
    dimV(380,560,266,300,'4','48.5"')+
    dimH(300,520,352,380,'5','48.5"')+
    dimV(150,380,486,520,'6','48.5"')+
    h(520,150)+h(760,150)+h(760,560)+h(300,560)+h(300,380)+h(520,380)+
    '</svg>';
}
function bottombar(back,helper,fwd){
  return '<div class="appbottom"><div class="backpill" data-x="back">← '+back+'</div><div class="helper">'+helper+'</div><button class="fwd" data-x="fwd">'+fwd+' →</button></div>';
}

// ---------- feedback helpers ----------
// The toast's own dismiss timer lives on the element itself (t._timer) so
// this needs no state passed in beyond the .appbody it renders into.
function chromeToast(body,msg){
  var t=body.querySelector('.toast');
  if(!t){ t=elc('<div class="toast"></div>'); body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(function(){ t.classList.remove('show'); },1700);
}
// `solved` is passed in fresh at each call (the caller's own boolean at
// the moment of the click) rather than owned here, since ownership of
// "has this task been solved yet" belongs to the challenge, not the chrome.
function chromeWrong(body,elm,msg,solved){
  if(solved)return;
  elm.classList.remove('shake'); void elm.offsetWidth; elm.classList.add('shake','badflash');
  setTimeout(function(){ elm.classList.remove('badflash'); },450);
  chromeToast(body,msg||'Not quite - try again.');
}
function chromeWinToast(body,msg){
  var t=elc('<div class="winbanner">'+msg+'</div>');
  body.appendChild(t);
  setTimeout(function(){ t.remove(); },1400);
}
// Wires the generic "clicking chrome that isn't part of this task" guard
// onto every topbar/viewtabs/toolbar control. `getSolved` is a function
// (not a boolean) so it reads the challenge's current state at click time,
// not whatever it was when wiring happened.
function wireChromeControls(root,body,getSolved){
  [].slice.call(root.querySelectorAll('.mx-crumb .seg,.mx-viewtabs b,.mx-toolbar .grp,.mx-toolbar .ico,.mx-iconbtn,.mx-orb,.expand')).forEach(function(elm){
    elm.addEventListener('click',function(){ chromeWrong(body,elm,'That control isn’t part of this task - try again.',getSolved()); });
  });
}
// Shows the task prompt big & centered on a light-blue background, then
// FLIPs (First-Last-Invert-Play) it down into `targetEl` - its real spot
// in the task strip - so the most important info on the screen doesn't
// get lost in the rest of the UI on first glance. Called fresh from
// setTask() on every task, including the first.
function showTaskIntro(promptText,targetEl){
  var old=document.getElementById('taskIntroOverlay'); if(old)old.remove();
  var overlay=elc('<div class="taskIntro" id="taskIntroOverlay"><div class="tiCard">'+promptText+'</div></div>');
  document.body.appendChild(overlay);
  var card=overlay.querySelector('.tiCard');
  setTimeout(function(){
    var from=card.getBoundingClientRect(), to=targetEl.getBoundingClientRect();
    var sx=to.width/from.width, sy=to.height/from.height;
    var dx=(to.left+to.width/2)-(from.left+from.width/2), dy=(to.top+to.height/2)-(from.top+from.height/2);
    overlay.style.background='rgba(214,236,255,0)';
    card.style.transform='translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')';
    card.style.opacity='0';
    setTimeout(function(){ overlay.remove(); },520);
  },1300);
}
