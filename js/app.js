// ============================================================
//  CAJIGA — LÓGICA PRINCIPAL DEL COTIZADOR
// ============================================================

// ── CALCULADORA ──────────────────────────────────────────────

function calcularComponente(comp, ancho, alto, profundidad, material, fuoFactor) {
  const anchoNum = parseFloat(ancho);
  const altoNum  = parseFloat(alto);
  const profNum  = parseFloat(profundidad);

  // TUBO COLGAR: caso especial (sin material, MO fija, herraje fijo)
  if (comp === 'TUBO COLGAR') {
    const moData = MANO_DE_OBRA['TUBO COLGAR'];
    const costoMO   = moData[2].costoMO; // siempre GRANDE
    const costoHerr = HERRAJES['TUBO COLGAR|TODAS'] || 0;
    const costoBase = costoMO + costoHerr;
    const precioFUO = costoBase * fuoFactor;
    const precioRedondeado = Math.ceil(precioFUO / 50) * 50;
    return { m2: null, tamano: 'GRANDE', costoMat: 0, costoMO, costoHerr, costoBase, precioFUO, precioRedondeado, alertAncho: false, alertAlto: false };
  }

  if (!anchoNum || !altoNum) return null;

  // m² = ancho × alto / 10000
  const m2 = (anchoNum * altoNum) / 10000;

  // Tamaño
  const tamano = m2 <= 0.5 ? 'CHICO' : m2 <= 1 ? 'MEDIANO' : 'GRANDE';

  // Tablas de costos
  const costosTbl = COSTOS_M2[comp];
  const moTbl     = MANO_DE_OBRA[comp];
  if (!costosTbl || !moTbl) return null;

  const cEntry = costosTbl.find(c => c.tamano === tamano);
  const mEntry = moTbl.find(m => m.tamano === tamano);
  if (!cEntry || !mEntry) return null;

  const mat_m2  = cEntry[material] || 0;
  const cons_m2 = cEntry.consumibles || 0;

  // Factor profundidad: (prof/40)^1.8  → aplica si prof es número válido
  const profFactor = (!isNaN(profNum) && profNum > 0) ? Math.pow(profNum / 40, 1.8) : 1;

  // Factores especiales dimensionales
  const alertAncho = anchoNum > 70;
  const alertAlto  = altoNum  > 244;
  const fAncho = alertAncho ? 1.3 : 1;
  const fAlto  = alertAlto  ? 1.3 : 1;

  const costoMat  = (mat_m2 + cons_m2) * m2 * profFactor * fAncho * fAlto;
  const costoMO   = mEntry.costoMO;

  // Herrajes
  const claveProf  = `${comp}|${profNum || 'TODAS'}`;
  const claveTodas = `${comp}|TODAS`;
  const costoHerr  = (HERRAJES[claveProf] > 0 ? HERRAJES[claveProf] : 0) || HERRAJES[claveTodas] || 0;

  const costoBase        = costoMat + costoMO + costoHerr;
  const precioFUO        = costoBase * fuoFactor;
  const precioRedondeado = Math.ceil(precioFUO / 50) * 50;

  return { m2, tamano, costoMat, costoMO, costoHerr, costoBase, precioFUO, precioRedondeado, alertAncho, alertAlto, profFactor: profFactor !== 1 ? profFactor : null };
}

function calcularSubtotal(precioRedondeado, cantidad, descuento) {
  return precioRedondeado * (parseFloat(cantidad) || 1) * (1 - (parseFloat(descuento) || 0) / 100);
}

// ── ESTADO ───────────────────────────────────────────────────

let state = {
  proyecto: {
    nombre:   'Nuevo Proyecto',
    cliente:  '',
    fecha:    new Date().toISOString().split('T')[0],
    numero:   'COT-' + new Date().getFullYear() + '-001',
    elaboro:  '',
    fuo:      'FUO 1.25',
    vigencia: '30 días',
  },
  zonas: [],
  _nextId: 1,
};

function uid() { return 'id_' + (state._nextId++); }

function nuevoComponente(overrides = {}) {
  return {
    id: uid(),
    lado: 'V1',
    componente: 'PISO CON ZOCLO',
    ancho: '',
    alto: '',
    profundidad: 55,
    material: 'NOGAL',
    cantidad: 1,
    descuento: 0,
    notas: '',
    ...overrides,
  };
}

