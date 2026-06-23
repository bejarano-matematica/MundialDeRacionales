// ==========================================
// VARIABLES GLOBALES DEL JUEGO
// ==========================================
let listadoAlumnos = [];
let listadoEjercicios = [];
let seleccionesMundial = [];

let alumnosDisponibles = [];
let seleccionesDisponibles = [];

// 1. Pizarra en blanco (esto evita errores antes de que carguen los JSON)
let currentMatch = {
    alumnoA: "", alumnoB: "", teamA: null, teamB: null,
    scoreA: 0, scoreB: 0, penalesA: [], penalesB: [], 
    round: 0, subTurno: 'A', ejercicioActual: null, precisionPoints: 0,
    estado: 'NORMAL'
};

// ==========================================
// MOTOR DEL TORNEO (FIXTURE)
// ==========================================
let fasesTorneo = [];
let rondaActualIndex = 0;
let partidoActualIndex = 0;

function inicializarTorneo() {
    let totalJugadores = listadoAlumnos.length;
    let numParticipantes = 2;
    while(numParticipantes < totalJugadores) { numParticipantes *= 2; } 

    let jugadores = [...listadoAlumnos];
    while(jugadores.length < numParticipantes) { jugadores.push("LIBRE"); }
    
    // Mezclamos aleatoriamente para el sorteo de las llaves
    jugadores.sort(() => Math.random() - 0.5);

    let rondaInicial = [];
    for(let i=0; i<jugadores.length; i+=2) {
        rondaInicial.push({ jugadorA: jugadores[i], jugadorB: jugadores[i+1], ganador: null });
    }

    fasesTorneo = [rondaInicial];
    
    // MÁGIA NUEVA: Pre-creamos todo el árbol vacío hasta la final
    let rondaTemporal = rondaInicial;
    while(rondaTemporal.length > 1) {
        let rondaVacia = [];
        for(let i=0; i<rondaTemporal.length; i+=2) {
            rondaVacia.push({ jugadorA: "?", jugadorB: "?", ganador: null });
        }
        fasesTorneo.push(rondaVacia);
        rondaTemporal = rondaVacia;
    }

    rondaActualIndex = 0;
    
    procesarPasesLibres();
    dibujarFixture();
    showScreen('screen-fixture');
}

function procesarPasesLibres() {
    let ronda = fasesTorneo[rondaActualIndex];
    
    ronda.forEach(partido => {
        if(partido.ganador === null) {
            if(partido.jugadorA === "LIBRE" && partido.jugadorB !== "LIBRE") partido.ganador = partido.jugadorB;
            else if(partido.jugadorB === "LIBRE" && partido.jugadorA !== "LIBRE") partido.ganador = partido.jugadorA;
            else if(partido.jugadorA === "LIBRE" && partido.jugadorB === "LIBRE") partido.ganador = "LIBRE";
        }
    });

    let rondaTerminada = ronda.every(p => p.ganador !== null);
    if(rondaTerminada) avanzarSiguienteRonda();
}

function avanzarSiguienteRonda() {
    let rondaAnterior = fasesTorneo[rondaActualIndex];
    if(rondaAnterior.length === 1) return; // Si es 1, ya se jugó la final

    rondaActualIndex++; // Pasamos a la siguiente fase pre-creada
    let nuevaRonda = fasesTorneo[rondaActualIndex];

    // Llenamos la fase con los nombres de los ganadores
    for(let i=0; i<rondaAnterior.length; i+=2) {
        nuevaRonda[i/2].jugadorA = rondaAnterior[i].ganador;
        nuevaRonda[i/2].jugadorB = rondaAnterior[i+1].ganador;
    }
    
    procesarPasesLibres();
}

