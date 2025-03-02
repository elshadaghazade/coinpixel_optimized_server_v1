import { ObjectId } from "mongodb";
import { clanMembersCollection, clansCollection, tokensCollection } from "../../mongodb";
import { ClanType } from "../../types";
import { CreateClanParamsType } from "../../types/clans";

export const getClans = async (userAddress: string) => {
    const clans = await clanMembersCollection.aggregate<ClanType>([
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
            $lookup: {
                from: "clan_members", // Join with ClanMembersCollection to count users
                localField: "clan_id",
                foreignField: "clan_id",
                as: "members"
            }
        },
        {
            $addFields: {
                usersCount: { $size: "$members" },
                isMember: {
                    $gt: [
                        { $size: { $filter: {
                            input: "$members",
                            as: "member",
                            cond: { $eq: ["$$member.memberAddress", userAddress] } // Check if user is a member
                        }}}, 
                        0 // If user exists in members array, isMember = true
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$clan_id", // Group by clan_id to avoid duplicates
                clan_id: { $first: "$clan_id" },
                clanName: { $first: "$clanDetails.clanName" },
                contractAddress: { $first: "$clanDetails.contractAddress" },
                chainId: { $first: "$clanDetails.chainId" },
                ownerAddress: { $first: "$clanDetails.ownerAddress" },
                joined_at: { $first: "$joined_at" },
                usersCount: { $first: { $size: "$members" } }, // Count members properly
                isMember: { $first: "$isMember" }
            }
        },
        {
            $project: {
                _id: 0,
                clan_id: "$clan_id",
                clanName: "$clanDetails.clanName",
                contractAddress: "$clanDetails.contractAddress",
                chainId: "$clanDetails.chainId",
                ownerAddress: "$clanDetails.ownerAddress",
                joined_at: 1,
                usersCount: 1,
                isMember: 1
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

export const removeClan = async (clan_id: string, ownerAddress: string) => {
    const clan = await clansCollection.findOne({
        _id: new ObjectId(clan_id),
        ownerAddress
    });

    if (!clan) {
        throw new Error('You are not the owner of this clan');
    }

    await clansCollection.deleteOne({
        _id: clan._id
    });

    await clanMembersCollection.deleteMany({
        clan_id: clan._id
    });
}

export const joinClan = async (clan_id: string, memberAddress: string) => {
    const clanId = new ObjectId(clan_id);

    const count = await clanMembersCollection.countDocuments({
        clan_id: clanId,
        memberAddress
    }, { limit: 1 });

    if (!count) {
        await clanMembersCollection.insertOne({
            clan_id: clanId,
            memberAddress,
            joined_at: new Date()
        });
    }
}

export const disjoinClan = async (clan_id: string, memberAddress: string) => {
    const clanId = new ObjectId(clan_id);

    const ownerCount = await clansCollection.countDocuments({
        _id: clanId,
        ownerAddress: memberAddress
    }, { limit: 1 });

    if (ownerCount > 0) {
        throw new Error("You are owner of this community");
    }

    const count = await clanMembersCollection.countDocuments({
        clan_id: clanId,
        memberAddress
    }, { limit: 1 });

    if (!count) {
        await clanMembersCollection.deleteOne({
            clan_id: clanId,
            memberAddress,
            joined_at: new Date()
        });
    }
}