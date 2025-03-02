export interface GetAssetsParamsType {
    limit: number;
    chainShortName: string;
}

export interface GetAssetsResultType {
    code: string;
    msg: string;
    data: {
        page: string;
        limit: string;
        totalPage: string;
        chainFullName: string;
        chainShortName: string;
        tokenList: {
            tokenFullName: string;
            token: string;
            precision: string;
            tokenContractAddress: string;
            protocolType: string;
            addressCount: string;
            totalSupply: string;
            circulatingSupply: string;
            price: string;
            website: string;
            totalMarketCap: string;
            issueDate: string;
            transactionAmount24h: string;
            tvl: string;
            logoUrl: string;
        }[];
    }[];
}

export const getAssets = async (params: GetAssetsParamsType): Promise<GetAssetsResultType | null> => {
    if (!params.chainShortName) {
        return null;
    }
    return await getData(`token/token-list?chainShortName=${params.chainShortName}&limit=${params.limit}`);
}

const getData = async (path: string) => {
    const url = `https://www.oklink.com/api/v5/explorer/${path}`;

    return await (await fetch(url, {
        headers: {
            'Accept': '*/*',
            'OK-Access-Key': '0348dfd3-2f02-4505-b7b4-656be3614ca5',
        }
    })).json();
}