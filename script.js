/* ================= DATOS ================= */

const CLAVE_ADMIN = "015";

const STORAGE_JUGADORES = "rakionJugadores";
const STORAGE_HISTORIAL = "rakionHistorial";
const STORAGE_REGISTROS = "rakionRegistrosVersus";
const STORAGE_PARTIDA_ACTUAL = "rakionPartidaActual";
const STORAGE_MAPAS_RESULTADO = "rakionMapasResultado";

const MAPAS_BASE = [
  "AnotherTomb",
  "Lost Temple",
  "Templo Serpiente",
  "Tumba del Rey"
];

let jugadores = JSON.parse(localStorage.getItem(STORAGE_JUGADORES)) || [];
let historial = JSON.parse(localStorage.getItem(STORAGE_HISTORIAL)) || [];
let registrosVersus = JSON.parse(localStorage.getItem(STORAGE_REGISTROS)) || [];
let partidaActual = JSON.parse(localStorage.getItem(STORAGE_PARTIDA_ACTUAL)) || null;
let mapasResultado = JSON.parse(localStorage.getItem(STORAGE_MAPAS_RESULTADO)) || null;
let adminActivo = sessionStorage.getItem("rakionAdminActivo") === "true";
let wheelRotation = 0;

/* Convierte jugadores antiguos */
jugadores = jugadores.map(j => {
  if (typeof j === "string") {
    return {
      nombre: j,
      activo: false,
      bombo: ""
    };
  }

  return {
    nombre: j.nombre || "",
    activo: Boolean(j.activo),
    bombo: j.bombo || ""
  };
}).filter(j => j.nombre.trim() !== "");

/* Convierte historiales antiguos */
historial = historial.map(h => ({
  id: h.id || Date.now() + Math.random(),
  fecha: h.fecha || "",
  rojo: h.rojo || h.A || [],
  azul: h.azul || h.B || [],
  ganador: h.ganador || null,
  mapa: h.mapa || "",
  manual: Boolean(h.manual)
}));

/* Convierte registros antiguos */
registrosVersus = registrosVersus.map(r => ({
  id: r.id || Date.now() + Math.random(),
  sorteoId: r.sorteoId || r.id || Date.now() + Math.random(),
  fecha: r.fecha || "",
  ganador: r.ganador || null,
  ganadores: Array.isArray(r.ganadores) ? r.ganadores : [],
  perdedores: Array.isArray(r.perdedores) ? r.perdedores : [],
  empatados: Array.isArray(r.empatados) ? r.empatados : [],
  rojo: Array.isArray(r.rojo) ? r.rojo : [],
  azul: Array.isArray(r.azul) ? r.azul : [],
  mapa: r.mapa || "",
  manual: Boolean(r.manual)
}));

/* ================= ELEMENTOS ================= */

const panelBombos = document.getElementById("panelBombos");
const equipoA = document.getElementById("equipoA");
const equipoB = document.getElementById("equipoB");
const ruleta = document.getElementById("ruleta");
const seccionRuleta = document.getElementById("seccionRuleta");
const ruletaContainer = document.querySelector(".ruleta-container");
const wheelSvg = document.getElementById("wheelSvg");
const wheelGroup = document.getElementById("wheelGroup");
const wheelCenterText = document.getElementById("wheelCenterText");

const nuevoJugador = document.getElementById("nuevoJugador");
const btnAgregar = document.getElementById("btnAgregar");
const resultadoMapas = document.getElementById("resultadoMapas");
const historialDiv = document.getElementById("historial");
const partidaActualDiv = document.getElementById("partidaActual");
const rankingJugadoresDiv = document.getElementById("rankingJugadores");
const rankingMapasDiv = document.getElementById("rankingMapas");
const historialVersusDiv = document.getElementById("historialVersus");
const btnGanoRojo = document.getElementById("btnGanoRojo");
const btnGanoAzul = document.getElementById("btnGanoAzul");
const btnEmpate = document.getElementById("btnEmpate");
const mapaVersus = document.getElementById("mapaVersus");
const manualRojoNombres = document.getElementById("manualRojoNombres");
const manualAzulNombres = document.getElementById("manualAzulNombres");
const manualResultado = document.getElementById("manualResultado");
const manualMapa = document.getElementById("manualMapa");
const manualFecha = document.getElementById("manualFecha");
const btnRegistrarManual = document.getElementById("btnRegistrarManual");
const btnExportarBackup = document.getElementById("btnExportarBackup");
const inputImportarBackup = document.getElementById("inputImportarBackup");
const btnImportarBackup = document.getElementById("btnImportarBackup");
const claveAdmin = document.getElementById("claveAdmin");
const btnEntrarAdmin = document.getElementById("btnEntrarAdmin");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");
const estadoAdmin = document.getElementById("estadoAdmin");

/* ================= GUARDAR ================= */

function guardar() {
  localStorage.setItem(STORAGE_JUGADORES, JSON.stringify(jugadores));
  localStorage.setItem(STORAGE_HISTORIAL, JSON.stringify(historial));
  localStorage.setItem(STORAGE_REGISTROS, JSON.stringify(registrosVersus));
  localStorage.setItem(STORAGE_PARTIDA_ACTUAL, JSON.stringify(partidaActual));
  localStorage.setItem(STORAGE_MAPAS_RESULTADO, JSON.stringify(mapasResultado));
}

