(() => {
// --- SISTEMA DE MEMORIA AVANZADO PARA GOOGLE SITES ---
const pageMap = {'home': 'index.html', 'shop': 'tienda.html', 'gallery': 'galeria.html', 'about': 'sobre-mi.html', 'orders': 'encargos.html', 'contact': 'contacto.html'};
const actualPage = document.body.dataset.page;
const currentHtml = pageMap[actualPage] || 'index.html';
const savedHtml = sessionStorage.getItem('silviacrea_current_page');

let isBackForward = false;
if (window.performance) {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === "back_forward") isBackForward = true;
    else if (performance.navigation && performance.navigation.type === 2) isBackForward = true;
}

if (isBackForward) {
    // Si usó el botón Atrás/Adelante, aceptamos la página y actualizamos memoria
    sessionStorage.setItem('silviacrea_current_page', currentHtml);
} else if (savedHtml && savedHtml !== currentHtml && currentHtml === 'index.html') {
    // Si Google Sites nos ha devuelto a la fuerza a index.html (por un F5), volvemos a donde estábamos
    window.location.replace(savedHtml);
    return; // Detenemos la ejecución de esta página porque ya nos vamos
} else {
    // Navegación normal
    sessionStorage.setItem('silviacrea_current_page', currentHtml);
}
// -----------------------------------------------------

const cfg = window.SILVIA_CONFIG || {};   
const $ = (s, root=document) => root.querySelector(s); const $$ = (s, root=document) => [...root.querySelectorAll(s)];   
const CART_KEY = "silviacrea_cart_v2";   
let products = [], specialties = [], gallery = [], cart = loadCart(), modalProduct = null, toastTimer;   

function csvUrl(sheet){return `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;}   
function parseCSV(text){   
const rows=[]; let row=[], cell="", quoted=false;   
for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];   
if(c==='"'&&quoted&&n==='"'){cell+='"';i++;}   
else if(c==='"'){quoted=!quoted;}   
else if(c===','&&!quoted){row.push(cell);cell="";}   
else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);row=[];cell="";}   
else cell+=c;   
}   
row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);   
return rows;   
}   
async function getSheet(name){   
const res=await fetch(csvUrl(name)); if(!res.ok) throw new Error("No se pudo leer "+name);   
const rows=parseCSV(await res.text()); return rows.slice(1);   
}   
const val=(r,i)=>String(r[i]??"").trim();   
const yes=v=>["si","sí","true","1","yes","verdadero","x","destacado"].includes(String(v).trim().toLowerCase());   
const money=v=>Number(String(v??"0").replace(/[€\s]/g,"").replace(/\./g,"").replace(",", "."))||0;   
const euro=v=>Number(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});   
const safeImg=(url)=>/^https?:\/\//i.test(url||"")?url:"";   
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));   
function loadCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]").filter(x=>x&&x.name&&Number(x.price)>=0&&Number(x.qty)>0);}catch{return[];}}   
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch{}}   
function showToast(msg){const el=$("#toast");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);} function updateCart(){ $$(".cart-count").forEach(el=>el.textContent=cart.reduce((n,x)=>n+x.qty,0));   
const items=$("#cart-items"); if(!items)return;   
if(!cart.length){items.innerHTML='<p class="empty-cart">Todavía no has añadido productos.</p>';}   
else items.innerHTML=cart.map((x,i)=>`<div class="cart-row"><div class="cart-row-top"><div><strong>${esc(x.name)}</strong><br><small>${euro(x.price)} / unidad</small></div><b>${euro(x.price*x.qty)}</b></div><div class="cart-row-controls"><button data-qty="-1" data-index="${i}" aria-label="Restar">−</button><span>${x.qty}</span><button data-qty="1" data-index="${i}" aria-label="Sumar">+</button><button data-remove="${i}">Eliminar</button></div><textarea data-comment="${i}" rows="2" placeholder="Personalización o comentario…">${esc(x.comment||"")}</textarea></div>`).join("");   
const units=cart.reduce((n,x)=>n+x.qty,0), total=cart.reduce((n,x)=>n+x.qty*x.price,0);   
$("#cart-units").textContent=units; $("#cart-total").textContent=euro(total);   
saveCart();  
 const emptyBtn = $("#empty-cart-btn");  
 if(emptyBtn) emptyBtn.style.display = cart.length ? "block" : "none";  
 }   
function openCart(){ $(".cart-drawer")?.classList.add("open");$(".drawer-backdrop")?.classList.add("open");$(".cart-drawer")?.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}   
function closeCart(){ $(".cart-drawer")?.classList.remove("open");$(".drawer-backdrop")?.classList.remove("open");$(".cart-drawer")?.setAttribute("aria-hidden","true");document.body.style.overflow="";}   
function addProduct(p){if(!p||p.stock<=0){showToast("Este producto no está disponible ahora mismo.");return;}const unitPrice=p.offer&&p.offerPrice!==undefined?p.offerPrice:p.price;const found=cart.find(x=>x.name===p.name);if(found){if(found.qty<p.stock)found.qty++;else showToast("Has alcanzado el stock disponible.");}else cart.push({name:p.name,price:unitPrice,qty:1,comment:""});updateCart();showToast("Añadido a tu carrito ♡");}   

function openProduct(p,isProduct=false,idx=0){   
  modalProduct=isProduct?p:null;   
  $("#modal-title").textContent=p.name||p.title||"";   
  $("#modal-description").textContent=p.detail||p.description||p.desc||"";   
  const priceEl=$("#modal-price");   
  if(isProduct){   
  priceEl.innerHTML=p.offer&&p.offerPrice!==undefined?`<div class="old-price-box"><del>${euro(p.price)}</del></div><div class="current-price-box"><strong>${euro(p.offerPrice)}</strong></div>`: `<div class="old-price-box"></div><div class="current-price-box"><strong>${euro(p.price)}</strong></div>`;   
  priceEl.style.display="flex";   
  $("#modal-add").style.display=p.stock>0?"inline-flex":"none";   
  }else{priceEl.textContent="";priceEl.style.display="none";$("#modal-add").style.display="none";}   
  
  const im=$("#modal-image"), ph=$("#modal-placeholder"), src=safeImg(p.largeImage||p.image);
  if(src){im.src=src;im.alt=p.name||p.title||"";im.style.display="block";if(ph)ph.style.display="none";}
  else{im.src="";im.style.display="none";if(ph)ph.style.display="flex";}
  
  const m=$(".product-modal");
  if(m){m.classList.remove("theme-pink","theme-lilac");m.classList.add(idx%2===0?"theme-pink":"theme-lilac");}

  $("#product-modal")?.classList.add("open");$("#product-modal")?.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";   
} 

function closeProduct(){$("#product-modal")?.classList.remove("open");$("#product-modal")?.setAttribute("aria-hidden","true");document.body.style.overflow="";}   
function prepareSlider(el,count){   
if(!el)return;   
el.classList.remove("has-slider","is-centered");   
el.classList.add(count>3?"has-slider":"is-centered");   
el.setAttribute("aria-label",count>3?"Carrusel de elementos; desplázate horizontalmente para ver más":"Elementos destacados");   
  
if(count>3 && !el.parentElement.classList.contains("slider-wrapper")){  
 const wrapper = document.createElement("div");  
 wrapper.className = "slider-wrapper";  
 el.parentNode.insertBefore(wrapper, el);  
 wrapper.appendChild(el);  
   
const btnLeft = document.createElement("button");  
 btnLeft.className = "slider-btn slider-btn-left";  
 btnLeft.innerHTML = "❮";  
 btnLeft.setAttribute("aria-label", "Anterior");  
   
const btnRight = document.createElement("button");  
 btnRight.className = "slider-btn slider-btn-right";  
 btnRight.innerHTML = "❯";  
 btnRight.setAttribute("aria-label", "Siguiente");  
   
wrapper.appendChild(btnLeft);  
 wrapper.appendChild(btnRight);  
   
btnLeft.addEventListener("click", () => {  
 const card = el.querySelector(".item-card");  
 if(card) el.scrollBy({left: -(card.offsetWidth + 24) * 2, behavior: "smooth"});  
 });  
 btnRight.addEventListener("click", () => {  
 const card = el.querySelector(".item-card");  
 if(card) el.scrollBy({left: (card.offsetWidth + 24) * 2, behavior: "smooth"});  
 });  
 }  
 }   
function card(p,kind,index){   
const image=safeImg(p.image), desc=p.description||p.desc||"";   
const isProduct=kind==="product";   
let metaHtml="";   
if(isProduct){   
  const hasOffer = p.offer&&p.offerPrice!==undefined;
  const lowStock = p.stock>0&&p.stock<=5;
  const isOut = p.stock<=0;
  
  metaHtml = `<div class="item-meta">
      <div class="price-wrapper">
          <div class="old-price-box">${(hasOffer && !isOut) ? `<del>${euro(p.price)}</del>` : ''}</div>
          <div class="current-price-box">${isOut ? '<span class="stock-out">Agotado</span>' : `<strong>${euro(hasOffer?p.offerPrice:p.price)}</strong>`}</div>
      </div>
      <div class="stock-box">${(lowStock && !isOut) ? '<span class="low-stock">Pocas unidades</span>' : ''}</div>
  </div>`;
}   
const featured=p.featured?'<span class="featured-label">Destacado</span>':'';   
const offer=isProduct&&p.offer?'<span class="offer-label">Oferta</span>':'';   
const classes=["item-card",kind==="gallery"?"gallery-card":"",p.featured?"is-featured":"",isProduct&&p.offer?"is-offer":""].filter(Boolean).join(" ");   
  
return `<article class="${classes}" data-card-kind="${kind}" data-index="${index}" tabindex="0" role="group" aria-label="${esc(p.name||p.title)}. Pulsa para ver el detalle">   
${featured}${offer}   
${image?`<div class="image-wrapper"><img class="item-image" src="${esc(image)}" alt="${esc(p.name||p.title)}" loading="lazy" draggable="false"></div>`:`<div class="image-wrapper"><div class="item-image placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" width="42" height="42" stroke="#b69bd2" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div></div>`}   
<div class="item-content"><h3>${esc(p.name||p.title)}</h3><p>${esc(desc)}</p>   
${metaHtml}
<div class="item-actions"><button class="mini-btn detail-button" type="button" data-detail-card="${kind}" data-index="${index}">Ver detalle</button>${isProduct?`<button class="mini-btn add-button" type="button" data-add="${index}" ${p.stock<=0?"disabled":""}>Añadir carrito</button>`:''}</div>   
</div></article>`;   
}   
async function loadProducts(){   
const rows=await getSheet("CATALOGO");   
products=rows.filter(r=>val(r,0)).map(r=>({name:val(r,0),description:val(r,1),price:money(val(r,2)),image:val(r,3),stock:val(r,4)===""?99:Math.max(0,parseInt(val(r,4),10)||0),detail:val(r,5),largeImage:val(r,6),featured:yes(val(r,7)),offer:yes(val(r,8)),offerPrice:val(r,9)===""?undefined:money(val(r,9))}));   
products.sort((a,b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));  
 const grid=$("#products-grid");if(grid){grid.innerHTML=products.length?products.map((p,i)=>card(p,"product",i)).join(""):'<p class="loading-note">Todavía no hay productos disponibles.</p>';prepareSlider(grid,products.length);}   
}   
async function loadSpecialties(){   
const rows=await getSheet("ESPECIALIDADES");   
specialties=rows.filter(r=>val(r,0)).map(r=>({name:val(r,0),description:val(r,1),image:val(r,2),detail:val(r,3),largeImage:val(r,4),featured:yes(val(r,5))}));   
specialties.sort((a,b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));  
 const grid=$("#specialties-grid");if(grid){grid.innerHTML=specialties.length?specialties.map((p,i)=>card(p,"specialty",i)).join(""):'<p class="loading-note">Próximamente descubrirás aquí mis especialidades.</p>';prepareSlider(grid,specialties.length);}   
}   
async function loadGallery(){   
const rows=await getSheet("TRABAJOS");   
gallery=rows.filter(r=>val(r,0)).map(r=>({name:val(r,0),image:val(r,1),description:val(r,2),detail:val(r,3),largeImage:val(r,4)}));   
const grid=$("#gallery-grid");if(grid){grid.innerHTML=gallery.length?gallery.map((p,i)=>card(p,"gallery",i)).join(""):'<p class="loading-note">Todavía no hay trabajos publicados.</p>';prepareSlider(grid,gallery.length);}   
}   
function showLoadError(id){const el=$(id);if(el)el.innerHTML='<p class="loading-note">No se ha podido cargar el contenido. Inténtalo de nuevo más tarde.</p>';}   
function initMenu(){  
 const btn=$(".menu-toggle"),nav=$(".main-nav");  
 btn?.addEventListener("click",()=>{const open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",String(open));});  
   
 const cartTrigger = $(".cart-trigger");  
 if(cartTrigger && cartTrigger.innerHTML.includes("♡")) {  
 cartTrigger.innerHTML = cartTrigger.innerHTML.replace("♡", "✿");  
 }  
   
 const drawerHead = $(".drawer-head");  
 if(drawerHead && !$("#empty-cart-btn")) {  
 const emptyBtn = document.createElement("button");  
 emptyBtn.id = "empty-cart-btn";  
 emptyBtn.className = "text-button empty-btn-style";  
 emptyBtn.innerHTML = "Vaciar";  
 emptyBtn.type = "button";  
 drawerHead.insertBefore(emptyBtn, drawerHead.querySelector(".icon-button"));  
   
emptyBtn.addEventListener("click", () => {  
 if(cart.length > 0) {  
 const backdrop = document.createElement("div");  
 backdrop.className = "modal-backdrop open";  
 backdrop.style.zIndex = "200";  
 backdrop.innerHTML = `<div class="confirm-modal" role="dialog" aria-modal="true" style="background:var(--blue-pastel-soft); border-color:#c3d7f0;">  
 <h3>¿Vaciar carrito?</h3>  
 <p>Se eliminarán todos los productos que has añadido.</p>  
 <div class="confirm-btns">  
 <button class="btn" id="btn-cancel-empty" style="background:var(--pink-soft); color:var(--lilac-dark); border:1px solid #f0d5e1;">Cancelar</button>  
 <button class="btn" id="btn-confirm-empty" style="background:var(--lilac-card); color:var(--pink-dark); border:1px solid #dfceeb;">Sí, vaciar</button>  
 </div>  
 </div>`;  
 document.body.appendChild(backdrop);  
   
document.getElementById("btn-cancel-empty").onclick = () => backdrop.remove();  
 document.getElementById("btn-confirm-empty").onclick = () => {  
 cart = [];  
 updateCart();  
 backdrop.remove();  
 };  
 }  
 });  
 }  
 }   
async function sendContact(e){   
e.preventDefault();const form=e.currentTarget,status=$("#contact-status"),button=form.querySelector("button[type=submit]");   
const data=new FormData(form),name=String(data.get("name")||"").trim(),email=String(data.get("email")||"").trim(),message=String(data.get("message")||"").trim();   
button.disabled=true;button.textContent="Preparando correo…";   
const subject=encodeURIComponent("Consulta desde la web de Silvia Crea");   
const body=encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\n${message}`);   
window.location.href=`mailto:${cfg.email}?subject=${subject}&body=${body}`;   
status.textContent="Se ha abierto tu aplicación de correo para que puedas enviar el mensaje.";   
button.disabled=false;button.textContent="Enviar consulta";   
}

