import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* =========================================================
   1) CONFIGURA FIREBASE AQUÍ
   Copia tu configuración desde Firebase Console > Project settings > Web app
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyA3G-hnfdJQCKPuU3aDPE4D9CUPvGz6ou8",
  authDomain: "rakion-sorteador.firebaseapp.com",
  projectId: "rakion-sorteador",
  storageBucket: "rakion-sorteador.firebasestorage.app",
  messagingSenderId: "1019500381247",
  appId: "1:1019500381247:web:d67b44a58635c4872aa48a",
  measurementId: "G-42QLT9FKV8"
};

/*
  2) PEGA AQUÍ EL UID DEL ADMINISTRADOR
  Firebase Console > Authentication > Users > copia el UID del usuario administrador.
*/
const ADMIN_UIDS = [
  "J70mx9M0wJbVSZ54icLM2m5PAL12"
];

/* ================= DATOS ================= */

const MAPAS_BASE = [
  "AnotherTomb",
  "Lost Temple",
  "Templo Serpiente",
  "Tumba del Rey"
];

let app = null;
let auth = null;
let db = null;
let usuarioActual = null;
let firebaseListo = false;

let jugadores = [];
let partidas = [];
let perleos = [];
let mapasResultado = null;
let partidaActual = null;
let editandoId = null;
let wheelRotation = 0;

/* ================= ELEMENTOS ================= */

const estadoFirebase = document.getElementById("estadoFirebase");
const estadoAdmin = document.getElementById("estadoAdmin");
const uidAdminInfo = document.getElementById("uidAdminInfo");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const btnEntrarAdmin = document.getElementById("btnEntrarAdmin");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");

const panelBombos = document.getElementById("panelBombos");
const nuevoJugador = document.getElementById("nuevoJugador");
const btnAgregar = document.getElementById("btnAgregar");
const btnLimpiarBombos = document.getElementById("btnLimpiarBombos");

const seccionRuleta = document.getElementById("seccionRuleta");
const ruletaContainer = document.querySelector(".ruleta-container");
const ruleta = document.getElementById("ruleta");
const wheelGroup = document.getElementById("wheelGroup");
const wheelCenterText = document.getElementById("wheelCenterText");

const equipoRojo = document.getElementById("equipoRojo");
const equipoAzul = document.getElementById("equipoAzul");
const resultadoMapas = document.getElementById("resultadoMapas");

const partidaActualDiv = document.getElementById("partidaActual");
const serieMapa1 = document.getElementById("serieMapa1");
const serieMapa2 = document.getElementById("serieMapa2");
const serieResultado = document.getElementById("serieResultado");
const serieMarcador = document.getElementById("serieMarcador");
const btnRegistrarSerie = document.getElementById("btnRegistrarSerie");

const manualRojoNombres = document.getElementById("manualRojoNombres");
const manualAzulNombres = document.getElementById("manualAzulNombres");
const manualMapa1 = document.getElementById("manualMapa1");
const manualMapa2 = document.getElementById("manualMapa2");
const manualResultado = document.getElementById("manualResultado");
const manualMarcador = document.getElementById("manualMarcador");
const manualFecha = document.getElementById("manualFecha");
const btnRegistrarManual = document.getElementById("btnRegistrarManual");
const modoEdicion = document.getElementById("modoEdicion");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");

const panelDinero = document.getElementById("panelDinero");
const rankingGlobal = document.getElementById("rankingGlobal");
const rankingMapas = document.getElementById("rankingMapas");
const historialResultados = document.getElementById("historialResultados");
const perleoJugador = document.getElementById("perleoJugador");
const perleoCantidad = document.getElementById("perleoCantidad");
const perleoFecha = document.getElementById("perleoFecha");
const perleoNota = document.getElementById("perleoNota");
const btnRegistrarPerleo = document.getElementById("btnRegistrarPerleo");
const rankingPerleos = document.getElementById("rankingPerleos");
const historialPerleos = document.getElementById("historialPerleos");

/* ================= FIREBASE ================= */

function configCompleta() {
  return firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("PEGA_AQUI") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("PEGA_AQUI");
}

function setEstadoFirebase(tipo, texto) {
  estadoFirebase.className = tipo;
  estadoFirebase.textContent = texto;
}

function inicializarFirebase() {
  if (!configCompleta()) {
    firebaseListo = false;
    setEstadoFirebase(
      "estado-error",
      "Falta pegar tu configuración de Firebase en script.js. La página abre, pero no guardará datos online."
    );
    return;
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseListo = true;

    setEstadoFirebase("estado-cargando", "Firebase configurado. Cargando datos online...");

    onAuthStateChanged(auth, user => {
      usuarioActual = user;
      renderAdmin();
    });

    escucharDatos();
  } catch (error) {
    firebaseListo = false;
    console.error(error);
    setEstadoFirebase("estado-error", "No se pudo iniciar Firebase. Revisa firebaseConfig en script.js.");
  }
}