function nuevaZona(nombre = '') {
  return {
    id: uid(),
    nombre: nombre || 'Zona ' + (state.zonas.length + 1),
    componentes: [],
    collapsed: false,
  };
}

// ── PERSISTENCIA ─────────────────────────────────────────────

function guardarLocal() {
  try { localStorage.setItem('cajiga_state', JSON.stringify(state)); } catch(e) {}
}

function cargarLocal() {
  try {
    const raw = localStorage.getItem('cajiga_state');
    if (raw) { state = JSON.parse(raw); }
  } catch(e) {}
}

// ── HELPERS FORMATO ──────────────────────────────────────────

const fmt    = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const _fmtDec = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
function fmtDec(n) { return _fmtDec.format(n); }

function fmtMXN(n) { return fmt.format(n); }
function fmtNum(n, dec = 2) { return (n || 0).toFixed(dec); }

const LADO_COLORS = ['#5B8DEF','#4CAF8C','#C96FBE','#E5944B','#E05555','#8B78E6','#5BC4C0','#C4A84F'];
function ladoColor(lado) {
  const num = parseInt(String(lado).replace(/\D/g, '')) || 1;
  return LADO_COLORS[(num - 1) % LADO_COLORS.length];
}

function getFUO() {
  return FUO_LEVELS.find(f => f.id === state.proyecto.fuo) || FUO_LEVELS[1];
}

// ── RESUMEN GLOBAL ───────────────────────────────────────────

function calcularResumen() {
  const fuo = getFUO();
  let totalSinIVA = 0;
  let totalPiezas = 0;
  state.zonas.forEach(z => {
    z.componentes.forEach(c => {
      const r = calcularComponente(c.componente, c.ancho, c.alto, c.profundidad, c.material, fuo.factor);
      if (r) {
        totalSinIVA += calcularSubtotal(r.precioRedondeado, c.cantidad, c.descuento);
        totalPiezas += parseFloat(c.cantidad) || 1;
      }
    });
  });
  const iva = totalSinIVA * 0.16;
  return { totalSinIVA, iva, total: totalSinIVA + iva, totalPiezas };
}

// ── RENDER ───────────────────────────────────────────────────

function render() {
  renderFUOSelector();
  renderProyectoHeader();
  renderZonas();
  renderResumen();
  guardarLocal();
}

function renderProyectoHeader() {
  const p = state.proyecto;
  document.getElementById('inp-nombre').value   = p.nombre;
  document.getElementById('inp-cliente').value  = p.cliente;
  document.getElementById('inp-fecha').value    = p.fecha;
  document.getElementById('inp-numero').value   = p.numero;
  document.getElementById('inp-elaboro').value  = p.elaboro;
  document.getElementById('inp-vigencia').value = p.vigencia;
  document.getElementById('header-proyecto').textContent = p.nombre || 'Nuevo Proyecto';
  document.getElementById('header-fuo-badge').textContent = getFUO().nombre;
}

function renderFUOSelector() {
  const container = document.getElementById('fuo-cards');
  container.innerHTML = '';
  FUO_LEVELS.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'fuo-card' + (f.id === state.proyecto.fuo ? ' active' : '');
    btn.innerHTML = `<span class="fuo-nombre">${f.nombre}</span><span class="fuo-factor">×${f.factor.toFixed(2)}</span>`;
    btn.title = f.desc;
    btn.onclick = () => { state.proyecto.fuo = f.id; render(); };
    container.appendChild(btn);
  });
}

