const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const socket = io('http://localhost:3000', { transports: ["websocket"] });

const paddleWidth = 10;
const paddleHeight = 60;
const ballSize = 10;

let myPaddleY = 175;
let opponentPaddleY = 175;
let myScore = 0;
let opponentScore = 0;
let players = {};
let ball = {
    x: 300,
    y: 200,
    speedX: 5,
    speedY: 5,
};
let isGameStarted = false;
let flag = false;
let ping = 0; 

socket.on('connect', () => {
    // Botón para iniciar el juego
    document.getElementById('startButton').addEventListener('click', function () {
        socket.emit('mensaje', 'Hola, servidor!');
    }); 
    
    setTimeout(() => {
        realizarPing();
    }, "1000");
});

socket.on('evento', (data) => {
    console.log('dos en sala', data);
    players = data;
    isGameStarted = true;
    flag = false;
    draw();
});


socket.on('actualizarPelota', (data) => {
    ball.x = data.x;
    ball.y = data.y;
});

socket.on('actualizarJugador', (data) => {
    myPaddleY = data.y;
});

socket.on('actualizarOponente', (data) => { 
    opponentPaddleY = data.y;
});

socket.on('actMyScore', (data) => {
    myScore = data;
});

socket.on('actOpponentScore', (data) => { 
    opponentScore = data;
});

function realizarPing() {
    const inicio = Date.now(); // Registra el tiempo de inicio del ping
    socket.emit('ping', inicio); // Manejar la respuesta del servidor
    socket.on('pong', (tiempoInicio) => {
    const fin = Date.now(); // Registra el tiempo de finalización del ping
    ping = fin - tiempoInicio;
    document.getElementById('ping').innerHTML = `Tiempo del ping : ${ping}`;
    debugger
    console.log(`Ping al servidor: ${ping} ms`)
    });
}
   
socket.on('estadisticas', (estadisticas) => {
    // Mostrar estadísticas en el elemento con id 'estadisticas' en el HTML
    realizarPing();
    const estadisticasElement = document.getElementById('estadisticas');
    estadisticasElement.innerHTML = `
      <h2>Estadísticas de Conexión</h2>
      <p>Socket ID: ${socket.id}</p>
      <p id="ping">Tiempo del ping : ${ping}</p>
      <p>Conexiones Totales: ${estadisticas.conexionesTotales}</p>
      <p>Desconexiones Totales: ${estadisticas.desconexionesTotales}</p>
    `;
  });
  


socket.on('recargar', (players) => {
    console.log(players);
    ball.x = 300;
    ball.y = 200;
    ball.speedX = 5;
    ball.speedY = 5;
    myPaddleY = 175;
    opponentPaddleY = 175;
    myScore = 0;
    opponentScore = 0;
    flag = true;
});

canvas.addEventListener('mousemove', (event) => {
    // Mover mi paleta con el movimiento del ratón
    if(players){
         const mouseY = event.clientY - canvas.getBoundingClientRect().top - paddleHeight / 2;
        if (players[socket.id].flag) {
            if (mouseY >= 0 && mouseY <= canvas.height - paddleHeight) {
            myPaddleY = mouseY;
            socket.emit('moverJugador', {x: 0, y: myPaddleY ,score: 0});
            }
        } else{
            if (mouseY >= 0 && mouseY <= canvas.height - paddleHeight) {
                opponentPaddleY = mouseY;
                socket.emit('moverOponente', { x: 0, y: opponentPaddleY});
            }
        }
    }
});


function draw() {
    if (isGameStarted) {
        // Dibuja el tablero
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Dibuja las paletas
        context.fillStyle = '#fff';
        context.fillRect(0, myPaddleY, paddleWidth, paddleHeight);
        context.fillRect(canvas.width - paddleWidth, opponentPaddleY, paddleWidth, paddleHeight);

        // Dibuja la pelota
        context.beginPath();
        context.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
        context.fill();

        // Dibuja los puntajes
        context.font = '30px Arial';
        context.fillText(myScore, 100, 50);
        context.fillText(opponentScore, canvas.width - 100, 50);

        if(flag){
            // Dibuja el tablero
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }else{
            // Solicita el siguiente cuadro de animación
            requestAnimationFrame(draw);
        }    
    }
}

