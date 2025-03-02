import { RedisClientType } from "redis";

export class RedisClient {
    constructor(
        private pubClient: RedisClientType,
    ) {}

    async publish(socketId: string, data: any) {
        await this.pubClient.publish(`channel_${socketId}`, JSON.stringify(data));
    }

    async saveMyChannel(address: string, socketId: string) {
        try {
            const channels = await this.pubClient.hGet('channels', address);
            if (channels) {
                const arr = JSON.parse(channels);
                if (arr instanceof Array) {
                    const set = new Set(arr);
                    set.add(socketId);
                    await this.pubClient.hSet('channels', address, JSON.stringify(Array.from(set)));
                } else {
                    await this.pubClient.hSet('channels', address, JSON.stringify([socketId]));
                }
            } else {
                await this.pubClient.hSet('channels', address, JSON.stringify([socketId]));
            }
        } catch (err) {}
    }

    async removeHash(address: string, socketId: string) {
        try {
            const channels = await this.pubClient.hGet('channels', address);
            if (channels) {
                const arr = JSON.parse(channels);
                if (arr instanceof Array && arr.length) {
                    const set = new Set(arr);
                    set.delete(socketId);
                    await this.pubClient.hSet('channels', address, JSON.stringify(Array.from(set)));
                }
            }
        } catch (err) {}
    }
}