const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const players = {};
const ball = {
    x: 300,
    y: 200,
    speedX: 5,
    speedY: 5,
};
const canvas = {
    height: 400,
    width: 600,
}

const paddleWidth = 10;
const paddleHeight = 60;
const ballSize = 10;

let myPaddleY = 175;
let opponentPaddleY = 175;
let myScore = 0;
let opponentScore = 0;

let current = true;
let conexionesTotales = 0;
let desconexionesTotales = 0;


io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Agregar nuevo jugador
    players[socket.id] = {
        flag: current,
        x: 0,
        y: 175, score: 0,
    };
    current = false;

    conexionesTotales++;
    io.emit('estadisticas', { conexionesTotales, desconexionesTotales })

    socket.on('mensaje', (data) => {
        console.log('Mensaje del cliente:', data);
        io.emit('evento', players);
        generaPelota();
    });

    // Manejar el evento 'ping' del cliente
    socket.on('ping', (tiempoInicio) => {
        socket.emit('pong', tiempoInicio);
    });

    socket.on('moverJugador', (data) => {
        myPaddleY = data.y;
        io.emit('actualizarJugador', data);
    });

    socket.on('moverOponente', (data) => {
        opponentPaddleY = data.y;
        io.emit('actualizarOponente', data);
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        current = players[socket.id].flag
        delete players[socket.id];
        reset();
        conexionesTotales--;
        desconexionesTotales++;
        io.emit('recargar', {});
        io.emit('estadisticas', { conexionesTotales, desconexionesTotales });
    });
});

server.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

function generaPelota() {
    // Actualiza la posición de la pelota
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    io.emit('actualizarPelota', ball);

    // Comprueba si la pelota golpea la pared superior
    if (ball.y <= 0) {
        ball.y = 0;
        ball.speedY = -ball.speedY;
        io.emit('actualizarPelota', ball);
    }

    // Comprueba si la pelota golpea la pared inferior
    if (ball.y >= canvas.height) {
        ball.y = canvas.height;
        ball.speedY = -ball.speedY;
        io.emit('actualizarPelota', ball);
    }

    // Comprueba si la pelota golpea la paleta del jugador
    if (ball.x <= paddleWidth + 10 && ball.y >= myPaddleY - ballSize && ball.y <= myPaddleY + paddleHeight / 2) {
        ball.x = 0;
        ball.speedX = 5;
        io.emit('actualizarPelota', ball);
    }

    // Comprueba si la pelota golpea la paleta del oponente
    if (ball.x >= canvas.width - paddleWidth - 10 && ball.y >= opponentPaddleY - ballSize && ball.y <= opponentPaddleY + paddleHeight / 2) {
        ball.x = canvas.width;
        ball.speedX = -5;
        io.emit('actualizarPelota', ball);
    }

    // Comprueba si la pelota golpea el lado derecho
    if (ball.x > canvas.width + 50) {
        // Actualiza el puntaje del oponente
        opponentScore++;
        // Reinicia la pelota
        ball.x = 300;
        ball.y = 200;
        ball.speedX = 5;
        ball.speedY = 5;
        io.emit('actualizarPelota', ball);
        io.emit('actOpponentScore', opponentScore);
    }

    // Comprueba si la pelota golpea el lado izquierdo
    if (ball.x < -10) {
        // Actualiza el puntaje del jugador
        myScore++;
        // Reinicia la pelota
        ball.x = 300;
        ball.y = 200;
        ball.speedX = -5;
        ball.speedY = 5;
        io.emit('actualizarPelota', ball);
        io.emit('actMyScore', myScore);
    }

    setTimeout(() => {
        generaPelota();
    }, "5");
}

function reset() {
    ball.x = 300;
    ball.y = 200;
    ball.speedX = 5;
    ball.speedY = 5;
    myPaddleY = 175;
    opponentPaddleY = 175;
    myScore = 0;
    opponentScore = 0;
}