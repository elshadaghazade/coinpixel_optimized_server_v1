import { Filter } from "mongodb";
import { tokensCollection } from "../../mongodb";
import { TokensCollectionType } from "../../types";
import { TokenSearchParamsType } from "../../types/tokens";
import chains from './chains.json';
import { createPublicClient, defineChain, http, erc20Abi } from "viem";

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

export const getBalance = async (params: {
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`,
    chainId: number;
}) => {
    const chainMap: Record<number, any> = Object.fromEntries(Object.values(chains).map((chain: any) => [chain.id, defineChain(chain)]));

    const chain = chainMap[params.chainId];
    if (!chain) {
        throw new Error("unsupported chain");
    }

    const client = createPublicClient({
        chain,
        transport: http(),
      });

      const balance = await client.readContract({
        address: params.contractAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [params.userAddress],
      });
  
      console.log(`Balance: ${balance}`);
      return balance;
}