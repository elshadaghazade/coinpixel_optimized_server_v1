import { ObjectId } from "mongodb";

export interface ClanType {
    chainId: number;
    clan_id: ObjectId;
    contractAddress: `0x${string}`;
    logoUrl?: string;
    tokenFullName?: string;
    rating: number;
    joined_at: Date;
    ownerAddress: `0x${string}`;
    usersCount: number;
    isMember: boolean;
}

export interface CreateClanParamsType {
    clanName: string;
    contractAddress: `0x${string}`;
    chainId: number;
    tokenFullName?: string;
    tokenSymbol?: string;
    precision?: number;
    totalSupply?: number;
    chainShortName?: string;
    chainName?: string;
}

export enum GET_CLANS_FILTER_ENUM {
    owner,
    other,
    member
}

export interface GetClansParamsType {
    keyword?: string;
    userAddress: `0x${string}`;
    filter: GET_CLANS_FILTER_ENUM;
    page: number;
    limit: number;
}

export interface RemoveClanParamsType extends GetClansParamsType {
    clan_id: string;
}

export interface JoinClanParamsType extends GetClansParamsType {
    clan_id: string;
}

export interface LeaveClanParamsType extends GetClansParamsType {
    clan_id: string;
}

export interface GetClanMembersParamsType {
    clan_id: string;
    page: number;
    limit: number;
}

export interface ClanMemberType {
    memberAddress: `0x${string}`;
    joined_at: string;
    rating: number;
}