function renderZonas() {
  const container = document.getElementById('zonas-container');
  container.innerHTML = '';

  if (state.zonas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No hay zonas todavía.</p>
        <p>Haz clic en <strong>+ Nueva Zona</strong> para comenzar.</p>
      </div>`;
    return;
  }

  state.zonas.forEach((zona, zi) => {
    const div = document.createElement('div');
    div.className = 'zona-block';
    div.dataset.id = zona.id;

    div.innerHTML = `
      <div class="zona-header">
        <button class="zona-collapse-btn" onclick="toggleZona('${zona.id}')" title="${zona.collapsed ? 'Expandir' : 'Colapsar'}">
          ${zona.collapsed ? '▶' : '▼'}
        </button>
        <input class="zona-nombre-input" value="${zona.nombre}" placeholder="Nombre de la zona"
          onchange="renombrarZona('${zona.id}', this.value)" />
        <div class="zona-actions">
          <button class="btn-zona-up"   onclick="moverZona('${zona.id}',-1)" title="Subir zona">↑</button>
          <button class="btn-zona-down" onclick="moverZona('${zona.id}', 1)" title="Bajar zona">↓</button>
          <button class="btn-zona-del"  onclick="eliminarZona('${zona.id}')" title="Eliminar zona">✕</button>
        </div>
      </div>
      ${zona.collapsed ? '' : renderZonaBody(zona)}
    `;
    container.appendChild(div);
  });
}

function renderZonaBody(zona) {
  const fuo = getFUO();
  let rowsHTML = '';

  if (zona.componentes.length === 0) {
    rowsHTML = `<tr class="row-empty"><td colspan="10">Sin componentes — haz clic en + Componente</td></tr>`;
  } else {
    zona.componentes.forEach((c, ci) => {
      const r = calcularComponente(c.componente, c.ancho, c.alto, c.profundidad, c.material, fuo.factor);
      const subtotal = r ? calcularSubtotal(r.precioRedondeado, c.cantidad, c.descuento) : 0;
      const tieneProf = COMPONENTES_CON_PROF.includes(c.componente);
      const color = ladoColor(c.lado);

      const alertas = r ? [
        r.alertAncho ? '⚡ Ancho >70cm (×1.3)' : '',
        r.alertAlto  ? '⚡ Alto >244cm (×1.3)' : '',
      ].filter(Boolean).join(' ') : '';

      rowsHTML += `
      <tr class="comp-row" data-zona="${zona.id}" data-comp="${c.id}">
        <td class="td-lado">
          <input class="inp-lado" value="${c.lado}" style="border-color:${color};color:${color}"
            onchange="updateComp('${zona.id}','${c.id}','lado',this.value)" />
        </td>
        <td class="td-comp">
          <select class="sel-comp" onchange="updateComp('${zona.id}','${c.id}','componente',this.value)">
            ${COMPONENTES.map(comp => `<option value="${comp}" ${comp === c.componente ? 'selected' : ''}>${comp}</option>`).join('')}
          </select>
        </td>
        <td class="td-dim">
          ${c.componente === 'TUBO COLGAR'
            ? '<span class="dim-especial">ESPEC.</span>'
            : `<input class="inp-dim" type="number" value="${c.ancho}" placeholder="cm"
                onchange="updateComp('${zona.id}','${c.id}','ancho',this.value)" />`
          }
        </td>
        <td class="td-dim">
          <input class="inp-dim" type="number" value="${c.alto}" placeholder="cm"
            onchange="updateComp('${zona.id}','${c.id}','alto',this.value)" />
        </td>
        <td class="td-prof">
          ${tieneProf
            ? `<select class="sel-prof" onchange="updateComp('${zona.id}','${c.id}','profundidad',this.value)">
                ${PROFUNDIDADES.map(p => `<option value="${p}" ${p == c.profundidad ? 'selected':''}>${p}</option>`).join('')}
               </select>`
            : '<span class="dash">—</span>'
          }
        </td>
        <td class="td-mat">
          <select class="sel-mat" onchange="updateComp('${zona.id}','${c.id}','material',this.value)">
            ${MATERIALES.map(m => `<option value="${m}" ${m === c.material ? 'selected':''}>${m}</option>`).join('')}
          </select>
        </td>
        <td class="td-cant">
          <input class="inp-cant" type="number" value="${c.cantidad}" min="1"
            onchange="updateComp('${zona.id}','${c.id}','cantidad',this.value)" />
        </td>
        <td class="td-precio ${r ? '' : 'sin-datos'}">
          <span class="precio-unit">${r ? fmtMXN(r.precioRedondeado) : '—'}</span>
          ${r && (r.alertAncho || r.alertAlto) ? `<span class="alerta-dim" title="${alertas}">⚡</span>` : ''}
        </td>
        <td class="td-subtotal">
          <span class="subtotal-val">${r ? fmtMXN(subtotal) : '—'}</span>
          ${c.descuento > 0 ? `<span class="dscto-badge">-${c.descuento}%</span>` : ''}
        </td>
        <td class="td-acciones">
          <button class="btn-desglose" onclick="toggleDesglose(this)" title="Ver desglose">⊕</button>
          <button class="btn-dup"  onclick="duplicarComp('${zona.id}','${c.id}')" title="Duplicar">⧉</button>
          <button class="btn-del"  onclick="eliminarComp('${zona.id}','${c.id}')" title="Eliminar">🗑</button>
        </td>
      </tr>
      <tr class="desglose-row" style="display:none">
        <td colspan="10">
          <div class="desglose-panel">
            ${r ? `
            <div class="desglose-grid">
              <div><label>M²</label><span>${r.m2 !== null ? fmtNum(r.m2, 4) : '—'}</span></div>
              <div><label>Tamaño</label><span class="badge-tamano ${r.tamano}">${r.tamano}</span></div>
              <div><label>Costo Material</label><span>${fmtDec(r.costoMat)}</span></div>
              <div><label>Mano de Obra</label><span>${fmtDec(r.costoMO)}</span></div>
              <div><label>Herrajes</label><span>${fmtDec(r.costoHerr)}</span></div>
              <div><label>Costo Base</label><span>${fmtDec(r.costoBase)}</span></div>
              <div><label>Precio × FUO (${getFUO().factor})</label><span>${fmtDec(r.precioFUO)}</span></div>
              <div><label>Precio Redondeado</label><span class="precio-final">${fmtMXN(r.precioRedondeado)}</span></div>
            </div>
            <div class="desglose-extra">
              <label>Descuento %</label>
              <input type="number" value="${c.descuento}" min="0" max="100" step="1"
                onchange="updateComp('${zona.id}','${c.id}','descuento',this.value)" />
              <label>Notas</label>
              <input type="text" value="${c.notas || ''}" placeholder="Observaciones..."
                onchange="updateComp('${zona.id}','${c.id}','notas',this.value)" />
            </div>
            ` : '<p class="sin-datos-msg">Ingresa dimensiones para calcular el precio.</p>'}
          </div>
        </td>
      </tr>`;
    });
  }

  return `
    <div class="zona-body">
      <div class="tabla-wrapper">
        <table class="comp-tabla">
          <thead>
            <tr>
              <th class="th-lado">Lado</th>
              <th class="th-comp">Componente</th>
              <th class="th-dim">Ancho</th>
              <th class="th-dim">Alto</th>
              <th class="th-prof">Prof.</th>
              <th class="th-mat">Material</th>
              <th class="th-cant">Cant.</th>
              <th class="th-precio">Precio/pza</th>
              <th class="th-subtotal">Subtotal</th>
              <th class="th-acc"></th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
      <div class="zona-footer">
        <button class="btn-add-comp" onclick="agregarComponente('${zona.id}')">
          + Componente
        </button>
        <span class="zona-total">${fmtMXN(calcularTotalZona(zona))}</span>
      </div>
    </div>`;
}

function calcularTotalZona(zona) {
  const fuo = getFUO();
  return zona.componentes.reduce((acc, c) => {
    const r = calcularComponente(c.componente, c.ancho, c.alto, c.profundidad, c.material, fuo.factor);
    return acc + (r ? calcularSubtotal(r.precioRedondeado, c.cantidad, c.descuento) : 0);
  }, 0);
}

function renderResumen() {
  const { totalSinIVA, iva, total, totalPiezas } = calcularResumen();
  document.getElementById('res-piezas').textContent   = totalPiezas;
  document.getElementById('res-subtotal').textContent = fmtMXN(totalSinIVA);
  document.getElementById('res-iva').textContent      = fmtMXN(iva);
  document.getElementById('res-total').textContent    = fmtMXN(total);
}

// ── ACCIONES ─────────────────────────────────────────────────

function agregarZona() {
  state.zonas.push(nuevaZona());
  render();
}

function eliminarZona(id) {
  const zona = state.zonas.find(z => z.id === id);
  if (zona && zona.componentes.length > 0) {
    if (!confirm(`¿Eliminar la zona "${zona.nombre}" y sus ${zona.componentes.length} componentes?`)) return;
  }
  state.zonas = state.zonas.filter(z => z.id !== id);
  render();
}

function renombrarZona(id, nombre) {
  const zona = state.zonas.find(z => z.id === id);
  if (zona) { zona.nombre = nombre; guardarLocal(); }
}

function moverZona(id, dir) {
  const idx = state.zonas.findIndex(z => z.id === id);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= state.zonas.length) return;
  [state.zonas[idx], state.zonas[newIdx]] = [state.zonas[newIdx], state.zonas[idx]];
  render();
}

function toggleZona(id) {
  const zona = state.zonas.find(z => z.id === id);
  if (zona) { zona.collapsed = !zona.collapsed; render(); }
}

function agregarComponente(zonaId) {
  const zona = state.zonas.find(z => z.id === zonaId);
  if (!zona) return;
  // Heredar ultimo lado/material
  const ultimo = zona.componentes[zona.componentes.length - 1];
  zona.componentes.push(nuevoComponente({
    lado: ultimo ? ultimo.lado : 'V1',
    material: ultimo ? ultimo.material : 'NOGAL',
  }));
  render();
  // Hacer scroll a la última fila
  setTimeout(() => {
    const rows = document.querySelectorAll(`[data-zona="${zonaId}"] .comp-row`);
    if (rows.length) rows[rows.length-1].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}

function eliminarComp(zonaId, compId) {
  const zona = state.zonas.find(z => z.id === zonaId);
  if (!zona) return;
  zona.componentes = zona.componentes.filter(c => c.id !== compId);
  render();
}

function duplicarComp(zonaId, compId) {
  const zona = state.zonas.find(z => z.id === zonaId);
  if (!zona) return;
  const idx = zona.componentes.findIndex(c => c.id === compId);
  if (idx === -1) return;
  const copia = { ...zona.componentes[idx], id: uid() };
  zona.componentes.splice(idx + 1, 0, copia);
  render();
}

function updateComp(zonaId, compId, field, value) {
  const zona = state.zonas.find(z => z.id === zonaId);
  if (!zona) return;
  const comp = zona.componentes.find(c => c.id === compId);
  if (!comp) return;
  comp[field] = value;
  // Si cambia el componente, resetear profundidad al default
  if (field === 'componente') {
    comp.profundidad = COMPONENTES_CON_PROF.includes(value) ? 55 : '—';
  }
  render();
}

function toggleDesglose(btn) {
  const row = btn.closest('tr');
  const next = row.nextElementSibling;
  if (!next || !next.classList.contains('desglose-row')) return;
  const visible = next.style.display !== 'none';
  next.style.display = visible ? 'none' : 'table-row';
  btn.textContent = visible ? '⊕' : '⊖';
  btn.classList.toggle('active', !visible);
}

function updateProyecto(field, value) {
  state.proyecto[field] = value;
  render();
}

// ── NUEVA COTIZACIÓN ─────────────────────────────────────────

function nuevaCotizacion() {
  if (state.zonas.length > 0 && !confirm('¿Iniciar una nueva cotización? Se perderán los datos actuales.')) return;
  const año = new Date().getFullYear();
  const num = String(Date.now()).slice(-3);
  state = {
    proyecto: { nombre: 'Nuevo Proyecto', cliente: '', fecha: new Date().toISOString().split('T')[0], numero: `COT-${año}-${num}`, elaboro: '', fuo: 'FUO 1.25', vigencia: '30 días' },
    zonas: [],
    _nextId: 1,
  };
  render();
}

// ── EXPORTAR / IMPRIMIR ──────────────────────────────────────

function exportarPDF() {
  const fuo = getFUO();
  const { totalSinIVA, iva, total } = calcularResumen();
  const p = state.proyecto;

  let itemsHTML = '';
  let rowNum = 1;
  state.zonas.forEach(zona => {
    itemsHTML += `<tr class="print-zona-header"><td colspan="6">${zona.nombre.toUpperCase()}</td></tr>`;
    zona.componentes.forEach(c => {
      const r = calcularComponente(c.componente, c.ancho, c.alto, c.profundidad, c.material, fuo.factor);
      if (!r) return;
      const sub = calcularSubtotal(r.precioRedondeado, c.cantidad, c.descuento);
      const desc = `${c.componente} ${c.ancho && c.componente !== 'TUBO COLGAR' ? c.ancho + '×' + c.alto : c.alto ? '×' + c.alto : ''} ${c.material}`;
      itemsHTML += `
        <tr>
          <td>${rowNum++}</td>
          <td>${c.lado || '—'}</td>
          <td>${desc}</td>
          <td style="text-align:center">${c.cantidad}</td>
          <td style="text-align:right">${fmtMXN(r.precioRedondeado)}</td>
          <td style="text-align:right">${fmtMXN(sub)}</td>
        </tr>`;
    });
  });

  const printContent = `
    <html><head><title>Cotización ${p.numero}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size:10pt; color:#222; }
      .print-header { background:#1C1C1E; color:#fff; padding:20px 30px; display:flex; justify-content:space-between; align-items:center; }
      .print-header h1 { font-size:22pt; letter-spacing:3px; }
      .print-header p { font-size:9pt; opacity:0.7; }
      .print-info { padding:20px 30px; display:grid; grid-template-columns:1fr 1fr; gap:6px 30px; border-bottom:2px solid #C9A96E; margin-bottom:16px; }
      .print-info .row { display:flex; gap:8px; }
      .print-info label { font-weight:700; color:#666; font-size:9pt; min-width:80px; }
      table { width:100%; border-collapse:collapse; }
      th { background:#1C1C1E; color:#fff; padding:7px 10px; font-size:9pt; text-align:left; }
      td { padding:6px 10px; border-bottom:1px solid #eee; font-size:9pt; }
      .print-zona-header td { background:#F0EDE8; font-weight:700; font-size:9pt; padding:5px 10px; color:#555; }
      tr:nth-child(even) td { background:#FAFAF8; }
      .totales { padding:20px 30px; display:flex; justify-content:flex-end; }
      .totales-box { width:280px; }
      .tot-row { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee; }
      .tot-row.final { font-size:14pt; font-weight:700; border-top:2px solid #1C1C1E; margin-top:8px; padding-top:8px; }
      .condiciones { padding:20px 30px; border-top:1px solid #ddd; font-size:8pt; color:#666; }
      .condiciones h4 { margin-bottom:6px; color:#333; }
      .firma { display:flex; justify-content:space-between; margin-top:40px; padding:0 30px; }
      .firma-item { width:200px; border-top:1px solid #999; padding-top:6px; text-align:center; font-size:9pt; }
    </style>
    </head><body>
    <div class="print-header">
      <div><h1>CAJIGA</h1><p>Diseño y Fabricación de Closets a la Medida</p></div>
      <div style="text-align:right"><p style="font-size:14pt;font-weight:700">${p.numero}</p><p>${p.fecha}</p></div>
    </div>
    <div class="print-info">
      <div class="row"><label>Cliente:</label><span>${p.cliente || '—'}</span></div>
      <div class="row"><label>Proyecto:</label><span>${p.nombre}</span></div>
      <div class="row"><label>Elaboró:</label><span>${p.elaboro || '—'}</span></div>
      <div class="row"><label>Nivel:</label><span>${fuo.id} — ${fuo.nombre}</span></div>
      <div class="row"><label>Vigencia:</label><span>${p.vigencia}</span></div>
      <div class="row"><label>Fecha:</label><span>${p.fecha}</span></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Lado</th><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio/pza</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemsHTML}</tbody>
    </table>
    <div class="totales">
      <div class="totales-box">
        <div class="tot-row"><span>Subtotal (sin IVA)</span><span>${fmtMXN(totalSinIVA)}</span></div>
        <div class="tot-row"><span>IVA (16%)</span><span>${fmtMXN(iva)}</span></div>
        <div class="tot-row final"><span>TOTAL</span><span>${fmtMXN(total)}</span></div>
      </div>
    </div>
    <div class="condiciones">
      <h4>CONDICIONES</h4>
      <p>• Anticipo del 50% para iniciar fabricación.</p>
      <p>• Saldo del 50% contra entrega e instalación.</p>
      <p>• Tiempo de fabricación: 3 a 5 semanas según complejidad.</p>
      <p>• Garantía de 1 año en herrajes y estructura.</p>
      <p>• Cotización válida por ${p.vigencia} a partir de la fecha de emisión.</p>
    </div>
    <div class="firma">
      <div class="firma-item">Firma y sello: CAJIGA</div>
      <div class="firma-item">Acepto y apruebo: ${p.cliente || '_____________'}</div>
    </div>
    </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(printContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// ── INIT ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  cargarLocal();

  // Si no hay zonas, agregar una por defecto
  if (state.zonas.length === 0) {
    state.zonas.push(nuevaZona('Mi Closet'));
  }

  render();

  // Bindings del formulario de proyecto
  const bindProyecto = (id, field) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => updateProyecto(field, el.value));
  };
  bindProyecto('inp-nombre',   'nombre');
  bindProyecto('inp-cliente',  'cliente');
  bindProyecto('inp-fecha',    'fecha');
  bindProyecto('inp-numero',   'numero');
  bindProyecto('inp-elaboro',  'elaboro');
  bindProyecto('inp-vigencia', 'vigencia');
});