function showCustomAlert(title, message) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop open";
    backdrop.style.zIndex = "200";
    backdrop.innerHTML = `<div class="confirm-modal" role="dialog" aria-modal="true" style="background:var(--blue-pastel-soft); border-color:#c3d7f0;">
        <h3 style="color:var(--lilac-dark); font-size: 24px;">${title}</h3>
        <p style="color:var(--muted);">${message}</p>
        <div class="confirm-btns">
            <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()">Aceptar</button>
        </div>
    </div>`;
    document.body.appendChild(backdrop);
}

async function sendOrder(){   
if(!cart.length){showToast("Tu carrito está vacío.");return;}   
const name=$("#customer-name")?.value.trim(),email=$("#customer-email")?.value.trim(),phone=$("#customer-phone")?.value.trim(),address=$("#customer-address")?.value.trim(),comment=$("#customer-comment")?.value.trim();   
if(!name||!email||!phone||!address){showToast("Completa los datos obligatorios.");return;}   
  
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  
 if(!emailRegex.test(email)){showToast("Por favor, introduce un correo electrónico válido.");return;}  
 const cleanPhone = phone.replace(/\D/g,"");  
 if(cleanPhone.length !== 9){showToast("El número de teléfono debe tener exactamente 9 dígitos.");return;}  
   
const total=cart.reduce((n,x)=>n+x.price*x.qty,0);   
const productsText=cart.map(x=>`- ${x.qty}x ${x.name} | Personalización: ${x.comment||"Sin detalles"}`).join("\n");   
const payload={Cliente:name,Email:email,Telefono:phone.replace(/\D/g,""),Direccion:address,Productos:productsText,Total:`${total.toFixed(2).replace(".",",")} €`,Comentario:comment};   
const btn=$("#submit-order");btn.disabled=true;btn.textContent="Enviando solicitud…";   
try{   
if(!cfg.appsScriptUrl)throw new Error("La conexión de pedidos no está configurada.");   
const response=await fetch(cfg.appsScriptUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow"});   
if(!response.ok)throw new Error("El servidor no ha aceptado la solicitud.");   
const result=await response.json();   
if(result.status!=="success")throw new Error(result.message||"No se ha podido registrar el pedido.");   
cart=[];updateCart();closeCart();$("#order-form")?.reset();$("#back-to-cart")?.click();   
showCustomAlert("¡Solicitud enviada!", "Tu solicitud se ha registrado correctamente. Silvia se pondrá en contacto contigo para confirmar los detalles y el pago por Bizum.");   
}catch(err){   
showCustomAlert("Hubo un problema", "No hemos podido verificar el registro de tu solicitud. No se ha vaciado tu carrito. Puedes intentarlo de nuevo más tarde o escribir a "+cfg.email+". Detalle: "+err.message);   
}finally{btn.disabled=false;btn.textContent="Enviar solicitud de pedido";}   
}   
  
document.addEventListener("click",e=>{   
// Guardar página para el sistema de memoria
const link = e.target.closest("a");
if (link) {
    const href = link.getAttribute("href");
    if (href && href.includes(".html") && !href.startsWith("http")) {
        sessionStorage.setItem("silviacrea_current_page", href);
    }
}

if(e.target.closest("[data-open-cart]"))openCart();   
if(e.target.closest("[data-close-cart]"))closeCart();   
const add=e.target.closest("[data-add]");if(add){e.stopPropagation();addProduct(products[Number(add.dataset.add)]);return;}   
const detail=e.target.closest("[data-detail-card]");   
if(detail){const i=Number(detail.dataset.index),kind=detail.dataset.detailCard;openProduct(kind==="product"?products[i]:kind==="specialty"?specialties[i]:gallery[i],kind==="product", i);return;}   
  
const cardEl=e.target.closest("[data-card-kind]");   
if(cardEl&&!e.target.closest("button")){  
 const i=Number(cardEl.dataset.index),kind=cardEl.dataset.cardKind;  
 openProduct(kind==="product"?products[i]:kind==="specialty"?specialties[i]:gallery[i],kind==="product", i);  
 return;  
 }   

if(e.target.closest("#modal-img-wrapper")) {
   const img = $("#modal-image");
   if(img && img.src && img.style.display !== "none") {
       const fsImg = $("#fs-modal-image");
       fsImg.src = img.src;
       const fsModal = $("#fs-modal");
       const pModal = $(".product-modal");
       const fsContent = $(".fs-modal-content");
       fsContent.className = "fs-modal-content"; 
       if(pModal.classList.contains("theme-pink")) fsContent.classList.add("theme-pink");
       if(pModal.classList.contains("theme-lilac")) fsContent.classList.add("theme-lilac");
       fsModal.classList.add("open");
       fsModal.setAttribute("aria-hidden", "false");
   }
}

if(e.target.closest("[data-close-fs]") || e.target.id === "fs-modal") {
   $("#fs-modal")?.classList.remove("open");
   $("#fs-modal")?.setAttribute("aria-hidden", "true");
}
  
const qty=e.target.closest("[data-qty]");if(qty){const item=cart[Number(qty.dataset.index)];item.qty=Math.max(1,item.qty+Number(qty.dataset.qty));const p=products.find(x=>x.name===item.name);if(p)item.qty=Math.min(item.qty,p.stock);updateCart();}   
const rem=e.target.closest("[data-remove]");if(rem){cart.splice(Number(rem.dataset.remove),1);updateCart();}   
if(e.target.closest("[data-close-modal]")||e.target.id==="product-modal")closeProduct();   
});   
document.addEventListener("keydown",e=>{const c=e.target.closest("[data-card-kind]");if(c&&(e.key==="Enter"||e.key===" ")){e.preventDefault();const i=Number(c.dataset.index),kind=c.dataset.cardKind;openProduct(kind==="product"?products[i]:kind==="specialty"?specialties[i]:gallery[i],kind==="product",i);}});   
document.addEventListener("input",e=>{const el=e.target.closest("[data-comment]");if(el){cart[Number(el.dataset.comment)].comment=el.value;saveCart();}});   
$("#modal-add")?.addEventListener("click",()=>{if(modalProduct){const p=products.find(x=>x.name===modalProduct.name);if(p)addProduct(p);closeProduct();}});   
$("#continue-order")?.addEventListener("click",()=>{   
if(!cart.length){showToast("Añade algún producto primero.");return;}   
let checkoutView = $("#checkout-view");
if(!checkoutView){
    checkoutView = document.createElement("div");
    checkoutView.id = "checkout-view";
    checkoutView.style.display = "none";
    checkoutView.style.flex = "1";
    checkoutView.style.overflow = "auto";
    checkoutView.innerHTML = `
        <div style="margin-bottom:15px;"><button type="button" class="text-button" id="back-to-cart" style="font-size:14.5px;">← Volver al carrito</button></div>
        <form id="order-form" class="form-card" style="padding:20px; background:var(--pink-soft); border-color:#f0d5e1;">
            <label>Nombre *<input id="customer-name" required autocomplete="name" style="background:var(--lilac-card); border-color:#dfceeb;"></label>
            <label>Correo electrónico *<input id="customer-email" type="email" required autocomplete="email" style="background:var(--lilac-card); border-color:#dfceeb;"></label>
            <label>Teléfono *<input id="customer-phone" required inputmode="numeric" pattern="[0-9]{9}" maxlength="9" oninput="this.value=this.value.replace(/[^0-9]/g,'')" title="El teléfono debe tener exactamente 9 dígitos" autocomplete="tel" style="background:var(--lilac-card); border-color:#dfceeb;"></label>
            <label>Dirección de envío *<textarea id="customer-address" rows="2" required autocomplete="street-address" style="background:var(--lilac-card); border-color:#dfceeb;"></textarea></label>
            <label>Comentario general<textarea id="customer-comment" rows="3" style="background:var(--lilac-card); border-color:#dfceeb;"></textarea></label>
            <p class="small-note">El importe mostrado es estimado y no incluye los gastos de envío. En esta etapa no se realizará ningún cargo; Silvia contactará contigo para confirmar los detalles y el importe definitivo.<br><br><strong style="color:var(--pink-dark)">Nota importante:</strong> Actualmente solo realizamos envíos dentro de la Península.</p>
            <button class="btn btn-primary full-width" id="submit-order" type="submit">Enviar solicitud de pedido</button>
        </form>
    `;
    $(".cart-drawer").appendChild(checkoutView);
    $("#order-form").addEventListener("submit",e=>{e.preventDefault();sendOrder();});
    $("#back-to-cart").addEventListener("click",()=>{
        $("#checkout-view").style.display = "none";
        $("#cart-items").style.display = "";
        $(".cart-summary").style.display = "block";
        $(".drawer-head h2").textContent = "Mi carrito";
        $(".drawer-head .eyebrow").textContent = "Tus favoritos";
    });
}
$("#cart-items").style.display = "none";
$(".cart-summary").style.display = "none";
checkoutView.style.display = "block";
$(".drawer-head h2").textContent = "Datos de tu solicitud";
$(".drawer-head .eyebrow").textContent = "Un último paso";
});   
$("#contact-form")?.addEventListener("submit",sendContact);   
$("#year").textContent=new Date().getFullYear();initMenu();updateCart();   
if($("#products-grid"))loadProducts().catch(()=>showLoadError("#products-grid"));   
if($("#specialties-grid"))loadSpecialties().catch(()=>showLoadError("#specialties-grid"));   
if($("#gallery-grid"))loadGallery().catch(()=>showLoadError("#gallery-grid"));   
})();