import { clanMembersCollection, clansCollection, tokensCollection } from "../../mongodb";
import { ClanType } from "../../types";
import { CreateClanParamsType } from "../../types/clans";

export const getMyClans = async (params: {
    userAddress: string;
}) => {
    const clans = await clanMembersCollection.aggregate<ClanType>([
        {
            $match: { memberAddress: params.userAddress } // Find clans where user is a member
        },
        {
            $lookup: {
                from: "clans", // The name of the `ClanCollection` in MongoDB
                localField: "clan_id", // Field in ClanMembersCollection
                foreignField: "_id", // Field in ClanCollection
                as: "clanDetails" // The merged result will be stored here
            }
        },
        {
            $unwind: "$clanDetails" // Convert array result into an object
        },
        {
            $project: {
                _id: 0,
                clan_id: "$clan_id",
                clanName: "$clanDetails.clanName",
                contractAddress: "$clanDetails.contractAddress",
                chainId: "$clanDetails.chainId",
                ownerAddress: "$clanDetails.ownerAddress",
                joined_at: 1
            }
        }
    ]).toArray();

    return clans;
}


export const verifyClanName = async (clanName: string): Promise<boolean> => {
    const count = await clansCollection.countDocuments({ clanName }, { limit: 1 });
    return count > 0;
};

export const createTokenIfNotExists = async (params: Required<Omit<CreateClanParamsType, 'clanName'>>) => {
    const count = await tokensCollection.countDocuments({
        tokenContractAddress: params.contractAddress,
        chainId: params.chainId
    }, { limit: 1 });

    if (!count) {
        await  tokensCollection.insertOne({
            chainId: params.chainId,
            chainName: params.chainName,
            chainShortName: params.chainShortName,
            tokenContractAddress: params.contractAddress,
            precision: params.precision,
            totalSupply: params.totalSupply,
            tokenFullName: params.tokenFullName,
            tokenSymbol: params.tokenSymbol,
            protocolType: "ERC20"
        });
    }
}

export const createClan = async ({
    contractAddress,
    chainId,
    clanName,
    chainName,
    chainShortName,
    totalSupply,
    tokenFullName,
    precision,
    tokenSymbol,
}: CreateClanParamsType, userAddress: string) => {

    if (!chainName || !chainShortName || !totalSupply || !tokenFullName || !tokenSymbol || !precision) {
        return;
    }

    const exists = await verifyClanName(clanName);
    if (exists) {
        throw new Error("Clan name exists");
    }

    await createTokenIfNotExists({
        contractAddress,
        chainId,
        chainName,
        chainShortName,
        totalSupply,
        tokenFullName,
        precision,
        tokenSymbol
    });

    const result = await clansCollection.insertOne({
        clanName,
        contractAddress,
        chainId,
        ownerAddress: userAddress,
        createdAt: new Date()
    });

    await clanMembersCollection.insertOne({
        clan_id: result.insertedId,
        memberAddress: userAddress,
        joined_at: new Date()
    });
}