function escucharDatos() {
  if (!firebaseListo) return;

  const qJugadores = query(collection(db, "jugadores"), orderBy("nombre", "asc"));
  onSnapshot(qJugadores, snapshot => {
    jugadores = snapshot.docs.map(d => ({
      id: d.id,
      nombre: d.data().nombre || "",
      bombo: d.data().bombo || ""
    }));
    renderBombos();
    renderPerleoSelect();
    renderRankings();
    renderPerleos();
  }, error => {
    console.error(error);
    setEstadoFirebase("estado-error", "Error leyendo jugadores. Revisa reglas de Firestore.");
  });

  const qPartidas = query(collection(db, "partidas"), orderBy("fechaISO", "desc"));
  onSnapshot(qPartidas, snapshot => {
    partidas = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderRankings();
    renderHistorial();
    setEstadoFirebase("estado-ok", "Firebase conectado. Datos online sincronizados.");
  }, error => {
    console.error(error);
    setEstadoFirebase("estado-error", "Error leyendo partidas. Revisa reglas de Firestore.");
  });

  const qPerleos = query(collection(db, "perleos"), orderBy("fechaISO", "desc"));
  onSnapshot(qPerleos, snapshot => {
    perleos = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderPerleos();
  }, error => {
    console.error(error);
    setEstadoFirebase("estado-error", "Error leyendo perleos. Revisa reglas de Firestore.");
  });

  onSnapshot(doc(db, "config", "ultimoSorteoMapas"), snapshot => {
    mapasResultado = snapshot.exists() ? snapshot.data() : null;
    renderResultadoMapas();
    renderMapSelects();
  }, error => {
    console.error(error);
  });
}

function esAdmin() {
  return Boolean(
    firebaseListo &&
    usuarioActual &&
    ADMIN_UIDS.includes(usuarioActual.uid)
  );
}

function requiereAdmin() {
  if (esAdmin()) return true;

  alert("Necesitas iniciar sesión con la cuenta administradora autorizada.");
  return false;
}

function renderAdmin() {
  const adminOk = esAdmin();

  if (!firebaseListo) {
    estadoAdmin.className = "estado-admin bloqueado";
    estadoAdmin.textContent = "Firebase aún no está configurado. Pega tu firebaseConfig en script.js.";
  } else if (adminOk) {
    estadoAdmin.className = "estado-admin activo";
    estadoAdmin.textContent = `Administrador activo: ${usuarioActual.email}`;
  } else if (usuarioActual) {
    estadoAdmin.className = "estado-admin bloqueado";
    estadoAdmin.textContent = `Sesión iniciada como ${usuarioActual.email}, pero ese UID no está autorizado como administrador.`;
  } else {
    estadoAdmin.className = "estado-admin bloqueado";
    estadoAdmin.textContent = "Modo visitante: puedes ver datos y sortear visualmente, pero no guardar cambios.";
  }

  uidAdminInfo.textContent = usuarioActual
    ? `Tu UID actual es: ${usuarioActual.uid}`
    : "Cuando inicies sesión, aquí aparecerá tu UID para pegarlo en ADMIN_UIDS y en las reglas de Firestore.";

  document.querySelectorAll("button, input, select, textarea").forEach(el => {
    if (["btnEntrarAdmin", "btnSalirAdmin"].includes(el.id)) return;
  });

  const controlesAdmin = [
    btnAgregar,
    btnLimpiarBombos,
    btnRegistrarSerie,
    btnRegistrarManual,
    btnRegistrarPerleo
  ].filter(Boolean);

  controlesAdmin.forEach(control => {
    control.classList.toggle("bloqueado-admin", !adminOk);
  });

  renderBombos();
  renderHistorial();
  renderPerleos();
}

/* ================= ADMIN LOGIN ================= */

