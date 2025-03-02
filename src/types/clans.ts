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