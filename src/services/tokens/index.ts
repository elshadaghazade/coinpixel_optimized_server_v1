import { Filter } from "mongodb";
import { tokensCollection } from "../../mongodb";
import { TokensCollectionType } from "../../types";
import { TokenSearchParamsType } from "../../types/tokens";

export const searchToken = async (params: TokenSearchParamsType) => {
    const findParams: Filter<TokensCollectionType> = {
        chainId: params.chainId
    };

    if (params.q?.trim()) {
        findParams['$or'] = [
            { tokenContractAddress: { $regex: params.q, $options: "i" } }, // Case-insensitive search
            { tokenFullName: { $regex: params.q, $options: "i" } },
            { tokenSymbol: { $regex: params.q, $options: "i" } }
        ];
    }

    return await tokensCollection.find(findParams, {
        limit: 200
    }).toArray();
};