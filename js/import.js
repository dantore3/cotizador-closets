// ============================================================
//  CAJIGA — IMPORTAR LISTA DE COMPONENTES
//  Acepta archivos .txt y .pdf, o texto pegado directamente
// ============================================================

// ── MODAL ────────────────────────────────────────────────────

function abrirImportModal() {
  document.getElementById('import-modal').classList.add('active');
  resetImportModal();
}

function cerrarImportModal() {
  document.getElementById('import-modal').classList.remove('active');
}

function resetImportModal() {
  document.getElementById('import-step1').style.display = '';
  document.getElementById('import-step2').style.display = 'none';
  document.getElementById('import-file-input').value = '';
  document.getElementById('import-text-area').value = '';
  document.getElementById('import-filename').textContent = '';
  document.getElementById('import-drop-zone').classList.remove('has-file', 'drag-over');
  document.getElementById('import-status').textContent = '';
  document.getElementById('import-confirm-btn').disabled = true;
  _importData = [];
}

// ── DRAG & DROP ───────────────────────────────────────────────

function initImportDropZone() {
  const dropZone  = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('import-file-input');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivoImport(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) procesarArchivoImport(fileInput.files[0]);
  });
}

// ── PROCESAMIENTO DE ARCHIVO ──────────────────────────────────

async function procesarArchivoImport(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('import-filename').textContent = '📄 ' + file.name;
  document.getElementById('import-drop-zone').classList.add('has-file');

  if (ext === 'pdf') {
    await procesarPDF(file);
  } else {
    const reader = new FileReader();
    reader.onload = e => mostrarPreviewImport(e.target.result);
    reader.readAsText(file, 'UTF-8');
  }
}

async function procesarPDF(file) {
  const status = document.getElementById('import-status');
  status.textContent = '⏳ Extrayendo texto del PDF…';

  try {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('No se pudo cargar PDF.js'));
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Agrupa items por líneas usando su posición Y
      const byY = {};
      content.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!byY[y]) byY[y] = [];
        byY[y].push(item.str);
      });
      Object.keys(byY).sort((a, b) => b - a).forEach(y => {
        fullText += byY[y].join(' ') + '\n';
      });
    }
    status.textContent = '';
    mostrarPreviewImport(fullText);
  } catch (err) {
    status.textContent = '❌ Error al leer PDF: ' + err.message;
  }
}

function procesarTextoDirecto() {
  const texto = document.getElementById('import-text-area').value.trim();
  if (!texto) {
    document.getElementById('import-status').textContent = '⚠️ Escribe o pega texto primero.';
    return;
  }
  document.getElementById('import-status').textContent = '';
  mostrarPreviewImport(texto);
}

// ── PARSER ───────────────────────────────────────────────────