/* ================= ADMIN ================= */

function requiereAdmin() {
  if (adminActivo) return true;

  alert("Necesitas ingresar la clave de administrador para hacer esta acción.");
  claveAdmin.focus();
  return false;
}

function setAdminActivo(valor) {
  adminActivo = valor;
  sessionStorage.setItem("rakionAdminActivo", valor ? "true" : "false");
  renderAdmin();
}

function renderAdmin() {
  if (adminActivo) {
    estadoAdmin.className = "estado-admin activo";
    estadoAdmin.textContent = "Modo administrador activo: puedes registrar resultados y modificar datos.";
  } else {
    estadoAdmin.className = "estado-admin bloqueado";
    estadoAdmin.textContent = "Modo visitante: puedes sortear y ver resultados, pero no registrar ranking.";
  }

  const controlesAdmin = [
    btnAgregar,
    document.getElementById("btnBorrarJugadores"),
    btnGanoRojo,
    btnGanoAzul,
    btnEmpate,
    btnRegistrarManual,
    document.getElementById("btnBorrarRegistros"),
    document.getElementById("btnBorrarHistorial"),
    btnImportarBackup
  ].filter(Boolean);

  controlesAdmin.forEach(control => {
    control.classList.toggle("bloqueado-admin", !adminActivo);
  });
}

btnEntrarAdmin.addEventListener("click", () => {
  if (claveAdmin.value === CLAVE_ADMIN) {
    claveAdmin.value = "";
    setAdminActivo(true);
    alert("Administrador activado.");
  } else {
    alert("Clave incorrecta.");
  }
});

btnSalirAdmin.addEventListener("click", () => setAdminActivo(false));

claveAdmin.addEventListener("keydown", e => {
  if (e.key === "Enter") btnEntrarAdmin.click();
});

