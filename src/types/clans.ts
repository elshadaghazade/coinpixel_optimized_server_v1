import { ObjectId } from "mongodb";

export interface ClanType {
    chainId: number;
    clan_id: ObjectId;
    contractAddress: string;
    logoUrl?: string;
    tokenFullName?: string;
    rating: number;
    joined_at: Date;
    ownerAddress: string;
    usersCount: number;
    isMember: boolean;
}

export interface CreateClanParamsType {
    clanName: string;
    contractAddress: string;
    chainId: number;
    tokenFullName?: string;
    tokenSymbol?: string;
    precision?: number;
    totalSupply?: number;
    chainShortName?: string;
    chainName?: string;
}

export interface GetClansParamsType {
    keyword?: string;
    userAddress: string;
    isOwner: boolean;
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
    memberAddress: string;
    joined_at: string;
    rating: number;
}