function dibujarFixture() {
    const container = document.getElementById('bracket-view');
    container.innerHTML = "";

    if (fasesTorneo.length === 0) return;

    let leftSide = document.createElement('div');
    leftSide.className = 'bracket-side left-side';

    let centerSide = document.createElement('div');
    centerSide.className = 'bracket-center';

    let rightSide = document.createElement('div');
    rightSide.className = 'bracket-side right-side';

    function crearCajaPartido(partido, rIndex) {
        let matchDiv = document.createElement('div');
        matchDiv.className = 'bracket-match';
        
        // Evitamos resaltar partidos futuros (los que tienen "?")
        if(rIndex === rondaActualIndex && partido.ganador === null && partido.jugadorA !== "LIBRE" && partido.jugadorB !== "LIBRE" && partido.jugadorA !== "?" && partido.jugadorB !== "?") {
            matchDiv.classList.add('current-match');
        }

        let p1 = document.createElement('div');
        p1.className = 'bracket-player' + (partido.ganador === partido.jugadorA && partido.jugadorA !== "?" ? ' winner' : '');
        p1.innerText = partido.jugadorA;

        let p2 = document.createElement('div');
        p2.className = 'bracket-player' + (partido.ganador === partido.jugadorB && partido.jugadorB !== "?" ? ' winner' : '');
        p2.innerText = partido.jugadorB;

        matchDiv.appendChild(p1);
        matchDiv.appendChild(p2);
        return matchDiv;
    }

    fasesTorneo.forEach((ronda, rIndex) => {
        if (ronda.length === 1) {
            let trofeoDiv = document.createElement('div');
            trofeoDiv.className = 'trophy-img';
            
            centerSide.appendChild(crearCajaPartido(ronda[0], rIndex));
            centerSide.appendChild(trofeoDiv);
            return;
        }

        let mitad = Math.ceil(ronda.length / 2);

        let colLeft = document.createElement('div');
        colLeft.className = 'bracket-round';
        for (let i = 0; i < mitad; i++) {
            colLeft.appendChild(crearCajaPartido(ronda[i], rIndex));
        }
        leftSide.appendChild(colLeft);

        let colRight = document.createElement('div');
        colRight.className = 'bracket-round';
        for (let i = mitad; i < ronda.length; i++) {
            colRight.appendChild(crearCajaPartido(ronda[i], rIndex));
        }
        
        rightSide.prepend(colRight); 
    });

    container.appendChild(leftSide);
    container.appendChild(centerSide);
    container.appendChild(rightSide);
}

function jugarProximoPartido() {
    sfxClick.play();
    let ronda = fasesTorneo[rondaActualIndex];
    let partidoEncontrado = false;

    for (let i = 0; i < ronda.length; i++) {
        if (ronda[i].ganador === null && ronda[i].jugadorA !== "LIBRE" && ronda[i].jugadorB !== "LIBRE" && ronda[i].jugadorA !== "?" && ronda[i].jugadorB !== "?") {
            partidoActualIndex = i;
            partidoEncontrado = true;
            break;
        }
    }

    if(!partidoEncontrado) {
        alert("¡No hay más partidos! Revisá el cuadro.");
        return;
    }

    let partido = ronda[partidoActualIndex];
    seleccionesDisponibles = [...seleccionesMundial].sort(() => Math.random() - 0.5);

    currentMatch = {
        alumnoA: partido.jugadorA,
        alumnoB: partido.jugadorB,
        teamA: seleccionesDisponibles.pop(),
        teamB: seleccionesDisponibles.pop(),
        scoreA: 0, scoreB: 0, subTurno: 'A',
        ejercicioActual: null, precisionPoints: 0, estado: 'NORMAL', round: 0
    };

    mostrarAnimacionSorteo();
}

// ==========================================
// SISTEMA DE SONIDOS SINTETIZADOS (ESTILO ARCADE 8-BITS)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Función matemática para generar los tonos
function playTone(freq, type, duration, vol=0.1) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Envolvente de volumen (empieza fuerte y se apaga suave)
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Clase para engañar al resto de tu código y que funcione sin cambiar nada más
class SynthSound {
    constructor(playAction) { this.playAction = playAction; }
    play() { this.playAction(); }
    cloneNode() { return this; }
    set volume(v) { /* Propiedad ignorada, evita errores de código */ }
}

// 1. Tipeo / Clic (Onda senoidal suave)
const sfxClick = new SynthSound(() => playTone(600, 'sine', 0.1, 0.05));

// 2. Bolillero / Ruleta (Onda triangular rápida)
const sfxRuleta = new SynthSound(() => playTone(800, 'triangle', 0.05, 0.02));

// 3. Alarma de VAR (Onda de sierra grave, suena dos veces como chicharra)
const sfxVar = new SynthSound(() => {
    playTone(150, 'sawtooth', 0.4, 0.2);
    setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.2), 500);
});

// 4. Robar Turno / Power Up (Escala ascendente rápida)
const sfxRobo = new SynthSound(() => {
    playTone(440, 'square', 0.1, 0.05);
    setTimeout(() => playTone(554, 'square', 0.1, 0.05), 100);
    setTimeout(() => playTone(659, 'square', 0.3, 0.05), 200);
});

