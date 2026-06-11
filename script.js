/* ================= DATOS ================= */

const STORAGE_JUGADORES = "rakionJugadores";
const STORAGE_HISTORIAL = "rakionHistorial";
const STORAGE_REGISTROS = "rakionRegistrosVersus";
const STORAGE_PARTIDA_ACTUAL = "rakionPartidaActual";

let jugadores = JSON.parse(localStorage.getItem(STORAGE_JUGADORES)) || [];
let historial = JSON.parse(localStorage.getItem(STORAGE_HISTORIAL)) || [];
let registrosVersus = JSON.parse(localStorage.getItem(STORAGE_REGISTROS)) || [];
let partidaActual = JSON.parse(localStorage.getItem(STORAGE_PARTIDA_ACTUAL)) || null;

/* Convierte jugadores antiguos tipo texto a objeto */
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
historial = historial.map(h => {
  return {
    id: h.id || Date.now() + Math.random(),
    fecha: h.fecha || "",
    rojo: h.rojo || h.A || [],
    azul: h.azul || h.B || [],
    ganador: h.ganador || null
  };
});

/* ================= ELEMENTOS ================= */

const listaJugadores = document.getElementById("listaJugadores");
const equipoA = document.getElementById("equipoA");
const equipoB = document.getElementById("equipoB");
const ruleta = document.getElementById("ruleta");
const nuevoJugador = document.getElementById("nuevoJugador");
const btnAgregar = document.getElementById("btnAgregar");
const resultadoMapas = document.getElementById("resultadoMapas");
const historialDiv = document.getElementById("historial");
const partidaActualDiv = document.getElementById("partidaActual");
const rankingJugadoresDiv = document.getElementById("rankingJugadores");
const historialVersusDiv = document.getElementById("historialVersus");
const btnGanoRojo = document.getElementById("btnGanoRojo");
const btnGanoAzul = document.getElementById("btnGanoAzul");
const btnEmpate = document.getElementById("btnEmpate");

const manualRojoNombres = document.getElementById("manualRojoNombres");
const manualAzulNombres = document.getElementById("manualAzulNombres");
const manualResultado = document.getElementById("manualResultado");
const manualFecha = document.getElementById("manualFecha");
const btnRegistrarManual = document.getElementById("btnRegistrarManual");

const btnExportarBackup = document.getElementById("btnExportarBackup");
const inputImportarBackup = document.getElementById("inputImportarBackup");
const btnImportarBackup = document.getElementById("btnImportarBackup");

const CLAVE_ADMIN = "zancuditolactala";
let adminActivo = sessionStorage.getItem("rakionAdminActivo") === "true";

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
    estadoAdmin.textContent = "Modo visitante: solo puedes ver los datos y realizar sorteos.";
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

btnSalirAdmin.addEventListener("click", () => {
  setAdminActivo(false);
});

claveAdmin.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    btnEntrarAdmin.click();
  }
});


/* ================= UTILIDADES ================= */

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function limpiarColorGanador() {
  ruleta.classList.remove("texto-ganador");
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
  ruleta.classList.add("ruleta-activa");
}

function detenerRuleta() {
  ruleta.classList.remove("ruleta-activa");
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
  manualFecha.value = "";
}

/* ================= RENDER JUGADORES ================= */

function renderJugadores() {
  listaJugadores.innerHTML = "";

  if (jugadores.length === 0) {
    listaJugadores.innerHTML = `
      <p class="ayuda">Todavía no agregaste jugadores.</p>
    `;
    return;
  }

  jugadores.forEach((jugador, index) => {
    const div = document.createElement("div");
    div.className = "jugador-card";
    div.dataset.index = index;

    div.innerHTML = `
      <input type="checkbox" class="activo" ${jugador.activo ? "checked" : ""}>
      <span>${jugador.nombre}</span>

      <select class="bombo">
        <option value="">Bombo</option>
        <option value="1" ${jugador.bombo === "1" ? "selected" : ""}>Bombo 1</option>
        <option value="2" ${jugador.bombo === "2" ? "selected" : ""}>Bombo 2</option>
        <option value="3" ${jugador.bombo === "3" ? "selected" : ""}>Bombo 3</option>
        <option value="4" ${jugador.bombo === "4" ? "selected" : ""}>Bombo 4</option>
        <option value="5" ${jugador.bombo === "5" ? "selected" : ""}>Bombo 5</option>
        <option value="6" ${jugador.bombo === "6" ? "selected" : ""}>Bombo 6</option>
        <option value="7" ${jugador.bombo === "7" ? "selected" : ""}>Bombo 7</option>
        <option value="8" ${jugador.bombo === "8" ? "selected" : ""}>Bombo 8</option>
      </select>

      <button class="btnEliminar">❌</button>
    `;

    listaJugadores.appendChild(div);
  });

  document.querySelectorAll(".jugador-card").forEach(card => {
    const index = Number(card.dataset.index);

    card.querySelector(".activo").addEventListener("change", e => {
      jugadores[index].activo = e.target.checked;
      guardar();
    });

    card.querySelector(".bombo").addEventListener("change", e => {
      jugadores[index].bombo = e.target.value;
      guardar();
    });

    card.querySelector(".btnEliminar").addEventListener("click", () => {
      if (!requiereAdmin()) return;

      const confirmar = confirm(`¿Eliminar a ${jugadores[index].nombre}?`);

      if (!confirmar) return;

      jugadores.splice(index, 1);
      guardar();
      renderJugadores();
      renderRanking();
    });
  });
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
  renderJugadores();
  renderRanking();
}

