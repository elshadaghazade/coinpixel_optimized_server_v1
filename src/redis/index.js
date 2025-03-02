const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6378;

const client = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

client.on('error', err => {
    console.log('Redis Client Error', err);
    process.exit(0);
});

async function main () {
    await client.connect();
}

main();

module.exports = client;