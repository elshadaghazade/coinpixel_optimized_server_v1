import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { CoinPixel } from './CoinPixel';
import path from 'node:path';
// import { collectTokens } from './helpers/OKLink/assets';
// import fs from 'node:fs';
// import { socketRateLimitMiddleware } from './rateLimitMiddleware';

const app = express();

const distPath = path.join(__dirname, '../dist');
const imagesPath = path.join(distPath, 'images');
const assetsPath = path.join(distPath, 'assets');

app.use('/images', express.static(imagesPath));
app.use('/assets', express.static(assetsPath));

app.get('/', (_, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


const httpServer = createServer(app);
const io = new Server(httpServer, {
    perMessageDeflate: true,
    cors: {
        origin: process.env.NODE_ENV === 'production' ? undefined : `*`,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

pubClient.connect();
subClient.connect();

io.adapter(createAdapter(pubClient, subClient));

// io.use(socketRateLimitMiddleware);

io.on('connect', async (socket) => {

    try {
        new CoinPixel(io, socket);
    } catch (error) {
        console.error('Error in socket connection', error);
        socket.disconnect();
    }
});

httpServer.listen(process.env.PORT, () => {
    console.log(`Socket server is listening ${process.env.PORT} port`);

    // setInterval(() => {

    //     collectTokens()
    //         .then(tokens => {
    //             fs.writeFileSync('./helpers/OKLink/tokens.json', JSON.stringify(tokens, null, 4), 'utf-8');
    //         }).catch(err => {
    //             console.log("Error:", err);
    //         });

    // }, 1000 * 60 * 60 * 24 * 7);
});