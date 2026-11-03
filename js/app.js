(() => {
  const cfg = window.SILVIA_CONFIG || {};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
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
  const yes=v=>["si","sí","true","1","yes"].includes(String(v).trim().toLowerCase());
  const money=v=>Number(String(v??"0").replace(/[€\s]/g,"").replace(/\./g,"").replace(",", "."))||0;
  const euro=v=>Number(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
  const safeImg=(url)=>/^https?:\/\//i.test(url||"")?url:"";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function loadCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]").filter(x=>x&&x.name&&Number(x.price)>=0&&Number(x.qty)>0);}catch{return[];}}
  function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch{}}
  function showToast(msg){const el=$("#toast");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}
  function updateCart(){
    $$(".cart-count").forEach(el=>el.textContent=cart.reduce((n,x)=>n+x.qty,0));
    const items=$("#cart-items"); if(!items)return;
    if(!cart.length){items.innerHTML='<p class="empty-cart">Todavía no has añadido productos.</p>';}
    else items.innerHTML=cart.map((x,i)=>`<div class="cart-row"><div class="cart-row-top"><div><strong>${esc(x.name)}</strong><br><small>${euro(x.price)} / unidad</small></div><b>${euro(x.price*x.qty)}</b></div><div class="cart-row-controls"><button data-qty="-1" data-index="${i}" aria-label="Restar">−</button><span>${x.qty}</span><button data-qty="1" data-index="${i}" aria-label="Sumar">+</button><button data-remove="${i}">Eliminar</button></div><textarea data-comment="${i}" rows="2" placeholder="Personalización o comentario…">${esc(x.comment||"")}</textarea></div>`).join("");
    const units=cart.reduce((n,x)=>n+x.qty,0), total=cart.reduce((n,x)=>n+x.qty*x.price,0);
    $("#cart-units").textContent=units; $("#cart-total").textContent=euro(total);
    saveCart();
  }
  function openCart(){ $(".cart-drawer")?.classList.add("open");$(".drawer-backdrop")?.classList.add("open");$(".cart-drawer")?.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
  function closeCart(){ $(".cart-drawer")?.classList.remove("open");$(".drawer-backdrop")?.classList.remove("open");$(".cart-drawer")?.setAttribute("aria-hidden","true");document.body.style.overflow="";}
  function addProduct(p){if(!p||p.stock<=0){showToast("Este producto no está disponible ahora mismo.");return;}const unitPrice=p.offer&&p.offerPrice!==undefined?p.offerPrice:p.price;const found=cart.find(x=>x.name===p.name);if(found){if(found.qty<p.stock)found.qty++;else showToast("Has alcanzado el stock disponible.");}else cart.push({name:p.name,price:unitPrice,qty:1,comment:""});updateCart();showToast("Añadido a tu carrito ♡");}
  function openProduct(p,isProduct=false){modalProduct=isProduct?p:null;$("#modal-title").textContent=p.name;$("#modal-description").textContent=p.detail||p.description||"";$("#modal-price").textContent=p.price!==undefined?euro(p.offer&&p.offerPrice!==undefined?p.offerPrice:p.price):"";$("#modal-add").style.display=isProduct?"inline-flex":"none";const im=$("#modal-image");im.src=safeImg(p.largeImage||p.image);im.alt=p.name;im.style.display=im.src?"block":"none";$("#product-modal")?.classList.add("open");$("#product-modal")?.setAttribute("aria-hidden","false");}
  function closeProduct(){$("#product-modal")?.classList.remove("open");$("#product-modal")?.setAttribute("aria-hidden","true");}
  function card(p,kind,index){
    const image=safeImg(p.image), desc=p.description||p.desc||"";
    const price=kind==="product"?`<span class="price">${p.offer?`<del>${euro(p.price)}</del> `:""}${euro(p.offerPrice??p.price)}</span>`:"";
    const stockNote=kind==="product"&&p.stock<=0?'<span class="price">Agotado</span>':price;
    return `<article class="item-card ${kind==="gallery"?"gallery-card":""}" ${kind==="gallery"?`data-gallery="${index}"`:""}>
      ${image?`<img class="item-image" src="${esc(image)}" alt="${esc(p.name||p.title)}" loading="lazy">`:`<div class="item-image placeholder" aria-hidden="true">✿</div>`}
      <div class="item-content"><h3>${esc(p.name||p.title)}</h3><p>${esc(desc)}</p><div class="item-bottom">${stockNote}${kind==="product"?`<button class="mini-btn" data-add="${index}" ${p.stock<=0?"disabled":""}>Añadir ♡</button>`:`<button class="mini-btn" data-detail="${kind}" data-index="${index}">Ver detalle</button>`}</div></div></article>`;
  }
  async function loadProducts(){
    const rows=await getSheet("CATALOGO");
    products=rows.filter(r=>val(r,0)).map(r=>({name:val(r,0),description:val(r,1),price:money(val(r,2)),image:val(r,3),stock:val(r,4)===""?99:Math.max(0,parseInt(val(r,4),10)||0),detail:val(r,5),largeImage:val(r,6),featured:yes(val(r,7)),offer:yes(val(r,8)),offerPrice:val(r,9)===""?undefined:money(val(r,9))}));
    const grid=$("#products-grid");if(grid)grid.innerHTML=products.length?products.map((p,i)=>card(p,"product",i)).join():'<p class="loading-note">Todavía no hay productos disponibles.</p>';
  }
  async function loadSpecialties(){
    const rows=await getSheet("ESPECIALIDADES");
    specialties=rows.filter(r=>val(r,0)).map(r=>({name:val(r,0),description:val(r,1),image:val(r,2),detail:val(r,3),largeImage:val(r,4),featured:yes(val(r,5))}));
    const grid=$("#specialties-grid");if(grid)grid.innerHTML=specialties.length?specialties.map((p,i)=>card(p,"specialty",i)).join():'<p class="loading-note">Próximamente descubrirás aquí mis especialidades.</p>';
  }
  async function loadGallery(){
    const rows=await getSheet("TRABAJOS");
    gallery=rows.filter(r=>val(r,0)).map(r=>({name:val(r,0),image:val(r,1),description:val(r,2),detail:val(r,3),largeImage:val(r,4)}));
    const grid=$("#gallery-grid");if(grid)grid.innerHTML=gallery.length?gallery.map((p,i)=>card(p,"gallery",i)).join():'<p class="loading-note">Todavía no hay trabajos publicados.</p>';
  }
  function showLoadError(id){const el=$(id);if(el)el.innerHTML='<p class="loading-note">No se ha podido cargar el contenido. Inténtalo de nuevo más tarde.</p>';}
  function initMenu(){const btn=$(".menu-toggle"),nav=$(".main-nav");btn?.addEventListener("click",()=>{const open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",String(open));});}
  async function sendContact(e){
    e.preventDefault();const form=e.currentTarget,status=$("#contact-status"),button=form.querySelector("button[type=submit]");
    const data=new FormData(form),name=String(data.get("name")||"").trim(),email=String(data.get("email")||"").trim(),message=String(data.get("message")||"").trim();
    button.disabled=true;button.textContent="Preparando correo…";
    // No se muestra un falso éxito: se abre el cliente de correo para que el usuario envíe la consulta.
    const subject=encodeURIComponent("Consulta desde la web de Silvia Crea");
    const body=encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\n${message}`);
    window.location.href=`mailto:${cfg.email}?subject=${subject}&body=${body}`;
    status.textContent="Se ha abierto tu aplicación de correo para que puedas enviar el mensaje.";
    button.disabled=false;button.textContent="Enviar consulta";
  }
  async function sendOrder(){
    if(!cart.length){showToast("Tu carrito está vacío.");return;}
    const name=$("#customer-name")?.value.trim(),email=$("#customer-email")?.value.trim(),phone=$("#customer-phone")?.value.trim(),address=$("#customer-address")?.value.trim(),comment=$("#customer-comment")?.value.trim();
    if(!name||!email||!phone||!address){showToast("Completa los datos obligatorios.");return;}
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
      cart=[];updateCart();closeCart();$("#order-form")?.reset();
      alert("Tu solicitud se ha registrado correctamente. Silvia se pondrá en contacto contigo para confirmar los detalles y el pago por Bizum.");
    }catch(err){
      alert("No hemos podido verificar el registro de tu solicitud. No se ha vaciado tu carrito. Puedes intentarlo de nuevo más tarde o escribir a "+cfg.email+". Detalle: "+err.message);
    }finally{btn.disabled=false;btn.textContent="Enviar solicitud de pedido";}
  }
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-open-cart]"))openCart();
    if(e.target.closest("[data-close-cart]"))closeCart();
    const add=e.target.closest("[data-add]");if(add)addProduct(products[Number(add.dataset.add)]);
    const detail=e.target.closest("[data-detail]");if(detail){const i=Number(detail.dataset.index);openProduct(detail.dataset.detail==="specialty"?specialties[i]:gallery[i]);}
    const gal=e.target.closest("[data-gallery]");if(gal)openProduct(gallery[Number(gal.dataset.gallery)]);
    const qty=e.target.closest("[data-qty]");if(qty){const item=cart[Number(qty.dataset.index)];item.qty=Math.max(1,item.qty+Number(qty.dataset.qty));const p=products.find(x=>x.name===item.name);if(p)item.qty=Math.min(item.qty,p.stock);updateCart();}
    const rem=e.target.closest("[data-remove]");if(rem){cart.splice(Number(rem.dataset.remove),1);updateCart();}
    if(e.target.closest("[data-close-modal]")||e.target.id==="product-modal")closeProduct();
  });
  document.addEventListener("input",e=>{const el=e.target.closest("[data-comment]");if(el){cart[Number(el.dataset.comment)].comment=el.value;saveCart();}});
  $("#modal-add")?.addEventListener("click",()=>{if(modalProduct){const p=products.find(x=>x.name===modalProduct.name);if(p)addProduct(p);closeProduct();}});
  $("#continue-order")?.addEventListener("click",()=>{
    if(!cart.length){showToast("Añade algún producto primero.");return;}
    const drawer=$(".cart-drawer");drawer.innerHTML=`<div class="drawer-head"><div><span class="eyebrow">Un último paso</span><h2>Datos de tu solicitud</h2></div><button type="button" class="icon-button" data-close-cart aria-label="Cerrar">×</button></div>
    <form id="order-form" class="form-card" style="overflow:auto;margin-top:15px;padding:20px"><label>Nombre *<input id="customer-name" required autocomplete="name"></label><label>Correo electrónico *<input id="customer-email" type="email" required autocomplete="email"></label><label>Teléfono *<input id="customer-phone" required inputmode="tel" autocomplete="tel"></label><label>Dirección de envío *<textarea id="customer-address" rows="2" required autocomplete="street-address"></textarea></label><label>Comentario general<textarea id="customer-comment" rows="3"></textarea></label><p class="small-note">El importe es estimado y no incluye gastos de envío. No se realizará ningún pago ahora; Silvia confirmará los detalles y el importe final.</p><button class="btn btn-primary full-width" id="submit-order" type="submit">Enviar solicitud de pedido</button></form>`;
    $("#order-form").addEventListener("submit",e=>{e.preventDefault();sendOrder();});
  });
  $("#contact-form")?.addEventListener("submit",sendContact);
  $("#year").textContent=new Date().getFullYear();initMenu();updateCart();
  if($("#products-grid"))loadProducts().catch(()=>showLoadError("#products-grid"));
  if($("#specialties-grid"))loadSpecialties().catch(()=>showLoadError("#specialties-grid"));
  if($("#gallery-grid"))loadGallery().catch(()=>showLoadError("#gallery-grid"));
})();