btnEntrarAdmin.addEventListener("click", async () => {
  if (!firebaseListo) {
    alert("Primero pega tu configuración de Firebase en script.js.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, adminEmail.value.trim(), adminPassword.value);
    adminPassword.value = "";
    renderAdmin();
    alert("Administrador validado.");
  } catch (error) {
    console.error(error);
    alert("No se pudo iniciar sesión. Revisa correo, contraseña o que Email/Password esté activo en Firebase.");
  }
});

btnSalirAdmin.addEventListener("click", async () => {
  if (auth) {
    await signOut(auth);
  }

  renderAdmin();
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

function normalizarNombre(nombre) {
  return String(nombre || "").trim().replace(/\s+/g, " ");
}

function parsearNombres(texto) {
  return [...new Set(
    String(texto || "")
      .split(/[\n,;]+/)
      .map(normalizarNombre)
      .filter(Boolean)
  )];
}

function mezclar(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function fechaTextoDesdeInput(valor) {
  if (!valor) return new Date().toLocaleString("es-PE");

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return new Date().toLocaleString("es-PE");

  return fecha.toLocaleString("es-PE");
}

function fechaISODesdeInput(valor) {
  if (!valor) return new Date().toISOString();

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return new Date().toISOString();

  return fecha.toISOString();
}

function formatoSoles(valor) {
  const abs = Math.abs(valor);
  if (valor > 0) return `+S/. ${abs}`;
  if (valor < 0) return `-S/. ${abs}`;
  return "S/. 0";
}

function claseSaldo(valor) {
  if (valor > 0) return "saldo-positivo";
  if (valor < 0) return "saldo-negativo";
  return "saldo-cero";
}

function renderListaEquipo(ul, nombres) {
  ul.innerHTML = "";
  nombres.forEach(nombre => {
    const li = document.createElement("li");
    li.textContent = nombre;
    ul.appendChild(li);
  });
}

function renderMapSelects() {
  const opciones = MAPAS_BASE.map(m => `<option value="${m}">${m}</option>`).join("");

  [serieMapa1, serieMapa2, manualMapa1, manualMapa2].forEach(select => {
    const anterior = select.value;
    select.innerHTML = opciones;
    if (MAPAS_BASE.includes(anterior)) select.value = anterior;
  });

  if (mapasResultado?.mapa1) {
    serieMapa1.value = mapasResultado.mapa1;
    manualMapa1.value = mapasResultado.mapa1;
  }

  if (mapasResultado?.mapa2) {
    serieMapa2.value = mapasResultado.mapa2;
    manualMapa2.value = mapasResultado.mapa2;
  }
}

function obtenerMapasSeleccionadosParaSorteo() {
  const seleccionados = [...document.querySelectorAll(".mapaSorteo")]
    .filter(input => input.checked)
    .map(input => input.value);

  return seleccionados;
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
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
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
    "M 0 0",
    `L ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
    `A ${radio} ${radio} 0 ${grande} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
    "Z"
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

function limpiarColorGanador() {
  ruleta.classList.remove("texto-ganador");
  wheelGroup.querySelectorAll(".winner").forEach(el => el.classList.remove("winner"));
}

function marcarColorGanador() {
  ruleta.classList.add("texto-ganador");
}

function setWheelRotation(angulo) {
  wheelGroup.setAttribute("transform", `rotate(${angulo} 0 0)`);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animarGiroSvg(desde, hasta, duracion) {
  return new Promise(resolve => {
    const inicio = performance.now();

    function frame(ahora) {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      const suavizado = easeOutCubic(progreso);
      const actual = desde + (hasta - desde) * suavizado;

      setWheelRotation(actual);

      if (progreso < 1) {
        requestAnimationFrame(frame);
      } else {
        setWheelRotation(hasta);
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
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

  setWheelRotation(wheelRotation);
}

function marcarGanadorVisual(indexGanador) {
  wheelCenterText.textContent = "🏆";

  const sector = wheelGroup.querySelector(`.wheel-sector[data-index="${indexGanador}"]`);
  const label = wheelGroup.querySelector(`.wheel-label[data-index="${indexGanador}"]`);

  if (sector) sector.classList.add("winner");
  if (label) label.classList.add("winner");
}

function activarRuleta() {
  limpiarColorGanador();
  ruletaContainer.classList.add("girando");
}

function detenerRuleta() {
  ruletaContainer.classList.remove("girando");
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
  const margenSeguro = sector * 0.24;
  const ajusteDentroSector = (Math.random() * 2 - 1) * margenSeguro;
  const puntoGanador = centroSector + ajusteDentroSector;

  const rotacionInicial = wheelRotation;
  const rotacionActual = ((wheelRotation % 360) + 360) % 360;
  const rotacionDeseada = ((ANGULO_PUNTERO - puntoGanador) % 360 + 360) % 360;
  const diferencia = (rotacionDeseada - rotacionActual + 360) % 360;
  const vueltas = 4 + Math.floor(Math.random() * 3);

  wheelRotation += vueltas * 360 + diferencia;

  activarRuleta();
  ruleta.innerText = "🎡 Girando...";

  await animarGiroSvg(rotacionInicial, wheelRotation, duracion);

  detenerRuleta();
  ruleta.innerText = ganador;
  marcarColorGanador();
  marcarGanadorVisual(indexGanador);

  return ganador;
}

/* ================= JUGADORES / BOMBOS ================= */

function crearPanelBombo(titulo, bomboValor) {
  const panel = document.createElement("div");
  panel.className = "bombo-panel";
  panel.dataset.bombo = bomboValor;

  const jugadoresPanel = jugadores.filter(j => j.bombo === bomboValor);

  panel.innerHTML = `
    <h3>${titulo} <span class="bombo-contador">${jugadoresPanel.length} jugador(es)</span></h3>
  `;

  panel.addEventListener("dragover", e => {
    e.preventDefault();
    if (esAdmin()) panel.classList.add("drag-over");
  });

  panel.addEventListener("dragleave", () => panel.classList.remove("drag-over"));

  panel.addEventListener("drop", async e => {
    e.preventDefault();
    panel.classList.remove("drag-over");

    if (!requiereAdmin()) return;

    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    await updateDoc(doc(db, "jugadores", id), {
      bombo: bomboValor
    });
  });

  jugadoresPanel.forEach(jugador => {
    panel.appendChild(crearTokenJugador(jugador));
  });

  return panel;
}

function crearTokenJugador(jugador) {
  const token = document.createElement("div");
  token.className = "player-token";
  token.draggable = esAdmin();
  token.dataset.id = jugador.id;
  token.title = esAdmin()
    ? "Arrastra este jugador a un bombo"
    : "Solo el administrador puede mover jugadores";

  token.innerHTML = `
    <span class="nombre">${jugador.nombre}</span>
    <button class="btnEliminar">❌</button>
  `;

  token.addEventListener("dragstart", e => {
    if (!esAdmin()) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData("text/plain", jugador.id);
  });

  const btnEliminar = token.querySelector(".btnEliminar");
  btnEliminar.disabled = !esAdmin();

  btnEliminar.addEventListener("click", async () => {
    if (!requiereAdmin()) return;

    const confirmar = confirm(`¿Eliminar a ${jugador.nombre}?`);
    if (!confirmar) return;

    await deleteDoc(doc(db, "jugadores", jugador.id));
  });

  return token;
}

function renderBombos() {
  panelBombos.innerHTML = "";

  panelBombos.appendChild(crearPanelBombo("📌 Sin bombo", ""));

  for (let i = 1; i <= 8; i++) {
    panelBombos.appendChild(crearPanelBombo(`🎯 Bombo ${i}`, String(i)));
  }
}

btnAgregar.addEventListener("click", async () => {
  if (!requiereAdmin()) return;

  const nombre = normalizarNombre(nuevoJugador.value);

  if (!nombre) {
    alert("Escribe el nombre del jugador.");
    return;
  }

  const existe = jugadores.some(j => j.nombre.toLowerCase() === nombre.toLowerCase());

  if (existe) {
    alert("Ese jugador ya existe.");
    return;
  }

  await addDoc(collection(db, "jugadores"), {
    nombre,
    bombo: "",
    creadoEn: serverTimestamp(),
    creadoPor: usuarioActual.uid
  });

  nuevoJugador.value = "";
});

nuevoJugador.addEventListener("keydown", e => {
  if (e.key === "Enter") btnAgregar.click();
});

btnLimpiarBombos.addEventListener("click", async () => {
  if (!requiereAdmin()) return;

  const confirmar = confirm("¿Enviar todos los jugadores a Sin bombo?");
  if (!confirmar) return;

  for (const jugador of jugadores) {
    if (jugador.bombo) {
      await updateDoc(doc(db, "jugadores", jugador.id), {
        bombo: ""
      });
    }
  }
});

/* ================= SORTEO MAPAS ================= */

document.getElementById("btnSortearMapa").addEventListener("click", async () => {
  scrollARuleta();

  const mapasElegidos = obtenerMapasSeleccionadosParaSorteo();

  if (mapasElegidos.length < 2) {
    alert("Debes seleccionar mínimo 2 mapas para sortear Mapa 1 y Mapa 2.");
    return;
  }

  const copia = mezclar(mapasElegidos);

  ruleta.innerText = "🎲 Sorteando Mapa 1...";
  await esperar(500);

  const mapa1 = await ruletaPro(copia, 5700);
  const restantes = copia.filter(m => m !== mapa1);

  await esperar(700);

  ruleta.innerText = "🎲 Sorteando Mapa 2...";
  const mapa2 = restantes.length === 1 ? restantes[0] : await ruletaPro(restantes, 5700);

  if (restantes.length === 1) {
    configurarRuletaVisual([mapa2]);
    ruleta.innerText = mapa2;
    marcarColorGanador();
    marcarGanadorVisual(0);
    await esperar(900);
  }

  mapasResultado = {
    mapa1,
    mapa2,
    mapasUsadosEnSorteo: mapasElegidos,
    fechaTexto: new Date().toLocaleString("es-PE"),
    fechaISO: new Date().toISOString()
  };

  if (esAdmin()) {
    await setDoc(doc(db, "config", "ultimoSorteoMapas"), {
      ...mapasResultado,
      actualizadoEn: serverTimestamp(),
      actualizadoPor: usuarioActual.uid
    });
  } else {
    renderResultadoMapas();
    renderMapSelects();
  }

  ruleta.innerText = "✅ Mapas sorteados";
});

function renderResultadoMapas() {
  if (!mapasResultado) {
    resultadoMapas.innerHTML = "Todavía no se sortearon mapas.";
    return;
  }

  resultadoMapas.innerHTML = `
    <div class="mapa-ganador">🥇 <span>Mapa 1:</span> <strong>${mapasResultado.mapa1}</strong></div>
    <div class="mapa-ganador">🥈 <span>Mapa 2:</span> <strong>${mapasResultado.mapa2}</strong></div>
  `;
}

/* ================= SORTEO EQUIPOS ================= */

document.getElementById("btnSortear").addEventListener("click", async () => {
  scrollARuleta();

  equipoRojo.innerHTML = "";
  equipoAzul.innerHTML = "";

  const participantes = jugadores.filter(j => j.bombo);

  if (participantes.length < 2) {
    alert("Coloca jugadores en bombos. Los jugadores sin bombo no participan.");
    return;
  }

  const bombos = {};

  participantes.forEach(j => {
    if (!bombos[j.bombo]) bombos[j.bombo] = [];
    bombos[j.bombo].push(j.nombre);
  });

  const numerosBombos = Object.keys(bombos).sort((a, b) => Number(a) - Number(b));

  for (const b of numerosBombos) {
    if (bombos[b].length !== 2) {
      alert(`El bombo ${b} tiene ${bombos[b].length} jugador(es). Cada bombo debe tener exactamente 2.`);
      return;
    }
  }

  const rojo = [];
  const azul = [];

  ruleta.innerText = "🎡 Iniciando sorteo...";
  configurarRuletaVisual(["ROJO", "AZUL"]);
  await esperar(600);

  for (const b of numerosBombos) {
    ruleta.innerText = `🎡 Bombo ${b}`;
    await esperar(600);

    const grupo = mezclar(bombos[b]);
    const ganador = await ruletaPro(grupo, 5700);
    const perdedor = grupo.find(nombre => nombre !== ganador);

    rojo.push(ganador);
    azul.push(perdedor);

    renderListaEquipo(equipoRojo, rojo);
    renderListaEquipo(equipoAzul, azul);

    await esperar(700);
  }

  partidaActual = {
    rojo,
    azul,
    fechaTexto: new Date().toLocaleString("es-PE"),
    fechaISO: new Date().toISOString()
  };

  renderPartidaActual();

  ruleta.innerText = "✅ Sorteo terminado";
});

document.getElementById("btnLimpiarEquipos").addEventListener("click", () => {
  partidaActual = null;
  equipoRojo.innerHTML = "";
  equipoAzul.innerHTML = "";
  configurarRuletaVisual(["Jugador 1", "Jugador 2"]);
  ruleta.innerText = "Listo";
  renderPartidaActual();
});

function renderPartidaActual() {
  if (!partidaActual) {
    partidaActualDiv.innerHTML = "No hay sorteo pendiente por registrar.";
    return;
  }

  partidaActualDiv.innerHTML = `
    <strong>Sorteo:</strong> ${partidaActual.fechaTexto}<br>
    🟥 <strong>Rojo:</strong> ${partidaActual.rojo.join(", ")}<br>
    🟦 <strong>Azul:</strong> ${partidaActual.azul.join(", ")}
  `;

  if (mapasResultado?.mapa1) serieMapa1.value = mapasResultado.mapa1;
  if (mapasResultado?.mapa2) serieMapa2.value = mapasResultado.mapa2;
}

/* ================= REGISTRAR RESULTADOS ================= */

function construirResultado({ rojo, azul, mapa1, mapa2, ganador, marcador, manual, fechaISO, fechaTexto }) {
  return {
    rojo,
    azul,
    mapa1,
    mapa2,
    ganador,
    marcador,
    manual,
    fechaISO,
    fechaTexto,
    actualizadoEn: serverTimestamp(),
    actualizadoPor: usuarioActual.uid,
    actualizadoPorEmail: usuarioActual.email
  };
}

async function asegurarJugadoresEnFirebase(nombres) {
  for (const nombre of nombres) {
    const existe = jugadores.some(j => j.nombre.toLowerCase() === nombre.toLowerCase());

    if (!existe) {
      await addDoc(collection(db, "jugadores"), {
        nombre,
        bombo: "",
        creadoEn: serverTimestamp(),
        creadoPor: usuarioActual.uid
      });
    }
  }
}

btnRegistrarSerie.addEventListener("click", async () => {
  if (!requiereAdmin()) return;

  if (!partidaActual) {
    alert("Primero realiza un sorteo de equipos.");
    return;
  }

  const mapa1 = serieMapa1.value;
  const mapa2 = serieMapa2.value;

  if (mapa1 === mapa2) {
    alert("Mapa 1 y Mapa 2 deben ser diferentes.");
    return;
  }

  const confirmar = confirm(
    `¿Registrar serie actual?\nMapa 1: ${mapa1}\nMapa 2: ${mapa2}\nResultado: ${serieResultado.value.toUpperCase()} ${serieMarcador.value}`
  );

  if (!confirmar) return;

  await addDoc(collection(db, "partidas"), {
    ...construirResultado({
      rojo: partidaActual.rojo,
      azul: partidaActual.azul,
      mapa1,
      mapa2,
      ganador: serieResultado.value,
      marcador: serieMarcador.value,
      manual: false,
      fechaISO: partidaActual.fechaISO,
      fechaTexto: partidaActual.fechaTexto
    }),
    creadoEn: serverTimestamp(),
    creadoPor: usuarioActual.uid,
    creadoPorEmail: usuarioActual.email
  });

  partidaActual = null;
  equipoRojo.innerHTML = "";
  equipoAzul.innerHTML = "";
  renderPartidaActual();
  alert("Serie registrada correctamente.");
});

btnRegistrarManual.addEventListener("click", async () => {
  if (!requiereAdmin()) return;

  const rojo = parsearNombres(manualRojoNombres.value);
  const azul = parsearNombres(manualAzulNombres.value);

  if (rojo.length === 0 || azul.length === 0) {
    alert("Escribe al menos 1 jugador en Rojo y 1 jugador en Azul.");
    return;
  }

  const repetidos = rojo.filter(n =>
    azul.some(a => a.toLowerCase() === n.toLowerCase())
  );

  if (repetidos.length > 0) {
    alert(`Estos jugadores están en ambos equipos: ${repetidos.join(", ")}`);
    return;
  }

  if (manualMapa1.value === manualMapa2.value) {
    alert("Mapa 1 y Mapa 2 deben ser diferentes.");
    return;
  }

  const confirmar = confirm(
    editandoId
      ? "¿Actualizar este resultado?"
      : "¿Registrar este resultado manual?"
  );

  if (!confirmar) return;

  await asegurarJugadoresEnFirebase([...rojo, ...azul]);

  const data = construirResultado({
    rojo,
    azul,
    mapa1: manualMapa1.value,
    mapa2: manualMapa2.value,
    ganador: manualResultado.value,
    marcador: manualMarcador.value,
    manual: true,
    fechaISO: fechaISODesdeInput(manualFecha.value),
    fechaTexto: fechaTextoDesdeInput(manualFecha.value)
  });

  if (editandoId) {
    await updateDoc(doc(db, "partidas", editandoId), data);
    alert("Resultado actualizado.");
  } else {
    await addDoc(collection(db, "partidas"), {
      ...data,
      creadoEn: serverTimestamp(),
      creadoPor: usuarioActual.uid,
      creadoPorEmail: usuarioActual.email
    });
    alert("Resultado manual registrado.");
  }

  limpiarManual();
});

function limpiarManual() {
  editandoId = null;
  manualRojoNombres.value = "";
  manualAzulNombres.value = "";
  manualResultado.value = "rojo";
  manualMarcador.value = "3-0";
  manualFecha.value = "";
  modoEdicion.classList.add("oculto");
  btnRegistrarManual.textContent = "💾 Registrar resultado manual";
}

btnCancelarEdicion.addEventListener("click", limpiarManual);

/* ================= RANKINGS ================= */

function crearStatsIniciales() {
  const stats = {};
  jugadores.forEach(j => {
    stats[j.nombre] = {
      jugador: j.nombre,
      global: 0,
      victorias: 0,
      derrotas: 0,
      saldoSoles: 0,
      mapas: {}
    };
  });
  return stats;
}

function asegurarStats(stats, nombre) {
  if (!stats[nombre]) {
    stats[nombre] = {
      jugador: nombre,
      global: 0,
      victorias: 0,
      derrotas: 0,
      saldoSoles: 0,
      mapas: {}
    };
  }
}

function asegurarMapa(stats, nombre, mapa) {
  asegurarStats(stats, nombre);

  if (!stats[nombre].mapas[mapa]) {
    stats[nombre].mapas[mapa] = {
      mapa,
      puntos: 0,
      victorias: 0,
      derrotas: 0
    };
  }
}

function sumarMapa(stats, nombre, mapa, valor) {
  if (!mapa) return;

  asegurarMapa(stats, nombre, mapa);
  stats[nombre].mapas[mapa].puntos += valor;

  if (valor > 0) stats[nombre].mapas[mapa].victorias++;
  if (valor < 0) stats[nombre].mapas[mapa].derrotas++;
}

function calcularStats() {
  const stats = crearStatsIniciales();

  partidas.forEach(partida => {
    if (partida.ganador === "empate") return;

    const ganadores = partida.ganador === "rojo" ? partida.rojo || [] : partida.azul || [];
    const perdedores = partida.ganador === "rojo" ? partida.azul || [] : partida.rojo || [];
    const mapas = [partida.mapa1, partida.mapa2].filter(Boolean);

    ganadores.forEach(nombre => {
      asegurarStats(stats, nombre);
      stats[nombre].global += 1;
      stats[nombre].victorias += 1;

      mapas.forEach(mapa => sumarMapa(stats, nombre, mapa, 1));
    });

    perdedores.forEach(nombre => {
      asegurarStats(stats, nombre);
      stats[nombre].global -= 1;
      stats[nombre].derrotas += 1;

      mapas.forEach(mapa => sumarMapa(stats, nombre, mapa, -1));
    });
  });

  Object.values(stats).forEach(s => {
    s.saldoSoles = s.global * 5;
  });

  return Object.values(stats).sort((a, b) => {
    if (b.global !== a.global) return b.global - a.global;
    if (b.victorias !== a.victorias) return b.victorias - a.victorias;
    return a.jugador.localeCompare(b.jugador);
  });
}

function renderRankings() {
  const stats = calcularStats();

  renderPanelDinero(stats);
  renderRankingGlobal(stats);
  renderRankingMapas(stats);
}

function renderPanelDinero(stats) {
  if (stats.length === 0) {
    panelDinero.innerHTML = `<p class="ayuda">Todavía no hay jugadores.</p>`;
    return;
  }

  const filas = stats.map((s, i) => `
    <tr>
      <td>${i + 1}. ${s.jugador}</td>
      <td class="${claseSaldo(s.global)}">${s.global > 0 ? "+" : ""}${s.global}</td>
      <td class="${claseSaldo(s.saldoSoles)}">${formatoSoles(s.saldoSoles)}</td>
      <td>${s.victorias}</td>
      <td>${s.derrotas}</td>
    </tr>
  `).join("");

  panelDinero.innerHTML = `
    <div class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Global</th>
            <th>Saldo</th>
            <th>Series ganadas</th>
            <th>Series perdidas</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

function renderRankingGlobal(stats) {
  if (stats.length === 0) {
    rankingGlobal.innerHTML = `<p class="ayuda">Todavía no hay datos.</p>`;
    return;
  }

  const filas = stats.map((s, i) => `
    <tr>
      <td>${i + 1}. ${s.jugador}</td>
      <td class="${claseSaldo(s.global)}">${s.global > 0 ? "+" : ""}${s.global}</td>
      <td>${s.victorias}</td>
      <td>${s.derrotas}</td>
      <td class="${claseSaldo(s.saldoSoles)}">${formatoSoles(s.saldoSoles)}</td>
    </tr>
  `).join("");

  rankingGlobal.innerHTML = `
    <div class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Puntaje global</th>
            <th>Ganadas</th>
            <th>Perdidas</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

function renderRankingMapas(stats) {
  const mapasHTML = MAPAS_BASE.map(mapa => {
    const filas = stats
      .map(s => ({
        jugador: s.jugador,
        ...(s.mapas[mapa] || { puntos: 0, victorias: 0, derrotas: 0 })
      }))
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.victorias !== a.victorias) return b.victorias - a.victorias;
        return a.jugador.localeCompare(b.jugador);
      })
      .map((s, i) => `
        <tr>
          <td>${i + 1}. ${s.jugador}</td>
          <td class="${claseSaldo(s.puntos)}">${s.puntos > 0 ? "+" : ""}${s.puntos}</td>
          <td>${s.victorias}</td>
          <td>${s.derrotas}</td>
        </tr>
      `).join("");

    return `
      <div class="mapa-ranking-card">
        <h3>🗺️ ${mapa}</h3>
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Puntaje mapa</th>
                <th>Ganadas</th>
                <th>Perdidas</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join("");

  rankingMapas.innerHTML = mapasHTML || `<p class="ayuda">Todavía no hay datos por mapa.</p>`;
}


/* ================= PERLEOS ================= */

function renderPerleoSelect() {
  if (!perleoJugador) return;

  const anterior = perleoJugador.value;
  const ordenados = [...jugadores].sort((a, b) => a.nombre.localeCompare(b.nombre));

  perleoJugador.innerHTML = `<option value="">Selecciona jugador</option>` +
    ordenados.map(j => `<option value="${j.nombre}">${j.nombre}</option>`).join("");

  if (anterior) perleoJugador.value = anterior;
}

function calcularRankingPerleos() {
  const stats = {};

  jugadores.forEach(j => {
    stats[j.nombre] = {
      jugador: j.nombre,
      total: 0
    };
  });

  perleos.forEach(p => {
    const jugador = p.jugador || "Sin nombre";
    const cantidad = Number(p.cantidad || 0);

    if (!stats[jugador]) {
      stats[jugador] = {
        jugador,
        total: 0
      };
    }

    stats[jugador].total += cantidad;
  });

  return Object.values(stats)
    .filter(s => s.total > 0)
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.jugador.localeCompare(b.jugador);
    });
}

function renderPerleos() {
  if (!rankingPerleos || !historialPerleos) return;

  const ranking = calcularRankingPerleos();

  if (ranking.length === 0) {
    rankingPerleos.innerHTML = `<p class="ayuda">Todavía no hay perleos registrados.</p>`;
  } else {
    const filas = ranking.map((s, index) => `
      <tr>
        <td>${index + 1}. ${s.jugador}</td>
        <td class="perleo-total">${s.total}</td>
      </tr>
    `).join("");

    rankingPerleos.innerHTML = `
      <div class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Total de perleos</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;
  }

  if (perleos.length === 0) {
    historialPerleos.innerHTML = `<p class="ayuda">Todavía no hay historial de perleos.</p>`;
    return;
  }

  historialPerleos.innerHTML = perleos.map(p => `
    <div class="historial-item perleo-item">
      <small>${p.fechaTexto || ""}</small><br>
      🐚 <strong>${p.jugador || "Sin nombre"}</strong>: <span class="perleo-total">+${Number(p.cantidad || 0)}</span> perleo(s)
      ${p.nota ? `<br><span class="perleo-nota">"${p.nota}"</span>` : ""}
      ${esAdmin() ? `
        <div class="historial-acciones">
          <button class="btn-peligro" data-eliminar-perleo="${p.id}">🗑️ Eliminar</button>
        </div>
      ` : ""}
    </div>
  `).join("");

  historialPerleos.querySelectorAll("[data-eliminar-perleo]").forEach(btn => {
    btn.addEventListener("click", () => eliminarPerleo(btn.dataset.eliminarPerleo));
  });
}

btnRegistrarPerleo.addEventListener("click", async () => {
  if (!requiereAdmin()) return;

  const jugador = perleoJugador.value;
  const cantidad = Number(perleoCantidad.value || 0);
  const nota = perleoNota.value.trim();

  if (!jugador) {
    alert("Selecciona el jugador que perleó.");
    return;
  }

  if (!Number.isInteger(cantidad) || cantidad < 1) {
    alert("La cantidad debe ser un número entero mayor o igual a 1.");
    return;
  }

  const confirmar = confirm(`¿Registrar ${cantidad} perleo(s) para ${jugador}?`);
  if (!confirmar) return;

  await addDoc(collection(db, "perleos"), {
    jugador,
    cantidad,
    nota,
    fechaISO: fechaISODesdeInput(perleoFecha.value),
    fechaTexto: fechaTextoDesdeInput(perleoFecha.value),
    creadoEn: serverTimestamp(),
    creadoPor: usuarioActual.uid,
    creadoPorEmail: usuarioActual.email
  });

  perleoJugador.value = "";
  perleoCantidad.value = "1";
  perleoFecha.value = "";
  perleoNota.value = "";

  alert("Perleo registrado correctamente.");
});

async function eliminarPerleo(id) {
  if (!requiereAdmin()) return;

  const p = perleos.find(x => x.id === id);
  const confirmar = confirm(
    `¿Eliminar este perleo?\n${p?.jugador || ""} +${p?.cantidad || 0}`
  );

  if (!confirmar) return;

  await deleteDoc(doc(db, "perleos", id));
}


/* ================= HISTORIAL ================= */

function textoGanador(valor) {
  if (valor === "rojo") return `<span class="texto-rojo">ROJO</span>`;
  if (valor === "azul") return `<span class="texto-verde">AZUL</span>`;
  return `<span class="saldo-cero">EMPATE</span>`;
}

function renderHistorial() {
  if (partidas.length === 0) {
    historialResultados.innerHTML = `<p class="ayuda">Todavía no hay resultados registrados.</p>`;
    return;
  }

  historialResultados.innerHTML = partidas.map(p => `
    <div class="historial-item">
      <small>${p.fechaTexto || ""} ${p.manual ? "· Registro manual" : "· Serie sorteada"}</small><br>
      🗺️ <strong>Mapa 1:</strong> ${p.mapa1 || "-"} &nbsp; | &nbsp;
      🗺️ <strong>Mapa 2:</strong> ${p.mapa2 || "-"}<br>
      🟥 <strong>Rojo:</strong> ${(p.rojo || []).join(", ")}<br>
      🟦 <strong>Azul:</strong> ${(p.azul || []).join(", ")}<br>
      🏆 <strong>Ganador:</strong> ${textoGanador(p.ganador)} &nbsp;
      <strong>Marcador:</strong> ${p.marcador || "-"}
      ${esAdmin() ? `
        <div class="historial-acciones">
          <button class="btn-secundario" data-editar="${p.id}">✏️ Editar</button>
          <button class="btn-peligro" data-eliminar="${p.id}">🗑️ Eliminar</button>
        </div>
      ` : ""}
    </div>
  `).join("");

  historialResultados.querySelectorAll("[data-editar]").forEach(btn => {
    btn.addEventListener("click", () => cargarEdicion(btn.dataset.editar));
  });

  historialResultados.querySelectorAll("[data-eliminar]").forEach(btn => {
    btn.addEventListener("click", () => eliminarResultado(btn.dataset.eliminar));
  });
}

function cargarEdicion(id) {
  if (!requiereAdmin()) return;

  const p = partidas.find(x => x.id === id);
  if (!p) return;

  editandoId = id;

  manualRojoNombres.value = (p.rojo || []).join(", ");
  manualAzulNombres.value = (p.azul || []).join(", ");
  manualMapa1.value = p.mapa1 || MAPAS_BASE[0];
  manualMapa2.value = p.mapa2 || MAPAS_BASE[1];
  manualResultado.value = p.ganador || "rojo";
  manualMarcador.value = p.marcador || "3-0";

  if (p.fechaISO) {
    const fecha = new Date(p.fechaISO);
    if (!Number.isNaN(fecha.getTime())) {
      manualFecha.value = fecha.toISOString().slice(0, 16);
    }
  }

  modoEdicion.classList.remove("oculto");
  btnRegistrarManual.textContent = "💾 Actualizar resultado";
  document.querySelector("#modoEdicion").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function eliminarResultado(id) {
  if (!requiereAdmin()) return;

  const p = partidas.find(x => x.id === id);
  const confirmar = confirm(
    `¿Eliminar este resultado?\n${p?.fechaTexto || ""}\nEsta acción recalculará ranking y saldos.`
  );

  if (!confirmar) return;

  await deleteDoc(doc(db, "partidas", id));
}

/* ================= INIT ================= */

renderMapSelects();
renderBombos();
renderPerleoSelect();
renderResultadoMapas();
renderPartidaActual();
configurarRuletaVisual(["Jugador 1", "Jugador 2"]);
inicializarFirebase();
renderAdmin();
renderRankings();
renderPerleos();
renderHistorial();
