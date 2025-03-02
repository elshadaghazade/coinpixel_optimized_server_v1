import chains from '../../helpers/OKLink/chains.json';

interface GetAssetsParamsType {
    chainShortName?: keyof typeof chains;
    limit?: number;
    page?: number;
}

const getAssets = async (params: GetAssetsParamsType) => {
    if (!params.chainShortName) {
        return null;
    }
    return await getData(`token/token-list?chainShortName=${params.chainShortName}&limit=${params.limit || 50}&page=${params.page || 1}&protocolType=token_20`);
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

export async function collectTokens() {
    async function getData({
        page,
        chainShortName
    }: GetAssetsParamsType) {
        const data = await getAssets({
            chainShortName,
            limit: 50,
            page
        });

        return {
            totalPage: data.data?.[0]?.totalPage || 0,
            tokenList: data.data?.[0]?.tokenList || []
        }
    }

    const tokens: Record<keyof typeof chains | any, any> = {};

    for (let chain of Object.keys(chains) as (keyof typeof tokens)[]) {

        const {
            totalPage,
            tokenList
        } = await getData({
            chainShortName: chain,
            page: 1
        });

        if (!tokens[chain]?.length) {
            tokens[chain] = tokenList;
        } else {
            tokens[chain] = tokens[chain].concat(tokenList);
        }

        for (let i = 2; i <= totalPage; i++) {
            const {
                tokenList
            } = await getData({
                chainShortName: chain,
                page: i
            });

            if (!tokens[chain]?.length) {
                tokens[chain] = tokenList;
            } else {
                tokens[chain] = tokens[chain].concat(tokenList);
            }
        }
    }

    return tokens;
}