btnAgregar.addEventListener("click", agregarJugador);

nuevoJugador.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    agregarJugador();
  }
});

/* ================= ACCIONES JUGADORES ================= */

document.getElementById("btnSeleccionarTodos").addEventListener("click", () => {
  jugadores.forEach(j => j.activo = true);
  guardar();
  renderJugadores();
});

document.getElementById("btnLimpiarSeleccion").addEventListener("click", () => {
  jugadores.forEach(j => j.activo = false);
  guardar();
  renderJugadores();
});

document.getElementById("btnBorrarJugadores").addEventListener("click", () => {
  if (!requiereAdmin()) return;

  if (jugadores.length === 0) return;

  const confirmar = confirm("¿Seguro que deseas borrar todos los jugadores?");

  if (!confirmar) return;

  jugadores = [];
  guardar();
  renderJugadores();
  renderRanking();
});

/* ================= RULETA ================= */

function ruletaPro(lista, duracion = 2200) {
  return new Promise(resolve => {
    activarRuleta();

    let ganador = "";
    const inicio = Date.now();

    const intervalo = setInterval(() => {
      ganador = lista[Math.floor(Math.random() * lista.length)];
      ruleta.innerText = ganador;

      if (Date.now() - inicio >= duracion) {
        clearInterval(intervalo);
        detenerRuleta();
        marcarColorGanador();
        resolve(ganador);
      }
    }, 80);
  });
}

/* ================= SORTEO EQUIPOS ================= */