// 5. Seguir Partido (Tono de cancelación suave)
const sfxSeguir = new SynthSound(() => playTone(300, 'sine', 0.2, 0.05));

// 6. Ganador / Victoria (Fanfarria musical épica de 8-bits)
const sfxGanador = new SynthSound(() => {
    const notas = [523.25, 659.25, 783.99]; // Acorde Do Mayor
    notas.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 'square', 0.15, 0.08), i * 150);
    });
    setTimeout(() => playTone(1046.50, 'square', 0.6, 0.08), 450);
});

// ==========================================
// DICCIONARIO DE BANDERAS (48 EQUIPOS - FLAGCDN)
// ==========================================
const banderasCodigos = {
    // CONMEBOL (Sudamérica)
    "Argentina": "ar",
    "Brasil": "br",
    "Uruguay": "uy",
    "Colombia": "co",
    "Ecuador": "ec",
    "Venezuela": "ve",
    "Perú": "pe",
    "Chile": "cl",

    // UEFA (Europa)
    "Francia": "fr",
    "Alemania": "de",
    "España": "es",
    "Inglaterra": "gb-eng",
    "Portugal": "pt",
    "Países Bajos": "nl",
    "Italia": "it",
    "Bélgica": "be",
    "Croacia": "hr",
    "Suiza": "ch",
    "Dinamarca": "dk",
    "Serbia": "rs",
    "Polonia": "pl",
    "Ucrania": "ua",
    "Suecia": "se",
    "Austria": "at",

    // CONCACAF (Norte, Centroamérica y Caribe)
    "Estados Unidos": "us",
    "México": "mx",
    "Canadá": "ca",
    "Costa Rica": "cr",
    "Panamá": "pa",
    "Jamaica": "jm",

    // CAF (África)
    "Marruecos": "ma",
    "Senegal": "sn",
    "Egipto": "eg",
    "Argelia": "dz",
    "Nigeria": "ng",
    "Costa de Marfil": "ci",
    "Camerún": "cm",
    "Ghana": "gh",
    "Malí": "ml",

    // AFC (Asia)
    "Japón": "jp",
    "Corea del Sur": "kr",
    "Irán": "ir",
    "Australia": "au",
    "Arabia Saudita": "sa",
    "Qatar": "qa",
    "Irak": "iq",
    "Emiratos Árabes Unidos": "ae",

    // OFC (Oceanía)
    "Nueva Zelanda": "nz"
};


// ==========================================
// CARGA DE DATOS CON PROMESAS (FETCH API)
// ==========================================
async function cargarDatosJSON() {
    try {
        // Lanzamos las tres peticiones en paralelo
        const [resAlumnos, resEjercicios, resSelecciones] = await Promise.all([
            fetch('alumnos.json'),
            fetch('ejercicios.json'),
            fetch('selecciones.json')
        ]);

        if (!resAlumnos.ok || !resEjercicios.ok || !resSelecciones.ok) {
            throw new Error("No se pudo cargar uno o más archivos JSON.");
        }

        // Asignamos los datos a nuestras variables globales
        listadoAlumnos = await resAlumnos.json();
        listadoEjercicios = await resEjercicios.json();
        seleccionesMundial = await resSelecciones.json();

        return true;
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        alert("Error al cargar los archivos JSON. Asegurate de estar usando un servidor local (como Live Server).");
        return false;
    }
}

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================
async function initGame() {
    let cargaExitosa = await cargarDatosJSON();
    if (!cargaExitosa) return;
    // Ahora arranca el motor del torneo en vez de un duelo suelto
    inicializarTorneo(); 
}

function nextPenaltyTurn() {
    document.getElementById('main-answer-input').value = "";
    document.getElementById('var-block').style.display = "none";

    let jugadorIndex = currentMatch.round % 5;
    let kickerName = currentMatch.subTurno === 'A' ? currentMatch.teamA.jugadores[jugadorIndex] : currentMatch.teamB.jugadores[jugadorIndex];
    let currentTeamName = currentMatch.subTurno === 'A' ? `${currentMatch.teamA.pais} (${currentMatch.alumnoA})` : `${currentMatch.teamB.pais} (${currentMatch.alumnoB})`;

    document.getElementById('kicker-title').innerText = `Patea: ${kickerName}`;
    document.getElementById('display-team-current').innerText = currentTeamName;

    let randomIdx = Math.floor(Math.random() * listadoEjercicios.length);
    currentMatch.ejercicioActual = listadoEjercicios[randomIdx];

    let mathBox = document.getElementById('math-box');
    mathBox.innerHTML = `$$${currentMatch.ejercicioActual.latex}$$`;
    MathJax.typesetPromise([mathBox]).then(() => {
        startTimer(600); // Arranca el tiempo apenas termina de dibujar la fórmula
    });
}

