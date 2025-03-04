import { ObjectId } from "mongodb";
import { clansCollection, tokensCollection } from "../../mongodb";
import { ClanMemberType, ClanType, CreateClanParamsType, GetClanMembersParamsType, GetClansParamsType, LeaveClanParamsType, RemoveClanParamsType } from "../../types/clans";

export const getClans = async ({
    keyword = '',
    page = 1,
    limit = 10,
    userAddress,
    isOwner
}: GetClansParamsType): Promise<ClanType[]> => {
    const pipeline: any[] = [];

    // 🔹 If keyword exists, ensure a text match or regex search
    if (keyword?.trim()) {
        pipeline.push({
            $match: {
                $or: [
                    { clanName: { $regex: keyword, $options: "i" } }, // Case-insensitive regex search
                    { contractAddress: { $regex: keyword, $options: "i" } }
                ]
            }
        });
    }

    // 🔹 Filter by ownership after keyword match
    pipeline.push({
        $match: isOwner
            ? { ownerAddress: userAddress } // Get clans owned by user
            : { ownerAddress: { $ne: userAddress } } // Exclude user's owned clans
    });

    // 🔹 Join `tokensCollection` to fetch `logoUrl` & `tokenFullName`
    pipeline.push({
        $lookup: {
            from: "tokens",
            let: { clanChainId: "$chainId", clanContractAddress: "$contractAddress" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$chainId", "$$clanChainId"] },
                                { $eq: ["$tokenContractAddress", "$$clanContractAddress"] }
                            ]
                        }
                    }
                },
                {
                    $project: { _id: 0, logoUrl: 1, tokenFullName: 1 } // Select fields
                }
            ],
            as: "tokenDetails"
        }
    });

    // 🔹 Extract `logoUrl` and `tokenFullName` from joined `tokenDetails`
    pipeline.push({
        $addFields: {
            logoUrl: { $arrayElemAt: ["$tokenDetails.logoUrl", 0] },
            tokenFullName: { $arrayElemAt: ["$tokenDetails.tokenFullName", 0] }
        }
    });

    // 🔹 Add computed fields: usersCount & isMember
    pipeline.push({
        $addFields: {
            usersCount: { $size: "$members" }, // Count members
            isMember: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: "$members",
                                as: "member",
                                cond: { $eq: ["$$member.memberAddress", userAddress] }
                            }
                        }
                    },
                    0
                ]
            }
        }
    });

    // 🔹 Only return necessary fields
    pipeline.push({
        $project: {
            _id: 0,
            clan_id: "$_id",
            clanName: 1,
            chainId: 1,
            contractAddress: 1,
            rating: 1,
            ownerAddress: 1,
            usersCount: 1,
            isMember: 1,
            logoUrl: 1,
            tokenFullName: 1, // Added tokenFullName
        }
    });

    // 🔹 Sort by rating
    pipeline.push({ $sort: { rating: -1 } });

    // 🔹 Add pagination
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    const clans = await clansCollection.aggregate<ClanType>(pipeline).toArray();

    return clans;
};

export const getClan = async ({
    clan_id,
    userAddress
}: {
    clan_id: string;
    userAddress: string;
}) => {
    const clanId = new ObjectId(clan_id);

    const pipeline: any[] = [
        {
            $match: { _id: clanId }
        },
        // 🔹 Join `tokensCollection` to fetch `logoUrl` & `tokenFullName`
        {
            $lookup: {
                from: "tokens",
                let: { clanChainId: "$chainId", clanContractAddress: "$contractAddress" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$chainId", "$$clanChainId"] },
                                    { $eq: ["$tokenContractAddress", "$$clanContractAddress"] }
                                ]
                            }
                        }
                    },
                    {
                        $project: { _id: 0, logoUrl: 1, tokenFullName: 1 } // Select only required fields
                    }
                ],
                as: "tokenDetails"
            }
        },
        // 🔹 Extract `logoUrl` and `tokenFullName`
        {
            $addFields: {
                logoUrl: { $arrayElemAt: ["$tokenDetails.logoUrl", 0] },
                tokenFullName: { $arrayElemAt: ["$tokenDetails.tokenFullName", 0] }
            }
        },
        // 🔹 Check if userAddress exists in members (isMember flag)
        {
            $addFields: {
                isMember: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$members",
                                    as: "member",
                                    cond: { $eq: ["$$member.memberAddress", userAddress] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },
        // 🔹 Only return necessary fields
        {
            $project: {
                _id: 0,
                clan_id: "$_id",
                clanName: 1,
                chainId: 1,
                contractAddress: 1,
                ownerAddress: 1,
                rating: 1,
                created_at: 1,
                updated_at: 1,
                logoUrl: 1,
                tokenFullName: 1,
                isMember: 1
            }
        }
    ];

    const clan = await clansCollection.aggregate(pipeline).toArray();

    return clan.length > 0 ? clan[0] : null;
};


export const getClanMembers = async ({
    clan_id,
    page = 1,
    limit = 10
}: GetClanMembersParamsType): Promise<{
    totalMembers: number;
    members: ClanMemberType[];
}> => {
    const clanId = new ObjectId(clan_id);

    const pipeline: any[] = [
        {
            $match: { _id: clanId }
        },
        {
            $project: {
                _id: 0,
                totalMembers: { $size: "$members" }, // Count total members
                members: {
                    $slice: [
                        {
                            $filter: {
                                input: {
                                    $sortArray: {
                                        input: "$members",
                                        sortBy: { rating: -1 } // Sort by rating descending
                                    }
                                },
                                as: "member",
                                cond: { $ne: ["$$member.memberAddress", null] } // Ensure valid members
                            }
                        },
                        (page - 1) * limit,
                        limit
                    ]
                }
            }
        }
    ];

    const result = await clansCollection.aggregate(pipeline).toArray();
    return result.length > 0 && result[0]
        ? {
            totalMembers: result[0].totalMembers,
            members: result[0].members
        }
        : { totalMembers: 0, members: [] };
};


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

    await clansCollection.insertOne({
        clanName,
        contractAddress,
        chainId,
        ownerAddress: userAddress,
        rating: 0,
        members: [
            {
                memberAddress: userAddress,
                rating: 0,
                joined_at: new Date()
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

export const removeClan = async (params: RemoveClanParamsType) => {
    const clan = await clansCollection.findOne({
        _id: new ObjectId(params.clan_id),
        ownerAddress: params.userAddress
    });

    if (!clan) {
        throw new Error('You are not the owner of this clan');
    }

    await clansCollection.deleteOne({
        _id: clan._id
    });
}

export const joinClan = async (clan_id: string, memberAddress: string) => {
    const clanId = new ObjectId(clan_id);

    await clansCollection.updateOne(
        { _id: clanId }, // Find clan by `_id`
        {
            $addToSet: { 
                members: { memberAddress, rating: 0, joined_at: new Date() } 
            }
        }
    );
};

export const leaveClan = async (params: LeaveClanParamsType) => {
    const clanId = new ObjectId(params.clan_id);

    // Check if the user is the owner and prevent leaving if true
    const clan = await clansCollection.findOne(
        { _id: clanId },
        { projection: { ownerAddress: 1 } } // Only retrieve `ownerAddress`
    );

    if (!clan) {
        throw new Error("Clan not found");
    }

    if (clan.ownerAddress === params.userAddress) {
        throw new Error("You are the owner of this community and cannot leave");
    }

    // Remove the user from the members array
    await clansCollection.updateOne(
        { _id: clanId },
        { $pull: { members: { memberAddress: params.userAddress } } }
    );
};