/* ================= UTILIDADES ================= */

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollARuleta() {
  seccionRuleta.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function limpiarColorGanador() {
  ruleta.classList.remove("texto-ganador");
  wheelGroup.querySelectorAll(".winner").forEach(el => {
    el.classList.remove("winner");
  });
}

function marcarColorGanador() {
  ruleta.classList.add("texto-ganador");
}

function escribirRuletaNormal(texto) {
  limpiarColorGanador();
  ruleta.innerText = texto;
}

function activarRuleta() {
  limpiarColorGanador();
  ruletaContainer.classList.add("girando");
}

function detenerRuleta() {
  ruletaContainer.classList.remove("girando");
}

function mezclar(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function porcentaje(victorias, partidas) {
  if (partidas === 0) return "0%";
  return Math.round((victorias / partidas) * 100) + "%";
}

function normalizarNombre(nombre) {
  return nombre.trim().replace(/\s+/g, " ");
}

function parsearNombres(texto) {
  const nombres = texto
    .split(/[\n,;]+/)
    .map(normalizarNombre)
    .filter(Boolean);

  return [...new Set(nombres)];
}

function fechaManualTexto(valor) {
  if (!valor) return new Date().toLocaleString("es-PE");

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return new Date().toLocaleString("es-PE");
  }

  return fecha.toLocaleString("es-PE");
}

function agregarJugadoresFaltantes(nombres) {
  nombres.forEach(nombre => {
    const existe = jugadores.some(j =>
      j.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (!existe) {
      jugadores.push({
        nombre,
        activo: false,
        bombo: ""
      });
    }
  });
}

function limpiarFormularioManual() {
  manualRojoNombres.value = "";
  manualAzulNombres.value = "";
  manualResultado.value = "rojo";
  manualMapa.value = "";
  manualFecha.value = "";
}

function obtenerMapasParaSelect() {
  const set = new Set(MAPAS_BASE);

  if (mapasResultado?.primero) set.add(mapasResultado.primero);
  if (mapasResultado?.segundo) set.add(mapasResultado.segundo);

  registrosVersus.forEach(r => {
    if (r.mapa) set.add(r.mapa);
  });

  return [...set];
}

function renderMapSelects() {
  const mapas = obtenerMapasParaSelect();

  const opciones = `<option value="">Sin mapa / no especificado</option>` +
    mapas.map(m => `<option value="${m}">${m}</option>`).join("");

  const anteriorVersus = mapaVersus.value;
  const anteriorManual = manualMapa.value;

  mapaVersus.innerHTML = opciones;
  manualMapa.innerHTML = opciones;

  if (anteriorVersus) mapaVersus.value = anteriorVersus;
  if (anteriorManual) manualMapa.value = anteriorManual;

  if (!mapaVersus.value && mapasResultado?.primero) {
    mapaVersus.value = mapasResultado.primero;
  }
}

/* ================= RULETA SVG ================= */

const SVG_NS = "http://www.w3.org/2000/svg";
const RADIO_RULETA = 220;
const ANGULO_PUNTERO = -90;
const COLORES_RULETA = [
  "#2563eb",
  "#dc2626",
  "#ff9f1c",
  "#16a34a",
  "#7c3aed",
  "#0891b2",
  "#e11d48",
  "#facc15"
];

function crearSvg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

function puntoPolar(anguloGrados, radio) {
  const rad = anguloGrados * Math.PI / 180;

  return {
    x: Math.cos(rad) * radio,
    y: Math.sin(rad) * radio
  };
}

function pathSector(inicio, fin, radio) {
  const p1 = puntoPolar(inicio, radio);
  const p2 = puntoPolar(fin, radio);
  const grande = fin - inicio > 180 ? 1 : 0;

  return [
    `M 0 0`,
    `L ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
    `A ${radio} ${radio} 0 ${grande} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
    `Z`
  ].join(" ");
}

function partirTexto(texto, maxCaracteres = 12) {
  const limpio = String(texto).trim();

  if (limpio.length <= maxCaracteres) return [limpio];

  const palabras = limpio.split(/\s+/);
  const lineas = [];
  let actual = "";

  palabras.forEach(palabra => {
    const prueba = actual ? `${actual} ${palabra}` : palabra;

    if (prueba.length <= maxCaracteres) {
      actual = prueba;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  });

  if (actual) lineas.push(actual);

  if (lineas.length === 1 && lineas[0].length > maxCaracteres) {
    return [
      lineas[0].slice(0, maxCaracteres),
      lineas[0].slice(maxCaracteres)
    ];
  }

  return lineas.slice(0, 2);
}

function configurarRuletaVisual(opciones = ["Jugador 1", "Jugador 2"], ganadorIndex = null) {
  const lista = opciones.length ? opciones : ["Sin datos"];
  const cantidad = lista.length;
  const sector = 360 / cantidad;

  wheelGroup.innerHTML = "";
  wheelCenterText.textContent = cantidad === 2 ? "VS" : "🎲";

  lista.forEach((opcion, index) => {
    const inicio = ANGULO_PUNTERO + index * sector;
    const fin = inicio + sector;
    const centro = inicio + sector / 2;
    const color = COLORES_RULETA[index % COLORES_RULETA.length];

    const path = crearSvg("path", {
      d: pathSector(inicio, fin, RADIO_RULETA),
      fill: color,
      class: "wheel-sector" + (ganadorIndex === index ? " winner" : ""),
      "data-index": index
    });

    wheelGroup.appendChild(path);

    const pos = puntoPolar(centro, cantidad === 2 ? RADIO_RULETA * 0.48 : RADIO_RULETA * 0.58);
    const texto = crearSvg("text", {
      x: pos.x.toFixed(2),
      y: pos.y.toFixed(2),
      class: "wheel-label" + (String(opcion).length > 12 ? " small" : "") + (String(opcion).length > 20 ? " tiny" : "") + (ganadorIndex === index ? " winner" : ""),
      "data-index": index
    });

    const lineas = partirTexto(opcion, cantidad === 2 ? 10 : 12);
    const dyInicial = lineas.length === 1 ? 0 : -10;

    lineas.forEach((linea, i) => {
      const tspan = crearSvg("tspan", {
        x: pos.x.toFixed(2),
        dy: i === 0 ? dyInicial : 22
      });

      tspan.textContent = linea.toUpperCase();
      texto.appendChild(tspan);
    });

    wheelGroup.appendChild(texto);
  });
}

function marcarGanadorVisual(indexGanador) {
  wheelCenterText.textContent = "🏆";

  const sector = wheelGroup.querySelector(`.wheel-sector[data-index="${indexGanador}"]`);
  const label = wheelGroup.querySelector(`.wheel-label[data-index="${indexGanador}"]`);

  if (sector) sector.classList.add("winner");
  if (label) label.classList.add("winner");
}

function esperarTransicionRuleta(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ruletaPro(lista, duracion = 5700) {
  const opciones = [...lista];

  if (opciones.length === 0) return "";

  configurarRuletaVisual(opciones);

  if (opciones.length === 1) {
    ruleta.innerText = opciones[0];
    marcarColorGanador();
    marcarGanadorVisual(0);
    return opciones[0];
  }

  const indexGanador = Math.floor(Math.random() * opciones.length);
  const ganador = opciones[indexGanador];

  const sector = 360 / opciones.length;
  const centroSector = ANGULO_PUNTERO + indexGanador * sector + sector / 2;

  /*
    La flecha está fija arriba en -90 grados.
    Elegimos un punto dentro del sector ganador, no exactamente en el borde.
  */
  const margenSeguro = sector * 0.24;
  const ajusteDentroSector = (Math.random() * 2 - 1) * margenSeguro;
  const puntoGanador = centroSector + ajusteDentroSector;

  const rotacionActual = ((wheelRotation % 360) + 360) % 360;
  const rotacionDeseada = ((ANGULO_PUNTERO - puntoGanador) % 360 + 360) % 360;
  const diferencia = (rotacionDeseada - rotacionActual + 360) % 360;
  const vueltas = 4 + Math.floor(Math.random() * 3);

  wheelRotation += vueltas * 360 + diferencia;

  wheelGroup.style.transition = `transform ${duracion}ms cubic-bezier(0.12, 0.72, 0.10, 1)`;

  activarRuleta();

  let alternador = 0;
  const intervaloTexto = setInterval(() => {
    ruleta.innerText = opciones[alternador % opciones.length];
    alternador++;
  }, 180);

  requestAnimationFrame(() => {
    wheelGroup.style.transform = `rotate(${wheelRotation}deg)`;
  });

  await esperarTransicionRuleta(duracion + 80);

  clearInterval(intervaloTexto);
  detenerRuleta();

  ruleta.innerText = ganador;
  marcarColorGanador();
  marcarGanadorVisual(indexGanador);

  return ganador;
}

/* ================= RENDER MAPAS ================= */

function renderResultadoMapas() {
  if (!mapasResultado) {
    resultadoMapas.innerHTML = "Todavía no se sortearon mapas.";
    return;
  }

  resultadoMapas.innerHTML = `
    <div class="mapa-ganador">🥇 1ER LUGAR: <strong>${mapasResultado.primero}</strong></div>
    <div class="mapa-ganador">🥈 2DO LUGAR: <strong>${mapasResultado.segundo}</strong></div>
  `;
}

/* ================= RENDER BOMBOS ================= */

function crearTokenJugador(jugador, index) {
  const token = document.createElement("div");
  token.className = "player-token" + (jugador.activo ? "" : " no-juega");
  token.draggable = true;
  token.dataset.index = index;

  token.innerHTML = `
    <input type="checkbox" class="token-activo" ${jugador.activo ? "checked" : ""} title="Juega">
    <span class="nombre">${jugador.nombre}</span>
    <button class="btnEliminar" title="Eliminar">❌</button>
    <select class="bombo-mobile" title="Cambiar bombo">
      <option value="" ${jugador.bombo === "" ? "selected" : ""}>Sin bombo</option>
      ${[1,2,3,4,5,6,7,8].map(n =>
        `<option value="${n}" ${jugador.bombo === String(n) ? "selected" : ""}>Bombo ${n}</option>`
      ).join("")}
    </select>
  `;

  token.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", String(index));
  });

  token.querySelector(".token-activo").addEventListener("change", e => {
    jugadores[index].activo = e.target.checked;
    guardar();
    renderBombos();
  });

  token.querySelector(".bombo-mobile").addEventListener("change", e => {
    jugadores[index].bombo = e.target.value;
    guardar();
    renderBombos();
  });

  token.querySelector(".btnEliminar").addEventListener("click", () => {
    if (!requiereAdmin()) return;

    const confirmar = confirm(`¿Eliminar a ${jugadores[index].nombre}?`);

    if (!confirmar) return;

    jugadores.splice(index, 1);
    guardar();
    renderBombos();
    renderRanking();
    renderRankingMapas();
  });

  return token;
}

function crearPanelBombo(titulo, bomboValor) {
  const panel = document.createElement("div");
  panel.className = "bombo-panel";
  panel.dataset.bombo = bomboValor;

  const jugadoresPanel = jugadores
    .map((j, index) => ({...j, index}))
    .filter(j => j.bombo === bomboValor);

  const activos = jugadoresPanel.filter(j => j.activo).length;

  panel.innerHTML = `
    <h3>${titulo} <span class="bombo-contador">${activos} activos / ${jugadoresPanel.length} total</span></h3>
  `;

  panel.addEventListener("dragover", e => {
    e.preventDefault();
    panel.classList.add("drag-over");
  });

  panel.addEventListener("dragleave", () => {
    panel.classList.remove("drag-over");
  });

  panel.addEventListener("drop", e => {
    e.preventDefault();
    panel.classList.remove("drag-over");

    const index = Number(e.dataTransfer.getData("text/plain"));

    if (Number.isNaN(index) || !jugadores[index]) return;

    jugadores[index].bombo = bomboValor;
    guardar();
    renderBombos();
  });

  jugadoresPanel.forEach(j => {
    panel.appendChild(crearTokenJugador(jugadores[j.index], j.index));
  });

  return panel;
}

function renderBombos() {
  panelBombos.innerHTML = "";

  panelBombos.appendChild(crearPanelBombo("📌 Sin bombo", ""));

  for (let i = 1; i <= 8; i++) {
    panelBombos.appendChild(crearPanelBombo(`🎯 Bombo ${i}`, String(i)));
  }
}

/* ================= AGREGAR JUGADOR ================= */

function agregarJugador() {
  if (!requiereAdmin()) return;

  const nombre = nuevoJugador.value.trim();

  if (nombre === "") {
    alert("Escribe el nombre del jugador");
    return;
  }

  const existe = jugadores.some(j =>
    j.nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (existe) {
    alert("Ese jugador ya existe");
    return;
  }

  jugadores.push({
    nombre,
    activo: true,
    bombo: ""
  });

  nuevoJugador.value = "";
  guardar();
  renderBombos();
  renderRanking();
  renderRankingMapas();
}

btnAgregar.addEventListener("click", agregarJugador);

nuevoJugador.addEventListener("keydown", e => {
  if (e.key === "Enter") agregarJugador();
});

/* ================= ACCIONES JUGADORES ================= */

document.getElementById("btnSeleccionarTodos").addEventListener("click", () => {
  jugadores.forEach(j => j.activo = true);
  guardar();
  renderBombos();
});

document.getElementById("btnLimpiarSeleccion").addEventListener("click", () => {
  jugadores.forEach(j => j.activo = false);
  guardar();
  renderBombos();
});

document.getElementById("btnBorrarJugadores").addEventListener("click", () => {
  if (!requiereAdmin()) return;

  if (jugadores.length === 0) return;

  const confirmar = confirm("¿Seguro que deseas borrar todos los jugadores?");

  if (!confirmar) return;

  jugadores = [];
  guardar();
  renderBombos();
  renderRanking();
  renderRankingMapas();
});

/* ================= SORTEO EQUIPOS ================= */

document.getElementById("btnSortear").addEventListener("click", async () => {
  scrollARuleta();

  equipoA.innerHTML = "";
  equipoB.innerHTML = "";

  const seleccionados = jugadores.filter(j => j.activo);

  if (seleccionados.length < 2) {
    alert("Selecciona al menos 2 jugadores");
    return;
  }

  const sinBombo = seleccionados.filter(j => !j.bombo);

  if (sinBombo.length > 0) {
    alert("Todos los jugadores seleccionados deben tener un bombo.");
    return;
  }

  const bombos = {};

  seleccionados.forEach(j => {
    if (!bombos[j.bombo]) bombos[j.bombo] = [];
    bombos[j.bombo].push(j.nombre);
  });

  const numerosBombos = Object.keys(bombos).sort((a, b) => Number(a) - Number(b));

  for (const b of numerosBombos) {
    if (bombos[b].length !== 2) {
      alert(`El bombo ${b} tiene ${bombos[b].length} jugador(es). Cada bombo debe tener EXACTAMENTE 2 jugadores seleccionados.`);
      return;
    }
  }

  const rojo = [];
  const azul = [];
  const sorteoId = Date.now();

  configurarRuletaVisual(["ROJO", "AZUL"]);
  escribirRuletaNormal("🎡 Iniciando sorteo...");
  await esperar(700);

  for (const b of numerosBombos) {
    escribirRuletaNormal(`🎡 Bombo ${b}`);
    await esperar(700);

    const grupo = mezclar(bombos[b]);
    const ganador = await ruletaPro(grupo, 5700);
    const perdedor = grupo.find(nombre => nombre !== ganador);

    const liRojo = document.createElement("li");
    liRojo.textContent = ganador;
    equipoA.appendChild(liRojo);

    const liAzul = document.createElement("li");
    liAzul.textContent = perdedor;
    equipoB.appendChild(liAzul);

    rojo.push(ganador);
    azul.push(perdedor);

    await esperar(900);
  }

  partidaActual = {
    id: sorteoId,
    fechaSorteo: new Date().toLocaleString("es-PE"),
    rojo,
    azul,
    mapaSugerido: mapasResultado?.primero || ""
  };

  historial.unshift({
    id: sorteoId,
    fecha: partidaActual.fechaSorteo,
    rojo,
    azul,
    ganador: null,
    mapa: ""
  });

  historial = historial.slice(0, 500);

  guardar();
  renderPartidaActual();
  renderHistorial();

  escribirRuletaNormal("✅ Sorteo terminado");
});

/* ================= LIMPIAR EQUIPOS ================= */

document.getElementById("btnLimpiarEquipos").addEventListener("click", () => {
  equipoA.innerHTML = "";
  equipoB.innerHTML = "";
  configurarRuletaVisual(["Jugador 1", "Jugador 2"]);
  escribirRuletaNormal("Listo");
});

/* ================= SORTEO DE MAPAS ================= */

document.getElementById("btnSortearMapa").addEventListener("click", async () => {
  scrollARuleta();

  const mapas = [...document.querySelectorAll(".mapa")]
    .filter(x => x.checked)
    .map(x => x.value);

  if (mapas.length < 2) {
    alert("Selecciona al menos 2 mapas");
    return;
  }

  resultadoMapas.innerHTML = "";
  let copia = mezclar(mapas);

  escribirRuletaNormal("🎲 Sorteando 1er mapa...");
  await esperar(600);

  const ganador1 = await ruletaPro(copia, 5700);
  copia = copia.filter(mapa => mapa !== ganador1);

  mapasResultado = {
    primero: ganador1,
    segundo: ""
  };

  renderResultadoMapas();
  guardar();

  await esperar(900);

  escribirRuletaNormal("🎲 Sorteando 2do mapa...");
  await esperar(700);

  const ganador2 = await ruletaPro(copia, 5700);

  mapasResultado = {
    primero: ganador1,
    segundo: ganador2
  };

  guardar();
  renderResultadoMapas();
  renderMapSelects();

  escribirRuletaNormal("✅ Mapas sorteados");
});

/* ================= PARTIDA ACTUAL ================= */

function renderPartidaActual() {
  if (!partidaActual) {
    partidaActualDiv.innerHTML = "No hay sorteo pendiente por registrar.";
    btnGanoRojo.disabled = true;
    btnGanoAzul.disabled = true;
    btnEmpate.disabled = true;
    return;
  }

  partidaActualDiv.innerHTML = `
    <strong>Sorteo:</strong> ${partidaActual.fechaSorteo}<br>
    🟥 <strong>Rojo:</strong> ${partidaActual.rojo.join(", ")}<br>
    🟦 <strong>Azul:</strong> ${partidaActual.azul.join(", ")}
  `;

  btnGanoRojo.disabled = false;
  btnGanoAzul.disabled = false;
  btnEmpate.disabled = false;

  renderMapSelects();
  if (partidaActual.mapaSugerido) mapaVersus.value = partidaActual.mapaSugerido;
}

function registrarGanador(resultado) {
  if (!requiereAdmin()) return;

  if (!partidaActual) {
    alert("Primero debes realizar un sorteo.");
    return;
  }

  const mapa = mapaVersus.value || "";
  const textoResultado =
    resultado === "rojo" ? "ROJO" :
    resultado === "azul" ? "AZUL" :
    "EMPATE";

  const confirmar = confirm(
    `¿Confirmas el resultado: ${textoResultado}?\nMapa: ${mapa || "Sin mapa"}`
  );

  if (!confirmar) return;

  const esEmpate = resultado === "empate";

  const ganadores = esEmpate
    ? []
    : resultado === "rojo"
      ? partidaActual.rojo
      : partidaActual.azul;

  const perdedores = esEmpate
    ? []
    : resultado === "rojo"
      ? partidaActual.azul
      : partidaActual.rojo;

  const empatados = esEmpate ? [...partidaActual.rojo, ...partidaActual.azul] : [];

  registrosVersus.unshift({
    id: Date.now(),
    sorteoId: partidaActual.id,
    fecha: new Date().toLocaleString("es-PE"),
    ganador: resultado,
    ganadores,
    perdedores,
    empatados,
    rojo: partidaActual.rojo,
    azul: partidaActual.azul,
    mapa,
    manual: false
  });

  registrosVersus = registrosVersus.slice(0, 500);

  const sorteo = historial.find(h => h.id === partidaActual.id);

  if (sorteo) {
    sorteo.ganador = resultado;
    sorteo.mapa = mapa;
  }

  partidaActual = null;

  guardar();
  renderPartidaActual();
  renderRanking();
  renderRankingMapas();
  renderHistorial();
  renderHistorialVersus();
  renderMapSelects();

  if (esEmpate) {
    alert(`Empate registrado para: ${empatados.join(", ")}`);
  } else {
    alert(`Victoria registrada para: ${ganadores.join(", ")}`);
  }
}

btnGanoRojo.addEventListener("click", () => registrarGanador("rojo"));
btnGanoAzul.addEventListener("click", () => registrarGanador("azul"));
btnEmpate.addEventListener("click", () => registrarGanador("empate"));

/* ================= REGISTRO MANUAL ================= */

function registrarResultadoManual() {
  if (!requiereAdmin()) return;

  const rojo = parsearNombres(manualRojoNombres.value);
  const azul = parsearNombres(manualAzulNombres.value);
  const resultado = manualResultado.value;
  const mapa = manualMapa.value || "";
  const fecha = fechaManualTexto(manualFecha.value);

  if (rojo.length === 0 || azul.length === 0) {
    alert("Escribe al menos 1 jugador en ROJO y 1 jugador en AZUL.");
    return;
  }

  const repetidos = rojo.filter(nombre =>
    azul.some(a => a.toLowerCase() === nombre.toLowerCase())
  );

  if (repetidos.length > 0) {
    alert(`Estos jugadores están en ambos equipos: ${repetidos.join(", ")}`);
    return;
  }

  const textoResultado =
    resultado === "rojo" ? "Ganó ROJO" :
    resultado === "azul" ? "Ganó AZUL" :
    "EMPATE";

  const confirmar = confirm(
    `¿Registrar resultado manual?\n\n🟥 Rojo: ${rojo.join(", ")}\n🟦 Azul: ${azul.join(", ")}\n🗺️ Mapa: ${mapa || "Sin mapa"}\n🏆 Resultado: ${textoResultado}`
  );

  if (!confirmar) return;

  agregarJugadoresFaltantes([...rojo, ...azul]);

  const esEmpate = resultado === "empate";
  const ganadores = esEmpate ? [] : resultado === "rojo" ? rojo : azul;
  const perdedores = esEmpate ? [] : resultado === "rojo" ? azul : rojo;
  const empatados = esEmpate ? [...rojo, ...azul] : [];
  const idManual = Date.now();

  registrosVersus.unshift({
    id: idManual,
    sorteoId: idManual,
    fecha,
    ganador: resultado,
    ganadores,
    perdedores,
    empatados,
    rojo,
    azul,
    mapa,
    manual: true
  });

  registrosVersus = registrosVersus.slice(0, 500);

  historial.unshift({
    id: idManual,
    fecha,
    rojo,
    azul,
    ganador: resultado,
    mapa,
    manual: true
  });

  historial = historial.slice(0, 500);

  guardar();
  limpiarFormularioManual();
  renderBombos();
  renderRanking();
  renderRankingMapas();
  renderHistorial();
  renderHistorialVersus();
  renderMapSelects();

  alert("Resultado manual registrado correctamente.");
}

btnRegistrarManual.addEventListener("click", registrarResultadoManual);

/* ================= RANKING ================= */

function crearStatsBase() {
  const stats = {};

  jugadores.forEach(j => {
    stats[j.nombre] = {
      jugador: j.nombre,
      partidas: 0,
      victorias: 0,
      derrotas: 0,
      empates: 0
    };
  });

  return stats;
}

function asegurarStats(stats, nombre) {
  if (!stats[nombre]) {
    stats[nombre] = {
      jugador: nombre,
      partidas: 0,
      victorias: 0,
      derrotas: 0,
      empates: 0
    };
  }
}

function aplicarRegistroAStats(stats, registro) {
  if (registro.ganador === "empate") {
    const empatados = registro.empatados || [
      ...(registro.rojo || []),
      ...(registro.azul || [])
    ];

    empatados.forEach(nombre => {
      asegurarStats(stats, nombre);
      stats[nombre].partidas++;
      stats[nombre].empates++;
    });

    return;
  }

  (registro.ganadores || []).forEach(nombre => {
    asegurarStats(stats, nombre);
    stats[nombre].partidas++;
    stats[nombre].victorias++;
  });

  (registro.perdedores || []).forEach(nombre => {
    asegurarStats(stats, nombre);
    stats[nombre].partidas++;
    stats[nombre].derrotas++;
  });
}

function ordenarStats(stats) {
  return Object.values(stats).sort((a, b) => {
    if (b.victorias !== a.victorias) return b.victorias - a.victorias;
    if (b.empates !== a.empates) return b.empates - a.empates;
    if (b.partidas !== a.partidas) return b.partidas - a.partidas;
    return a.jugador.localeCompare(b.jugador);
  });
}

function calcularEstadisticas() {
  const stats = crearStatsBase();

  registrosVersus.forEach(registro => {
    aplicarRegistroAStats(stats, registro);
  });

  return ordenarStats(stats);
}

function tablaRanking(stats) {
  if (stats.length === 0) {
    return `<p class="ayuda">Todavía no hay datos registrados.</p>`;
  }

  const filas = stats.map((s, index) => `
    <tr>
      <td>${index + 1}. ${s.jugador}</td>
      <td>${s.partidas}</td>
      <td>${s.victorias}</td>
      <td>${s.derrotas}</td>
      <td>${s.empates}</td>
      <td>${porcentaje(s.victorias, s.partidas)}</td>
    </tr>
  `).join("");

  return `
    <div class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Partidas</th>
            <th>Victorias</th>
            <th>Derrotas</th>
            <th>Empates</th>
            <th>% Victoria</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

function renderRanking() {
  const stats = calcularEstadisticas();
  rankingJugadoresDiv.innerHTML = tablaRanking(stats);
}

function renderRankingMapas() {
  const registrosConMapa = registrosVersus.filter(r => r.mapa);

  if (registrosConMapa.length === 0) {
    rankingMapasDiv.innerHTML = `<p class="ayuda">Todavía no hay resultados registrados con mapa.</p>`;
    return;
  }

  const mapas = [...new Set(registrosConMapa.map(r => r.mapa))].sort();

  rankingMapasDiv.innerHTML = mapas.map(mapa => {
    const stats = {};

    registrosConMapa
      .filter(r => r.mapa === mapa)
      .forEach(r => aplicarRegistroAStats(stats, r));

    const ordenado = ordenarStats(stats);
    const mejor = ordenado[0];

    return `
      <div class="mapa-ranking-card">
        <h3>🗺️ ${mapa}</h3>
        ${mejor ? `<p class="ayuda">👑 Mejor del mapa: <strong>${mejor.jugador}</strong> con ${mejor.victorias} victoria(s).</p>` : ""}
        ${tablaRanking(ordenado)}
      </div>
    `;
  }).join("");
}

document.getElementById("btnBorrarRegistros").addEventListener("click", () => {
  if (!requiereAdmin()) return;

  if (registrosVersus.length === 0) return;

  const confirmar = confirm("¿Seguro que deseas borrar todos los registros de victorias, derrotas y empates?");

  if (!confirmar) return;

  registrosVersus = [];
  historial.forEach(h => h.ganador = null);
  partidaActual = null;

  guardar();
  renderPartidaActual();
  renderRanking();
  renderRankingMapas();
  renderHistorial();
  renderHistorialVersus();
  renderMapSelects();
});

/* ================= BACKUP ================= */

function crearBackup() {
  return {
    app: "Rakion MT Sorteador",
    version: "svg-final-1",
    fechaBackup: new Date().toISOString(),
    jugadores,
    historial,
    registrosVersus,
    partidaActual,
    mapasResultado
  };
}

function descargarArchivo(nombreArchivo, contenido) {
  const blob = new Blob([contenido], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function nombreArchivoBackup() {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const hh = String(ahora.getHours()).padStart(2, "0");
  const min = String(ahora.getMinutes()).padStart(2, "0");

  return `rakion-backup-${yyyy}-${mm}-${dd}-${hh}-${min}.json`;
}

btnExportarBackup.addEventListener("click", () => {
  const backup = crearBackup();
  descargarArchivo(nombreArchivoBackup(), JSON.stringify(backup, null, 2));
});

function normalizarJugadoresImportados(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.map(j => {
    if (typeof j === "string") {
      return {
        nombre: normalizarNombre(j),
        activo: false,
        bombo: ""
      };
    }

    return {
      nombre: normalizarNombre(j.nombre || ""),
      activo: Boolean(j.activo),
      bombo: j.bombo || ""
    };
  }).filter(j => j.nombre !== "");
}

function normalizarHistorialImportado(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.map(h => ({
    id: h.id || Date.now() + Math.random(),
    fecha: h.fecha || "",
    rojo: Array.isArray(h.rojo) ? h.rojo : h.A || [],
    azul: Array.isArray(h.azul) ? h.azul : h.B || [],
    ganador: h.ganador || null,
    mapa: h.mapa || "",
    manual: Boolean(h.manual)
  }));
}

function normalizarRegistrosImportados(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.map(r => ({
    id: r.id || Date.now() + Math.random(),
    sorteoId: r.sorteoId || r.id || Date.now() + Math.random(),
    fecha: r.fecha || "",
    ganador: r.ganador || null,
    ganadores: Array.isArray(r.ganadores) ? r.ganadores : [],
    perdedores: Array.isArray(r.perdedores) ? r.perdedores : [],
    empatados: Array.isArray(r.empatados) ? r.empatados : [],
    rojo: Array.isArray(r.rojo) ? r.rojo : [],
    azul: Array.isArray(r.azul) ? r.azul : [],
    mapa: r.mapa || "",
    manual: Boolean(r.manual)
  }));
}

btnImportarBackup.addEventListener("click", () => {
  if (!requiereAdmin()) return;

  const archivo = inputImportarBackup.files[0];

  if (!archivo) {
    alert("Primero selecciona un archivo .json de backup.");
    return;
  }

  const lector = new FileReader();

  lector.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      const confirmar = confirm(
        "¿Importar este backup? Esto reemplazará jugadores, ranking, historial, mapas sorteados y partida pendiente de esta PC."
      );

      if (!confirmar) return;

      jugadores = normalizarJugadoresImportados(data.jugadores || []);
      historial = normalizarHistorialImportado(data.historial || []);
      registrosVersus = normalizarRegistrosImportados(data.registrosVersus || []);
      partidaActual = data.partidaActual || null;
      mapasResultado = data.mapasResultado || null;

      guardar();
      renderBombos();
      renderPartidaActual();
      renderResultadoMapas();
      renderRanking();
      renderRankingMapas();
      renderHistorial();
      renderHistorialVersus();
      renderMapSelects();

      inputImportarBackup.value = "";

      alert("Backup importado correctamente.");
    } catch (error) {
      alert("No se pudo importar el backup. Verifica que sea un archivo JSON válido.");
    }
  };

  lector.readAsText(archivo);
});

/* ================= HISTORIAL SORTEOS ================= */

function textoResultado(ganador) {
  if (ganador === "rojo") return `<span class="ganador-rojo">Ganó ROJO</span>`;
  if (ganador === "azul") return `<span class="ganador-azul">Ganó AZUL</span>`;
  if (ganador === "empate") return `<span class="ganador-empate">EMPATE</span>`;
  return "Pendiente de registrar";
}

function renderHistorial() {
  historialDiv.innerHTML = "";

  if (historial.length === 0) {
    historialDiv.innerHTML = `<p class="ayuda">Todavía no hay sorteos guardados.</p>`;
    return;
  }

  historial.forEach(item => {
    const div = document.createElement("div");
    div.className = "historial-item";

    div.innerHTML = `
      <small>${item.fecha}${item.manual ? " · Registro manual" : ""}</small><br>
      🗺️ <strong>Mapa:</strong> ${item.mapa || "Sin mapa"}<br>
      🟥 <strong>Rojo:</strong> ${item.rojo.join(", ")}<br>
      🟦 <strong>Azul:</strong> ${item.azul.join(", ")}<br>
      🏆 <strong>Resultado:</strong> ${textoResultado(item.ganador)}
    `;

    historialDiv.appendChild(div);
  });
}

document.getElementById("btnBorrarHistorial").addEventListener("click", () => {
  if (!requiereAdmin()) return;

  if (historial.length === 0) return;

  const confirmar = confirm("¿Seguro que deseas borrar el historial de sorteos? No borra el ranking de victorias.");

  if (!confirmar) return;

  historial = [];
  partidaActual = null;

  guardar();
  renderPartidaActual();
  renderHistorial();
});

/* ================= HISTORIAL VERSUS ================= */

function renderHistorialVersus() {
  historialVersusDiv.innerHTML = "";

  if (registrosVersus.length === 0) {
    historialVersusDiv.innerHTML = `<p class="ayuda">Todavía no hay versus registrados.</p>`;
    return;
  }

  registrosVersus.forEach(registro => {
    const div = document.createElement("div");
    div.className = "historial-item";

    if (registro.ganador === "empate") {
      const empatados = registro.empatados || [
        ...(registro.rojo || []),
        ...(registro.azul || [])
      ];

      div.innerHTML = `
        <small>${registro.fecha}${registro.manual ? " · Registro manual" : ""}</small><br>
        🗺️ <strong>Mapa:</strong> ${registro.mapa || "Sin mapa"}<br>
        🤝 <strong>Resultado:</strong> <span class="ganador-empate">EMPATE</span><br>
        🟥 <strong>Rojo:</strong> ${(registro.rojo || []).join(", ")}<br>
        🟦 <strong>Azul:</strong> ${(registro.azul || []).join(", ")}<br>
        👥 <strong>Jugadores:</strong> ${empatados.join(", ")}
      `;

      historialVersusDiv.appendChild(div);
      return;
    }

    const clase = registro.ganador === "rojo" ? "ganador-rojo" : "ganador-azul";
    const equipo = registro.ganador === "rojo" ? "ROJO" : "AZUL";

    div.innerHTML = `
      <small>${registro.fecha}${registro.manual ? " · Registro manual" : ""}</small><br>
      🗺️ <strong>Mapa:</strong> ${registro.mapa || "Sin mapa"}<br>
      🏆 <strong>Ganó:</strong> <span class="${clase}">${equipo}</span><br>
      ✅ <strong>Ganadores:</strong> ${(registro.ganadores || []).join(", ")}<br>
      ❌ <strong>Perdedores:</strong> ${(registro.perdedores || []).join(", ")}
    `;

    historialVersusDiv.appendChild(div);
  });
}

/* ================= INIT ================= */

guardar();
configurarRuletaVisual(["Jugador 1", "Jugador 2"]);
renderAdmin();
renderBombos();
renderResultadoMapas();
renderMapSelects();
renderPartidaActual();
renderRanking();
renderRankingMapas();
renderHistorial();
renderHistorialVersus();
