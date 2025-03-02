import { ObjectId, WithId } from "mongodb";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

// export type SocketType = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
export type SocketType = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
export type ioType = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

export interface UserDocumentType {
    _id?: ObjectId;
    address: string;
    pixelLimit: number;
    pixelLimitIsCreatedAt: Date;
}

export interface SettingsDocumentType {
    _id?: ObjectId;
    colors: string[],
    pixel_limit: number;
    area_width: number;
    area_height: number;
}

export interface TokensCollectionType {
    _id?: ObjectId;
    chainShortName: string;
    chainId: number;
    chainName: string;
    tokenFullName: string;
    tokenSymbol: string;
    precision?: number;
    tokenContractAddress: string;
    protocolType: string;
    addressCount?: number;
    totalSupply?: number;
    circulatingSupply?: number;
    price?: number;
    website?: string;
    totalMarketCap?: number;
    issueDate?: Date,
    transactionAmount24h?: number;
    tvl?: number;
    logoUrl?: string;
}

export interface ClanCollectionType {
    _id?: ObjectId,
    clanName: string;
    chainId: number;
    contractAddress: string;
    ownerAddress: string;
    createdAt: Date;
}

export interface ClanType {
    chainId: number;
    clan_id: ObjectId;
    contractAddress: string;
    joined_at: Date;
    ownerAddress: string;
}

export interface ClanMembersCollectionType {
    _id?: ObjectId;
    clan_id: ObjectId;
    memberAddress: string;
    joined_at: Date;
}

export interface MeType {
    user: WithId<UserDocumentType>;
    settings: WithId<SettingsDocumentType>;
}

export type PixelType = {
    _id?: string;
    color?: string;
    row: number;
    col: number;
    address?: string;
    date?: Date | string;
}

export type OffsetType = {
    rowsCount: number;
    colsCount: number;
};

export enum user_socket_command_enum {
    user_init = "1",
    user_set_pixel = "2",
    user_remove_pixel = "3",
    user_require_area_data = "4",
    user_update_pixel_limit = "5",
    user_get_settings = "6",
    user_search_token = "7",
    user_get_my_clans = "8",
    user_verify_clan_name = "9",
    user_create_clan = "10"
}

export enum server_socket_command_enum {
    server_init_result = "1",
    server_set_pixel = "2",
    server_remove_pixel = "3",
    server_area_data = "4",
    server_set_settings = "5",
    server_token_list = "6",
    server_set_user_clans = "7",
    server_clan_name_exists = "8",
    server_clan_created = "9",
    server_clan_create_error = "10",
}