// Normaliza quitando acentos, a mayúsculas, limpia caracteres raros
function normalizar(str) {
  return str
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\sXx×\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Componentes ordenados por longitud desc (evita match parcial)
const COMP_SORTED = [...COMPONENTES].sort((a, b) => b.length - a.length);
const COMP_SORTED_NORM = COMP_SORTED.map(c => ({ orig: c, norm: normalizar(c) }));

function encontrarComponente(lineaNorm) {
  for (const { orig, norm } of COMP_SORTED_NORM) {
    if (lineaNorm.includes(norm)) return orig;
  }
  return null;
}

function extraerDimensiones(lineaNorm) {
  // Busca NUMxNUM, NUM x NUM, NUM×NUM
  const m = lineaNorm.match(/(\d+(?:\.\d+)?)\s*[Xx×]\s*(\d+(?:\.\d+)?)/);
  if (m) return { ancho: m[1], alto: m[2] };
  return { ancho: '', alto: '' };
}

function extraerMaterial(lineaNorm) {
  if (lineaNorm.includes('HUANACAXTLE')) return 'HUANACAXTLE';
  if (lineaNorm.includes('ENCINO'))      return 'ENCINO';
  if (lineaNorm.includes('NOGAL'))       return 'NOGAL';
  return 'NOGAL';
}

function extraerLado(lineaNorm) {
  const m = lineaNorm.match(/\bV\s*(\d+)\b/);
  if (m) return 'V' + m[1];
  const l = lineaNorm.match(/\bL\s*(\d+)\b/);
  if (l) return 'L' + l[1];
  return 'V1';
}

function extraerProfundidad(lineaNorm, componente) {
  if (!COMPONENTES_CON_PROF.includes(componente)) return 55;
  // Busca los valores válidos en orden descendente
  for (const p of [60, 55, 50, 45, 40, 35]) {
    if (new RegExp('\\b' + p + '\\b').test(lineaNorm)) return p;
  }
  return 55;
}

function extraerCantidad(lineaNorm, ancho, alto, profundidad) {
  let limpia = lineaNorm;
  // Quitar la dimensión NxN
  limpia = limpia.replace(/\d+(?:\.\d+)?\s*[Xx×]\s*\d+(?:\.\d+)?/, '');
  // Quitar profundidad
  if (profundidad) limpia = limpia.replace(new RegExp('\\b' + profundidad + '\\b'), '');
  // Quitar números grandes (años, coordenadas, etc.)
  limpia = limpia.replace(/\b\d{3,}\b/g, '');
  // Quitar los valores de lado (V1 → quita el 1 del contexto)
  limpia = limpia.replace(/\bV\s*\d+\b/g, '').replace(/\bL\s*\d+\b/g, '');

  const nums = [...limpia.matchAll(/\b(\d{1,2})\b/g)]
    .map(m => parseInt(m[1]))
    .filter(n => n >= 1 && n <= 50);

  return nums.length > 0 ? nums[nums.length - 1] : 1;
}

// Una línea es encabezado de zona si:
// – no tiene componente conocido
// – no tiene dimensiones NxN
// – tiene al menos 3 letras seguidas
function esZonaHeader(lineaNorm, tieneComponente, tieneDims) {
  if (tieneComponente || tieneDims) return false;
  if (!/[A-Z]{3,}/.test(lineaNorm)) return false;
  if (/^\d+$/.test(lineaNorm.trim())) return false;
  // Evitar líneas muy cortas o que sean solo un número
  if (lineaNorm.trim().length < 3) return false;
  return true;
}

function parsearTexto(texto) {
  const lineas = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 1);

  const grupos = [];
  let zonaActual = null;

  lineas.forEach(linea => {
    const lineaNorm = normalizar(linea);
    if (!lineaNorm) return;

    const componente = encontrarComponente(lineaNorm);
    const dims       = extraerDimensiones(lineaNorm);
    const tieneDims  = !!(dims.ancho && dims.alto);

    if (esZonaHeader(lineaNorm, !!componente, tieneDims)) {
      zonaActual = { nombre: linea.trim(), items: [] };
      grupos.push(zonaActual);
    } else if (componente) {
      if (!zonaActual) {
        zonaActual = { nombre: 'Zona importada', items: [] };
        grupos.push(zonaActual);
      }
      const material    = extraerMaterial(lineaNorm);
      const lado        = extraerLado(lineaNorm);
      const profundidad = extraerProfundidad(lineaNorm, componente);
      const cantidad    = extraerCantidad(lineaNorm, dims.ancho, dims.alto, profundidad);

      zonaActual.items.push({
        _id:           Math.random().toString(36).slice(2),
        componente,
        ancho:         dims.ancho,
        alto:          dims.alto,
        profundidad,
        material,
        lado,
        cantidad,
        notas:         '',
        selected:      true,
        lineaOriginal: linea.trim(),
      });
    }
    // Líneas sin componente ni zona → ignorar
  });

  return grupos;
}

// ── PREVIEW ──────────────────────────────────────────────────

let _importData = [];