function pressKey(val) {
    // Clonamos el audio para que se pueda escuchar aunque toquen rápido
    let clickSonido = sfxClick.cloneNode();
    clickSonido.play();

    let input = document.getElementById('main-answer-input');
    if (val === 'clear') input.value = "";
    else if (val === 'backspace') input.value = input.value.slice(0, -1);
    else input.value += val;
}

function parseFraction(str) {
    if(!str) return NaN;
    let parts = str.split('/');
    if(parts.length === 2) return parseFloat(parts[0]) / parseFloat(parts[1]);
    return parseFloat(str);
}

function playAnimation(type, callback) {
    let overlay = document.getElementById('animation-overlay');
    let video = document.getElementById('anim-video');
    
    if(type === 'goal') {
        video.src = 'gol.mp4';
    } else if(type === 'post') {
        video.src = 'palo.mp4';
    } else {
        video.src = 'afuera.mp4';
    }
    
    overlay.classList.add('active'); 
    video.play(); 

    video.onended = () => {
        overlay.classList.remove('active');
        setTimeout(callback, 300); 
    };
}

// ==========================================
// SISTEMA DE TIEMPO (10 MINUTOS)
// ==========================================
let countdownInterval;

function startTimer(seconds) {
    clearInterval(countdownInterval);
    let timeLeft = seconds;
    
    // Función interna para actualizar el texto en formato MM:SS
    function updateDisplay(t) {
        let m = Math.floor(t / 60);
        let s = t % 60;
        document.getElementById('timer-val').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    }

    updateDisplay(timeLeft);
    document.getElementById('timer-box').style.color = "var(--gold)";
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        updateDisplay(timeLeft);
        
        // Cambia a rojo en los últimos 15 segundos para dar tensión
        if(timeLeft <= 15) document.getElementById('timer-box').style.color = "var(--neon-red)"; 
        
        if(timeLeft <= 0) {
            clearInterval(countdownInterval);
            handleTimeOut();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(countdownInterval);
}

function handleTimeOut() {
    if (currentMatch.estado === 'ESPERANDO_PULSADOR') {
        startTieBreaker(); // Si nadie toca, saca otro ejercicio y reinicia el reloj
    } else if (currentMatch.estado === 'VAR') {
        continuarSinVar(); // Se le pasó el tiempo para robar
    } else {
        document.getElementById('main-answer-input').value = "⏰ TIEMPO"; // Tiro normal o respondiendo empate
        submitPenalty(true); // Forzamos el error
    }
}

function mostrarAnimacionSorteo() {
    showScreen('screen-versus');
    let btnPenales = document.querySelector('#screen-versus .btn');
    btnPenales.style.display = "none";

    let ticks = 0;
    let maxTicks = 20; 
    
    let drawInterval = setInterval(() => {
        let tic = sfxRuleta.cloneNode();
        tic.volume = 0.4; 
        tic.play();
        
        let randomTeamA = seleccionesMundial[Math.floor(Math.random() * seleccionesMundial.length)].pais;
        let randomTeamB = seleccionesMundial[Math.floor(Math.random() * seleccionesMundial.length)].pais;
        let randomStudentA = listadoAlumnos[Math.floor(Math.random() * listadoAlumnos.length)];
        let randomStudentB = listadoAlumnos[Math.floor(Math.random() * listadoAlumnos.length)];

        document.getElementById('vs-team-a-name').innerHTML = `🔄 ${randomTeamA}`;
        document.getElementById('vs-student-a').innerText = randomStudentA;
        document.getElementById('vs-team-b-name').innerHTML = `🔄 ${randomTeamB}`;
        document.getElementById('vs-student-b').innerText = randomStudentB;

        ticks++;
        
        if (ticks >= maxTicks) {
            clearInterval(drawInterval);
            let imgBanderaA = banderasCodigos[currentMatch.teamA.pais] ? `<img src="https://flagcdn.com/w40/${banderasCodigos[currentMatch.teamA.pais]}.png" width="30" style="vertical-align: middle; margin-right: 8px; border-radius: 3px;">` : '';
            let imgBanderaB = banderasCodigos[currentMatch.teamB.pais] ? `<img src="https://flagcdn.com/w40/${banderasCodigos[currentMatch.teamB.pais]}.png" width="30" style="vertical-align: middle; margin-right: 8px; border-radius: 3px;">` : '';

            document.getElementById('vs-team-a-name').innerHTML = `${imgBanderaA} ${currentMatch.teamA.pais}`;
            document.getElementById('vs-student-a').innerText = currentMatch.alumnoA;
            
            document.getElementById('vs-team-b-name').innerHTML = `${imgBanderaB} ${currentMatch.teamB.pais}`;
            document.getElementById('vs-student-b').innerText = currentMatch.alumnoB;

            btnPenales.style.display = "block";
        }
    }, 100);
}

function startMatchGameplay() {
    sfxClick.play();
    showScreen('screen-arena');
    document.getElementById('pulsador-block').style.display = "none";
    updateScoreboardUI();
    nextPenaltyTurn();
}

function updateScoreboardUI() {
    document.getElementById('score-text').innerText = `${currentMatch.scoreA} - ${currentMatch.scoreB}`;
    document.getElementById('precision-points-val').innerText = currentMatch.precisionPoints;
    document.getElementById('penalty-dots-current').innerHTML = ""; // Ocultamos los puntos de la vieja tanda
}

function continuarSinVar() {
    sfxSeguir.play(); // Sonido al rechazar el robo
    document.getElementById('var-block').style.display = "none";
    evaluarMarcador();
}

function triggerVarRobo() {
    sfxRobo.play(); // Sonido de confirmación heroica
    currentMatch.estado = 'VAR';
    document.getElementById('var-block').style.display = "none";
    document.getElementById('main-answer-input').value = "";

    let opponentName = currentMatch.subTurno === 'A' ? currentMatch.alumnoB : currentMatch.alumnoA;
    document.getElementById('kicker-title').innerText = `VAR: Responde ${opponentName}`;
    document.getElementById('display-team-current').innerText = "¡INTENTO DE ROBO!";
}

function submitPenalty(isTimeout = false) {
    stopTimer(); // Frenamos el reloj
    
    // Eliminamos todos los espacios en blanco que el alumno pueda haber tipeado
    let userAns = document.getElementById('main-answer-input').value.trim().replace(/\s+/g, '');
    if(!userAns && !isTimeout) return; // Evita patear vacío sin querer

    // --- NUEVA LÓGICA DE VALIDACIÓN ---
    let respuestaCorrecta = currentMatch.ejercicioActual.respuesta;
    let esCorrecto = false;

    if (!isTimeout) {
        // Verifica si lo que escribió el alumno coincide con la respuesta del JSON
        if (userAns === respuestaCorrecta) {
            esCorrecto = true;
        }
    }

    // --- GUARDADO EN EL EXCEL / PDF ---
    let nombrePateador = currentMatch.subTurno === 'A' ? currentMatch.alumnoA : currentMatch.alumnoB;
    let paisPateador = currentMatch.subTurno === 'A' ? currentMatch.teamA.pais : currentMatch.teamB.pais;
    
    let inecuacionPlanteada = currentMatch.ejercicioActual.latex;
    
    let resultadoTiro = esCorrecto ? "Correcto" : (isTimeout ? "Tiempo Agotado" : "Incorrecto");
    let puntosGanados = esCorrecto ? (currentMatch.estado === 'VAR' ? 50 : 100) : 0;

    historialBoletin.push({
        alumno: nombrePateador,
        equipo: paisPateador,
        ejercicio: inecuacionPlanteada,
        respuesta: respuestaCorrecta, // Ahora guarda la respuesta exacta
        estado: resultadoTiro,
        puntos: puntosGanados
    });
    // ----------------------------------------------

    // CASO 1: MUERTE SÚBITA
    if (currentMatch.estado === 'TIEBREAKER') {
        if (esCorrecto) {
            playAnimation('goal', () => {
                if(currentMatch.subTurno === 'A') currentMatch.scoreA++; else currentMatch.scoreB++;
                endMatch();
            });
        } else {
            playAnimation('miss', () => {
                if(currentMatch.subTurno === 'A') currentMatch.scoreB++; else currentMatch.scoreA++;
                endMatch();
            });
        }
        return;
    }

    // CASO 2: ROBO DE VAR
    if (currentMatch.estado === 'VAR') {
        if (esCorrecto) {
            playAnimation('goal', () => {
                if(currentMatch.subTurno === 'A') currentMatch.scoreB++; else currentMatch.scoreA++;
                currentMatch.precisionPoints += 50;
                evaluarMarcador();
            });
        } else {
            playAnimation('miss', () => { evaluarMarcador(); });
        }
        return;
    }

    // CASO 3: TIRO NORMAL
    if (esCorrecto) {
        playAnimation('goal', () => {
            if(currentMatch.subTurno === 'A') currentMatch.scoreA++; else currentMatch.scoreB++;
            currentMatch.precisionPoints += 100;
            evaluarMarcador();
        });
    } else {
        let animType = 'miss';
        
        // Hacemos que pegue en el palo el 30% de las veces que fallan (si no fue por tiempo)
        if (!isTimeout) {
            if (Math.random() < 0.3) {
                animType = 'post';
            }
        }

        playAnimation(animType, () => {
            if (isTimeout) {
                evaluarMarcador(); 
            } else {
                let opponentStudent = currentMatch.subTurno === 'A' ? currentMatch.alumnoB : currentMatch.alumnoA;
                document.getElementById('var-text').innerText = `¡Oportunidad de VAR! Si ${opponentStudent} calcula la respuesta exacta, roba el punto.`;
                document.getElementById('var-block').style.display = "block";
                
                // ELIMINADO: dibujarRectaEnCanvas(validInterval);
                
                sfxVar.play();
                startTimer(600); // 10 segundos para robar el turno
            }
        });
    }
}

function evaluarMarcador() {
    updateScoreboardUI();

    // ¿Alguien llegó a 2 goles? Gana el partido.
    if (currentMatch.scoreA === 2 || currentMatch.scoreB === 2) { 
        endMatch(); 
        return; 
    }

    // ¿Están empatados 1 a 1? Muerte súbita.
    if (currentMatch.scoreA === 1 && currentMatch.scoreB === 1) {
        startTieBreaker();
        return;
    }

    // Sumamos una ronda si el equipo B terminó su turno
    if (currentMatch.subTurno === 'B') {
        currentMatch.round++;
    }

    // Si nadie ganó ni empató en 1, cambia el turno y sigue normal.
    currentMatch.subTurno = currentMatch.subTurno === 'A' ? 'B' : 'A';
    currentMatch.estado = 'NORMAL';
    nextPenaltyTurn();
}
function startTieBreaker() {
    currentMatch.estado = 'ESPERANDO_PULSADOR';
    document.getElementById('main-answer-input').value = "";
    
    // Asignación de Iniciales Dinámicas
    currentMatch.teclaA = currentMatch.alumnoA.charAt(0).toUpperCase();
    currentMatch.teclaB = currentMatch.alumnoB.charAt(0).toUpperCase();
    
    // Si las iniciales son iguales, le damos la segunda letra al alumno B
    if (currentMatch.teclaA === currentMatch.teclaB) {
        currentMatch.teclaB = currentMatch.alumnoB.charAt(1).toUpperCase();
    }

    document.getElementById('btn-pul-a').innerText = currentMatch.teclaA;
    document.getElementById('btn-pul-b').innerText = currentMatch.teclaB;
    
    document.getElementById('kicker-title').innerText = `¡MANOS AL TECLADO!`;
    document.getElementById('display-team-current').innerText = "El más rápido responde...";

    document.getElementById('pul-player-a').innerText = currentMatch.alumnoA;
    document.getElementById('pul-player-b').innerText = currentMatch.alumnoB;
    document.getElementById('pulsador-block').style.display = "block";

    let randomIdx = Math.floor(Math.random() * listadoEjercicios.length);
    currentMatch.ejercicioActual = listadoEjercicios[randomIdx];
    let mathBox = document.getElementById('math-box');
    mathBox.innerHTML = `$$${currentMatch.ejercicioActual.latex}$$`;
    MathJax.typesetPromise([mathBox]).then(() => {
        startTimer(600); // Tienen 10 segundos para reaccionar
    });
}

function handlePulsador(key) {
    if (currentMatch.estado !== 'ESPERANDO_PULSADOR') return;
    
    let teclaPresionada = key.toUpperCase();

    if (teclaPresionada === currentMatch.teclaA || teclaPresionada === 'A_BTN') {
        currentMatch.subTurno = 'A';
        activarInputDespuesDePulsador(currentMatch.alumnoA, currentMatch.teamA.pais);
    } else if (teclaPresionada === currentMatch.teclaB || teclaPresionada === 'B_BTN') {
        currentMatch.subTurno = 'B';
        activarInputDespuesDePulsador(currentMatch.alumnoB, currentMatch.teamB.pais);
    }
}

function activarInputDespuesDePulsador(alumno, pais) {
    currentMatch.estado = 'TIEBREAKER';
    document.getElementById('pulsador-block').style.display = "none";
    document.getElementById('kicker-title').innerText = `¡RESPONDE: ${alumno}!`;
    document.getElementById('display-team-current').innerText = `Si acierta gana, si falla gana el rival.`;
    startTimer(600); // Tienen 10 segundos para ingresar el resultado
}

function endMatch() {
    sfxGanador.play(); 
    showScreen('screen-result');
    document.getElementById('final-match-score').innerText = `${currentMatch.scoreA} - ${currentMatch.scoreB}`;
    
    let isAWinner = currentMatch.scoreA > currentMatch.scoreB;
    let winnerPais = isAWinner ? currentMatch.teamA.pais : currentMatch.teamB.pais;
    let winnerAlumno = isAWinner ? currentMatch.alumnoA : currentMatch.alumnoB;
    
    // ANOTAMOS AL GANADOR EN EL CUADRO DEL TORNEO
    fasesTorneo[rondaActualIndex][partidoActualIndex].ganador = winnerAlumno;
    
    document.getElementById('final-winner-text').innerText = `¡Ganador: ${winnerPais} (${winnerAlumno})!`;
    document.getElementById('final-precision-text').innerText = `Puntos de precisión: ${currentMatch.precisionPoints} pts.`;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ==========================================
// LISTENER GLOBAL DE TECLADO FÍSICO
// ==========================================
document.addEventListener('keydown', function(event) {
    if (!document.getElementById('screen-arena').classList.contains('active')) return;

    // Si estamos esperando el pulsador, SOLO escuchamos las letras asignadas
    if (currentMatch.estado === 'ESPERANDO_PULSADOR') {
        let teclaPresionada = event.key.toUpperCase();
        if (teclaPresionada === currentMatch.teclaA || teclaPresionada === currentMatch.teclaB) {
            handlePulsador(teclaPresionada);
        }
        return; 
    }

    // Teclas permitidas para responder el ejercicio
    const teclasPermitidas = 
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '/', 'x', '<', '>', '(', ')', '[', ']', ';'];
    


    if (teclasPermitidas.includes(event.key)) {
        pressKey(event.key);
    } else if (event.key === 'Backspace') {
        pressKey('backspace');
    } else if (event.key === 'Enter') {
        event.preventDefault(); 
        submitPenalty();
    } else if (event.key.toLowerCase() === 'c') {
        pressKey('clear');
    }
});
// ==========================================
// BOLETÍN Y RECTA NUMÉRICA
// ==========================================
let historialBoletin = []; // Acá se van a ir guardando los tiros de todos

function exportarBoletin() {
    // Creamos un contenedor temporal para armar la tabla del PDF
    let divPDF = document.createElement('div');
    divPDF.style.padding = "20px";
    divPDF.style.fontFamily = "'Montserrat', sans-serif";
    
    let html = `
        <h2 style="text-align: center; color: #14532d;">🏆 Boletín de Resultados - Racionales 🏆</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; font-size: 14px;">
            <thead>
                <tr style="background-color: #16a34a; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Alumno</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Equipo</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Ejercicio</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Respuesta Correcta</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Estado</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Puntos</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    historialBoletin.forEach(row => {
        html += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.alumno}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.equipo}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">$$${row.ejercicio}$$</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.respuesta}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.estado}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.puntos}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    divPDF.innerHTML = html;
    document.body.appendChild(divPDF);

    // Le pedimos a MathJax que procese las fórmulas matemáticas primero
    MathJax.typesetPromise([divPDF]).then(() => {
        let opt = {
            margin:       15,
            filename:     'Boletin_Racionales.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 }, // Mayor escala = mejor resolución
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generamos el PDF y destruimos el div temporal
        html2pdf().set(opt).from(divPDF).save().then(() => {
            document.body.removeChild(divPDF);
        });
    });
}

