import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);
const io = new Server(server);

//app.use(http.middleware);                 // Add serverless-http middleware
//exports.handler = netlifyLambda.handler;  // Export Netlify Lambda handler

const PlayerServer = {};
const ballServer = {
    x: 300,
    y: 200,
    speedX: 5,
    speedY: 5,
};
const canvasServer = {
    height: 400,
    width: 600,
}
const paddleWidthServer = 10;
const paddleHeightServer = 60;
const ballSizeServer = 10;
let myPaddleYServer = 175;
let opponentPaddleYServer = 175;
let myScoreServer = 0;
let opponentScoreServer = 0;
let current = true;
let conexionesTotales = 0;
let desconexionesTotales = 0;

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Agregar nuevo jugador
    PlayerServer[socket.id] = {
        flag: current,
        x: 0,
        y: 175, score: 0,
    };
    current = false;

    conexionesTotales++;
    io.emit('estadisticas', { conexionesTotales, desconexionesTotales })

    socket.on('mensaje', (data) => {
        console.log('Mensaje del cliente:', data);
        io.emit('evento', PlayerServer);
        generaPelota();
    });

    // Manejar el evento 'ping' del cliente
    socket.on('ping', (tiempoInicio) => {
        socket.emit('pong', tiempoInicio);
    });

    socket.on('moverJugador', (data) => {
        myPaddleYServer = data.y;
        io.emit('actualizarJugador', data);
    });

    socket.on('moverOponente', (data) => {
        opponentPaddleYServer = data.y;
        io.emit('actualizarOponente', data);
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        current = PlayerServer[socket.id].flag
        delete PlayerServer[socket.id];
        reset();
        conexionesTotales--;
        desconexionesTotales++;
        io.emit('recargar', {});
        io.emit('estadisticas', { conexionesTotales, desconexionesTotales });
    });
});

server.listen(3000, () => {
    console.log(`Servidor en ejecución`);
});

function generaPelota() {
    // Actualiza la posición de la pelota
    ballServer.x += ballServer.speedX;
    ballServer.y += ballServer.speedY;
    io.emit('actualizarPelota', ball);

    // Comprueba si la pelota golpea la pared superior
    if (ballServer.y <= 0) {
        ballServer.y = 0;
        ballServer.speedY = -ball.speedY;
        io.emit('actualizarPelota', ball);
    }

    // Comprueba si la pelota golpea la pared inferior
    if (ballServer.y >= canvasServer.height) {
        ballServer.y = canvasServer.height;
        ballServer.speedY = -ballServer.speedY;
        io.emit('actualizarPelota', ball);
    }

    // Comprueba si la pelota golpea la paleta del jugador
    if (ballServer.x <= paddleWidthServer + 10 && ballServer.y >= myPaddleYServer - ballSizeServer && ballServer.y <= myPaddleYServer + paddleHeightServer / 2) {
        ballServer.x = 0;
        ballServer.speedX = 5;
        io.emit('actualizarPelota', ballServer);
    }

    // Comprueba si la pelota golpea la paleta del oponente
    if (ballServer.x >= canvasServer.width - paddleWidthServer - 10 && ballServer.y >= opponentPaddleYServer - ballSizeServer && ballServer.y <= opponentPaddleYServer + paddleHeightServer / 2) {
        ballServer.x = canvasServer.width;
        ballServer.speedX = -5;
        io.emit('actualizarPelota', ballServer);
    }

    // Comprueba si la pelota golpea el lado derecho
    if (ballServer.x > canvasServer.width + 50) {
        // Actualiza el puntaje del oponente
        opponentScoreServer++;
        // Reinicia la pelota
        ballServer.x = 300;
        ballServer.y = 200;
        ballServer.speedX = 5;
        ballServer.speedY = 5;
        io.emit('actualizarPelota', ballServer);
        io.emit('actOpponentScore', opponentScoreServer);
    }

    // Comprueba si la pelota golpea el lado izquierdo
    if (ballServer.x < -10) {
        // Actualiza el puntaje del jugador
        myScoreServer++;
        // Reinicia la pelota
        ballServer.x = 300;
        ballServer.y = 200;
        ballServer.speedX = -5;
        ballServer.speedY = 5;
        io.emit('actualizarPelota', ballServer);
        io.emit('actMyScore', myScoreServer);
    }

    setTimeout(() => {
        generaPelota();
    }, "5");
}

function reset() {
    ballServer.x = 300;
    ballServer.y = 200;
    ballServer.speedX = 5;
    ballServer.speedY = 5;
    myPaddleYServer = 175;
    opponentPaddleYServer = 175;
    myScoreServer = 0;
    opponentScoreServer = 0;
}