function mostrarPreviewImport(texto) {
  _importData = parsearTexto(texto);

  document.getElementById('import-step1').style.display = 'none';
  document.getElementById('import-step2').style.display = '';

  const total = _importData.reduce((a, g) => a + g.items.length, 0);

  if (total === 0) {
    document.getElementById('import-preview-container').innerHTML = `
      <div class="import-empty">
        <div class="import-empty-icon">🔍</div>
        <p><strong>No se encontraron componentes.</strong></p>
        <p>Asegúrate de que el texto incluya nombres como:<br>
        <code>PISO CON ZOCLO</code>, <code>ENTREPAÑO</code>, <code>CAJÓN</code>, <code>PARAL 2 VISTAS</code>…<br>
        con sus dimensiones: <code>60x240</code></p>
        <p style="margin-top:12px">
          <button class="btn-back-import" onclick="resetImportModal()">← Intentar de nuevo</button>
        </p>
      </div>`;
    document.getElementById('import-confirm-btn').disabled = true;
    document.getElementById('import-count').textContent = '0 componentes encontrados';
    return;
  }

  document.getElementById('import-confirm-btn').disabled = false;
  actualizarCountImport();
  renderPreviewTabla();
}

function actualizarCountImport() {
  const n = _importData.reduce((a, g) => a + g.items.filter(i => i.selected).length, 0);
  const zonas = _importData.filter(g => g.items.some(i => i.selected)).length;
  document.getElementById('import-count').textContent =
    `${n} componente${n !== 1 ? 's' : ''} en ${zonas} zona${zonas !== 1 ? 's' : ''}`;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderPreviewTabla() {
  const container = document.getElementById('import-preview-container');
  let html = '<div class="import-groups">';

  _importData.forEach((grupo, gi) => {
    html += `
      <div class="import-group">
        <div class="import-group-header">
          <span class="import-group-icon">📁</span>
          <input class="import-zona-name" value="${escHtml(grupo.nombre)}"
            onchange="cambiarNombreZona(${gi}, this.value)" placeholder="Nombre de zona" />
          <span class="import-group-count">${grupo.items.length} comp.</span>
          <button class="import-sel-all"  onclick="seleccionarTodosGrupo(${gi},true)">✓ Todos</button>
          <button class="import-sel-none" onclick="seleccionarTodosGrupo(${gi},false)">✕ Ninguno</button>
        </div>
        <div class="import-table-wrap">
        <table class="import-preview-table">
          <thead><tr>
            <th class="th-chk">✓</th>
            <th>Componente</th>
            <th>Ancho</th>
            <th>Alto</th>
            <th>Prof.</th>
            <th>Material</th>
            <th>Lado</th>
            <th>Cant.</th>
          </tr></thead>
          <tbody>`;

    grupo.items.forEach((item, ii) => {
      const warn = !item.ancho && item.componente !== 'TUBO COLGAR' ? 'import-warn' : '';
      html += `
        <tr class="import-row ${item.selected ? '' : 'deselected'} ${warn}"
            data-gi="${gi}" data-ii="${ii}">
          <td class="td-chk">
            <input type="checkbox" ${item.selected ? 'checked' : ''}
              onchange="toggleImportItem(${gi},${ii},this.checked)" />
          </td>
          <td>
            <select class="import-sel-comp"
              onchange="updateImportItem(${gi},${ii},'componente',this.value)">
              ${COMPONENTES.map(c =>
                `<option value="${c}" ${c === item.componente ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </td>
          <td><input class="import-inp" type="number" value="${escHtml(item.ancho)}" placeholder="cm"
            onchange="updateImportItem(${gi},${ii},'ancho',this.value)" /></td>
          <td><input class="import-inp" type="number" value="${escHtml(item.alto)}" placeholder="cm"
            onchange="updateImportItem(${gi},${ii},'alto',this.value)" /></td>
          <td>
            ${COMPONENTES_CON_PROF.includes(item.componente)
              ? `<select class="import-sel-prof"
                    onchange="updateImportItem(${gi},${ii},'profundidad',this.value)">
                  ${PROFUNDIDADES.map(p =>
                    `<option value="${p}" ${p == item.profundidad ? 'selected':''}>${p}</option>`
                  ).join('')}
                 </select>`
              : '<span class="import-dash">—</span>'}
          </td>
          <td>
            <select class="import-sel-mat"
              onchange="updateImportItem(${gi},${ii},'material',this.value)">
              ${MATERIALES.map(m =>
                `<option value="${m}" ${m === item.material ? 'selected':''}>${m}</option>`
              ).join('')}
            </select>
          </td>
          <td><input class="import-inp import-inp-sm" type="text" value="${escHtml(item.lado)}"
            onchange="updateImportItem(${gi},${ii},'lado',this.value)" /></td>
          <td><input class="import-inp import-inp-sm" type="number" value="${item.cantidad}" min="1"
            onchange="updateImportItem(${gi},${ii},'cantidad',this.value)" /></td>
        </tr>`;

      // Mini hint de la línea original
      if (item.lineaOriginal) {
        html += `<tr class="import-original-row ${item.selected ? '' : 'deselected'}">
          <td></td><td colspan="7" class="import-original-text">↳ "${escHtml(item.lineaOriginal)}"</td>
        </tr>`;
      }
    });

    html += `</tbody></table></div></div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ── ACCIONES DE LA TABLA ──────────────────────────────────────

function cambiarNombreZona(gi, nombre) {
  _importData[gi].nombre = nombre;
}

function toggleImportItem(gi, ii, checked) {
  _importData[gi].items[ii].selected = checked;
  const rows = document.querySelectorAll(
    `tr[data-gi="${gi}"][data-ii="${ii}"], tr[data-gi="${gi}"][data-ii="${ii}"] + tr.import-original-row`
  );
  // Buscar las dos filas del item
  const allRows = document.querySelectorAll(`tr.import-row[data-gi="${gi}"][data-ii="${ii}"]`);
  allRows.forEach(r => r.classList.toggle('deselected', !checked));
  // También la fila original siguiente
  allRows.forEach(r => {
    const next = r.nextElementSibling;
    if (next && next.classList.contains('import-original-row')) {
      next.classList.toggle('deselected', !checked);
    }
  });
  actualizarCountImport();
}

function seleccionarTodosGrupo(gi, val) {
  _importData[gi].items.forEach((item, ii) => {
    item.selected = val;
    document.querySelectorAll(`tr.import-row[data-gi="${gi}"][data-ii="${ii}"]`)
      .forEach(r => {
        r.classList.toggle('deselected', !val);
        const cb = r.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = val;
        const next = r.nextElementSibling;
        if (next && next.classList.contains('import-original-row')) {
          next.classList.toggle('deselected', !val);
        }
      });
  });
  actualizarCountImport();
}

function updateImportItem(gi, ii, field, value) {
  _importData[gi].items[ii][field] = value;
  if (field === 'componente') renderPreviewTabla(); // necesita re-render para mostrar/ocultar prof
}

// ── CONFIRMAR IMPORTACIÓN ─────────────────────────────────────

function confirmarImport() {
  let importados = 0;

  _importData.forEach(grupo => {
    const items = grupo.items.filter(i => i.selected);
    if (items.length === 0) return;

    const zona = nuevaZona(grupo.nombre);
    items.forEach(item => {
      zona.componentes.push(nuevoComponente({
        componente:  item.componente,
        ancho:       item.ancho || '',
        alto:        item.alto  || '',
        profundidad: COMPONENTES_CON_PROF.includes(item.componente)
                       ? parseInt(item.profundidad) || 55
                       : '—',
        material:    item.material || 'NOGAL',
        lado:        item.lado     || 'V1',
        cantidad:    parseInt(item.cantidad) || 1,
      }));
      importados++;
    });
    state.zonas.push(zona);
  });

  cerrarImportModal();
  render();
  mostrarToastImport(`✓ ${importados} componente${importados !== 1 ? 's' : ''} importado${importados !== 1 ? 's' : ''} en ${_importData.filter(g => g.items.some(i => i.selected)).length} zona${_importData.filter(g => g.items.some(i => i.selected)).length !== 1 ? 's' : ''}`);
}

// ── TOAST ─────────────────────────────────────────────────────

function mostrarToastImport(msg) {
  let toast = document.getElementById('import-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'import-toast';
    toast.className = 'import-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── INIT ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initImportDropZone();

  // Cerrar con ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarImportModal();
  });

  // Cerrar al hacer clic en el backdrop
  document.getElementById('import-modal').addEventListener('click', e => {
    if (e.target.id === 'import-modal') cerrarImportModal();
  });
});