document.getElementById("btnSortear").addEventListener("click", async () => {
  equipoA.innerHTML = "";
  equipoB.innerHTML = "";

  const seleccionados = jugadores.filter(j => j.activo);

  if (seleccionados.length < 2) {
    alert("Selecciona al menos 2 jugadores");
    return;
  }

  const sinBombo = seleccionados.filter(j => !j.bombo);

  if (sinBombo.length > 0) {
    alert("Todos los jugadores seleccionados deben tener un bombo");
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
      alert(`El bombo ${b} tiene ${bombos[b].length} jugador(es). Cada bombo debe tener EXACTAMENTE 2 jugadores.`);
      return;
    }
  }

  const rojo = [];
  const azul = [];
  const sorteoId = Date.now();

  escribirRuletaNormal("🎡 Iniciando sorteo...");
  await esperar(700);

  for (const b of numerosBombos) {
    escribirRuletaNormal(`🎡 Bombo ${b}`);
    await esperar(800);

    const grupo = mezclar(bombos[b]);
    const ganador = await ruletaPro(grupo);
    const perdedor = grupo.find(nombre => nombre !== ganador);

    const liRojo = document.createElement("li");
    liRojo.textContent = ganador;
    equipoA.appendChild(liRojo);

    const liAzul = document.createElement("li");
    liAzul.textContent = perdedor;
    equipoB.appendChild(liAzul);

    rojo.push(ganador);
    azul.push(perdedor);

    await esperar(650);
  }

  partidaActual = {
    id: sorteoId,
    fechaSorteo: new Date().toLocaleString("es-PE"),
    rojo,
    azul
  };

  historial.unshift({
    id: sorteoId,
    fecha: partidaActual.fechaSorteo,
    rojo,
    azul,
    ganador: null
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
  escribirRuletaNormal("Listo");
});

/* ================= SORTEO DE MAPAS ================= */

document.getElementById("btnSortearMapa").addEventListener("click", async () => {
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

  const ganador1 = await ruletaPro(copia, 3000);
  copia = copia.filter(mapa => mapa !== ganador1);

  resultadoMapas.innerHTML = `
    <div class="mapa-ganador">🥇 1ER LUGAR: <strong>${ganador1}</strong></div>
  `;

  escribirRuletaNormal("🎲 Sorteando 2do mapa...");
  await esperar(800);

  const ganador2 = await ruletaPro(copia, 3000);

  resultadoMapas.innerHTML += `
    <div class="mapa-ganador">🥈 2DO LUGAR: <strong>${ganador2}</strong></div>
  `;

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
}

function registrarGanador(resultado) {
  if (!requiereAdmin()) return;

  if (!partidaActual) {
    alert("Primero debes realizar un sorteo.");
    return;
  }

  const textoResultado =
    resultado === "rojo" ? "ROJO" :
    resultado === "azul" ? "AZUL" :
    "EMPATE";

  const confirmar = confirm(`¿Confirmas el resultado: ${textoResultado}?`);

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

  const empatados = esEmpate
    ? [...partidaActual.rojo, ...partidaActual.azul]
    : [];

  registrosVersus.unshift({
    id: Date.now(),
    sorteoId: partidaActual.id,
    fecha: new Date().toLocaleString("es-PE"),
    ganador: resultado,
    ganadores,
    perdedores,
    empatados,
    rojo: partidaActual.rojo,
    azul: partidaActual.azul
  });

  registrosVersus = registrosVersus.slice(0, 500);

  const sorteo = historial.find(h => h.id === partidaActual.id);

  if (sorteo) {
    sorteo.ganador = resultado;
  }

  partidaActual = null;

  guardar();
  renderPartidaActual();
  renderRanking();
  renderHistorial();
  renderHistorialVersus();

  if (esEmpate) {
    alert(`Empate registrado para: ${empatados.join(", ")}`);
  } else {
    alert(`Victoria registrada para: ${ganadores.join(", ")}`);
  }
}

btnGanoRojo.addEventListener("click", () => registrarGanador("rojo"));
btnGanoAzul.addEventListener("click", () => registrarGanador("azul"));
btnEmpate.addEventListener("click", () => registrarGanador("empate"));

/* ================= RANKING ================= */

function calcularEstadisticas() {
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

  registrosVersus.forEach(registro => {
    if (registro.ganador === "empate") {
      const empatados = registro.empatados || [
        ...(registro.rojo || []),
        ...(registro.azul || [])
      ];

      empatados.forEach(nombre => {
        if (!stats[nombre]) {
          stats[nombre] = {
            jugador: nombre,
            partidas: 0,
            victorias: 0,
            derrotas: 0,
            empates: 0
          };
        }

        stats[nombre].partidas++;
        stats[nombre].empates++;
      });

      return;
    }

    (registro.ganadores || []).forEach(nombre => {
      if (!stats[nombre]) {
        stats[nombre] = {
          jugador: nombre,
          partidas: 0,
          victorias: 0,
          derrotas: 0,
          empates: 0
        };
      }

      stats[nombre].partidas++;
      stats[nombre].victorias++;
    });

    (registro.perdedores || []).forEach(nombre => {
      if (!stats[nombre]) {
        stats[nombre] = {
          jugador: nombre,
          partidas: 0,
          victorias: 0,
          derrotas: 0,
          empates: 0
        };
      }

      stats[nombre].partidas++;
      stats[nombre].derrotas++;
    });
  });

  return Object.values(stats).sort((a, b) => {
    if (b.victorias !== a.victorias) return b.victorias - a.victorias;
    if (b.partidas !== a.partidas) return b.partidas - a.partidas;
    return a.jugador.localeCompare(b.jugador);
  });
}

function renderRanking() {
  const stats = calcularEstadisticas();

  if (stats.length === 0) {
    rankingJugadoresDiv.innerHTML = `<p class="ayuda">Todavía no hay jugadores registrados.</p>`;
    return;
  }

  let filas = "";

  stats.forEach((s, index) => {
    filas += `
      <tr>
        <td>${index + 1}. ${s.jugador}</td>
        <td>${s.partidas}</td>
        <td>${s.victorias}</td>
        <td>${s.derrotas}</td>
        <td>${s.empates}</td>
        <td>${porcentaje(s.victorias, s.partidas)}</td>
      </tr>
    `;
  });

  rankingJugadoresDiv.innerHTML = `
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
        <tbody>
          ${filas}
        </tbody>
      </table>
    </div>
  `;
}

document.getElementById("btnBorrarRegistros").addEventListener("click", () => {
  if (!requiereAdmin()) return;

  if (registrosVersus.length === 0) return;

  const confirmar = confirm("¿Seguro que deseas borrar todos los registros de victorias?");

  if (!confirmar) return;

  registrosVersus = [];
  historial.forEach(h => h.ganador = null);
  partidaActual = null;

  guardar();
  renderPartidaActual();
  renderRanking();
  renderHistorial();
  renderHistorialVersus();
});


/* ================= REGISTRO MANUAL ================= */

function registrarResultadoManual() {
  if (!requiereAdmin()) return;

  const rojo = parsearNombres(manualRojoNombres.value);
  const azul = parsearNombres(manualAzulNombres.value);
  const resultado = manualResultado.value;
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
    `¿Registrar resultado manual?\n\n🟥 Rojo: ${rojo.join(", ")}\n🟦 Azul: ${azul.join(", ")}\n🏆 Resultado: ${textoResultado}`
  );

  if (!confirmar) return;

  agregarJugadoresFaltantes([...rojo, ...azul]);

  const esEmpate = resultado === "empate";

  const ganadores = esEmpate
    ? []
    : resultado === "rojo"
      ? rojo
      : azul;

  const perdedores = esEmpate
    ? []
    : resultado === "rojo"
      ? azul
      : rojo;

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
    manual: true
  });

  registrosVersus = registrosVersus.slice(0, 500);

  historial.unshift({
    id: idManual,
    fecha,
    rojo,
    azul,
    ganador: resultado,
    manual: true
  });

  historial = historial.slice(0, 500);

  guardar();
  limpiarFormularioManual();
  renderJugadores();
  renderRanking();
  renderHistorial();
  renderHistorialVersus();

  alert("Resultado manual registrado correctamente.");
}

