import {
    ioType,
    MeType,
    OffsetType,
    PixelType,
    server_socket_command_enum,
    SocketType,
    user_socket_command_enum
} from './types';
import { RedisClient } from './RedisClient';
import { initUser } from './services/users';
import { getAreaData, removePixel, setPixel, updatePixelLimit } from './services/pixels';
import { getSettings } from './mongodb';
import { TokenSearchParamsType } from './types/tokens';
import { searchToken } from './services/tokens';
import { createClan, getMyClans, verifyClanName } from './services/clans';
import { CreateClanParamsType } from './types/clans';

export class CoinPixel {

    me?: MeType;

    private redisClient: RedisClient | null = null;
    constructor(
        public io?: ioType,
        public socket?: SocketType,
    ) {
        this.onAny = this.onAny.bind(this);
        this.disconnect = this.disconnect.bind(this);
        
        socket?.on('disconnecting', this.disconnect);
        socket?.onAny((event_name: user_socket_command_enum, data: any) => {
            (async () => {
                await this.onAny(event_name, data);
            })();
        });
    }

    async onAny(event_name: user_socket_command_enum, data: any) {

        switch (event_name) {
            case user_socket_command_enum.user_init:
                await this.init(data);
                break;
            case user_socket_command_enum.user_set_pixel:
                await this.setPixel(data);
                break;
            case user_socket_command_enum.user_remove_pixel:
                await this.removePixel(data);
                break;
            case user_socket_command_enum.user_require_area_data:
                await this.userRequireAreaData(data);
                break;
            case user_socket_command_enum.user_update_pixel_limit:
                await this.userUpdatePixelLimit(data);
                break;
            case user_socket_command_enum.user_get_settings:
                await this.userGetSettings();
                break;
            case user_socket_command_enum.user_search_token:
                await this.userSearchToken(data);
                break;
            case user_socket_command_enum.user_get_my_clans:
                await this.userGetMyClans();
                break;
            case user_socket_command_enum.user_verify_clan_name:
                await this.userVerifyClanName(data);
                break;
            case user_socket_command_enum.user_create_clan:
                await this.userCreateClan(data);
                break;
        }
    }

    async init(address: string) {
        if (!this.socket?.connected || !this.socket?.id) {
            return;
        }

        try {
            this.me = await initUser(address);

            this.socket?.emit(server_socket_command_enum.server_init_result, this.me);

        } catch (err) {
            console.error(err);
        }
    }

    async setPixel(data: {
        item: PixelType;
        offset: OffsetType
    }) {
        if (this.me?.user.address !== data.item.address || !this.socket?.connected) {
            return;
        }

        try {
            const pixel = await setPixel(data.item, data.offset);
            if (pixel) {
                this.socket.broadcast.emit(server_socket_command_enum.server_set_pixel, pixel);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async removePixel(data: [string, number, number]) {
        if (this.me?.user.address !== data[0] || !this.socket?.connected) {
            return;
        }

        try {
            const isDeleted = await removePixel(data);
            if (isDeleted) {
                this.socket.broadcast.emit(server_socket_command_enum.server_remove_pixel, [data[1], data[2]]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async userRequireAreaData (data: [[number, number], [number, number], string]) {
        try {
            if (!this.socket?.connected) {
                return;
            }

            const t1 = Date.now();
            await getAreaData(data, this.socket);
            const t2 = Date.now();
            console.log("diff:", (t2 - t1) / 1000);
        } catch (err) {
            console.error(err);
        }
    }

    async userUpdatePixelLimit (pixelLimit: number) {
        if (!this.me?.user.address) {
            return;
        }

        try {
            updatePixelLimit(pixelLimit, this.me?.user.address);
        } catch (err) {
            console.error(err);
        }
    }

    async userSearchToken (params: TokenSearchParamsType) {
        if (!this.me?.user.address || !this.socket?.connected) {
            return;
        }

        try {
            const tokens = await searchToken(params);
            this.socket.emit(server_socket_command_enum.server_token_list, tokens);
        } catch (err) {
            console.error(err);
        }
    }

    async userGetMyClans () {
        if (!this.me?.user.address || !this.socket?.connected) {
            return;
        }

        try {
            const clans = await getMyClans({
                userAddress: this.me.user.address
            });

            this.socket.emit(server_socket_command_enum.server_set_user_clans, clans);
        } catch (err) {
            console.error(err);
        }

    }

    async userVerifyClanName (clanName: string) {
        if (!this.me?.user.address || !this.socket?.connected) {
            return;
        }

        try {
            const exists = await verifyClanName(clanName);
            if (exists) {
                this.socket.emit(server_socket_command_enum.server_clan_name_exists);
            }
        } catch (err) {
            console.error(err);
        }

    }

    async userCreateClan (data: CreateClanParamsType) {
        if (!this.me?.user.address || !this.socket?.connected) {
            return;
        }

        try {
            await createClan(data, this.me.user.address);
            this.socket.emit(server_socket_command_enum.server_clan_created);
        } catch (err: any) {
            this.socket.emit(server_socket_command_enum.server_clan_create_error, err.toString());
            console.error(err);
        }
    }

    

    async disconnect() {

        if (this.me) {
            await this.redisClient?.removeHash(this.me.user.address, this.socket?.id!);
        }

        if (this.socket) {
            this.socket.offAny();
            this.socket.off('disconnecting', this.disconnect);
            if (this.socket.connected) {
                this.socket.disconnect(true);
            }
        }

        this.socket = undefined;
        this.io = undefined;
        this.me = undefined;
        
        if (global.gc) {
            global.gc();
        }
    }

    async userGetSettings () {
        if (!this.socket?.connected) {
            return;
        }

        const settings = await getSettings();
        if (!settings) {
            return;
        }

        this.socket.emit(server_socket_command_enum.server_set_settings, settings);
    }
}