btnRegistrarManual.addEventListener("click", registrarResultadoManual);

/* ================= BACKUP ================= */

function crearBackup() {
  return {
    app: "Rakion MT Sorteador",
    version: "manual-backup-1",
    fechaBackup: new Date().toISOString(),
    jugadores,
    historial,
    registrosVersus,
    partidaActual
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
        "¿Importar este backup? Esto reemplazará los jugadores, ranking, historial y partida pendiente de esta PC."
      );

      if (!confirmar) return;

      jugadores = normalizarJugadoresImportados(data.jugadores || []);
      historial = normalizarHistorialImportado(data.historial || []);
      registrosVersus = normalizarRegistrosImportados(data.registrosVersus || []);
      partidaActual = data.partidaActual || null;

      guardar();
      renderJugadores();
      renderPartidaActual();
      renderRanking();
      renderHistorial();
      renderHistorialVersus();

      inputImportarBackup.value = "";

      alert("Backup importado correctamente.");
    } catch (error) {
      alert("No se pudo importar el backup. Verifica que sea un archivo JSON válido.");
    }
  };

  lector.readAsText(archivo);
});


/* ================= HISTORIAL SORTEOS ================= */

function renderHistorial() {
  historialDiv.innerHTML = "";

  if (historial.length === 0) {
    historialDiv.innerHTML = `<p class="ayuda">Todavía no hay sorteos guardados.</p>`;
    return;
  }

  historial.forEach(item => {
    const div = document.createElement("div");
    div.className = "historial-item";

    let ganadorTexto = "Pendiente de registrar";
    if (item.ganador === "rojo") ganadorTexto = `<span class="ganador-rojo">Ganó ROJO</span>`;
    if (item.ganador === "azul") ganadorTexto = `<span class="ganador-azul">Ganó AZUL</span>`;
    if (item.ganador === "empate") ganadorTexto = `<span class="ganador-empate">EMPATE</span>`;

    div.innerHTML = `
      <small>${item.fecha}${item.manual ? " · Registro manual" : ""}</small><br>
      🟥 <strong>Rojo:</strong> ${item.rojo.join(", ")}<br>
      🟦 <strong>Azul:</strong> ${item.azul.join(", ")}<br>
      🏆 <strong>Resultado:</strong> ${ganadorTexto}
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
      🏆 <strong>Ganó:</strong> <span class="${clase}">${equipo}</span><br>
      ✅ <strong>Ganadores:</strong> ${(registro.ganadores || []).join(", ")}<br>
      ❌ <strong>Perdedores:</strong> ${(registro.perdedores || []).join(", ")}
    `;

    historialVersusDiv.appendChild(div);
  });
}

/* ================= INIT ================= */

guardar();
renderJugadores();
renderPartidaActual();
renderRanking();
renderHistorial();
renderHistorialVersus();
renderAdmin();
