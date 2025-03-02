import { db } from "../../mongodb";
import tokensData from "./tokens.json";
import chainsData from "./chains.json";

// Ensure TypeScript correctly understands the structure of JSON
const tokens = tokensData as Record<string, any[]>;
const chains = chainsData as Record<string, any>;

// Dynamically infer available keys from JSON
type ChainKey = keyof typeof chains;
type TokensData = typeof tokens;

// Seed function
export const seedTokens = async () => {
    const collection = db.collection("tokens");

    for (const [chainShortName, tokenList] of Object.entries(tokens) as [ChainKey, TokensData[ChainKey]][]) {
        const chain = chains[chainShortName];

        if (!chain) {
            console.warn(`Chain not found for ${chainShortName}`);
            continue;
        }

        for (const token of tokenList) {
            const tokenDocument = {
                chainShortName,
                chainId: chain.id,
                chainName: chain.name,
                tokenFullName: token.tokenFullName,
                tokenSymbol: token.token,
                precision: Number(token.precision),
                tokenContractAddress: token.tokenContractAddress,
                protocolType: token.protocolType,
                addressCount: Number(token.addressCount),
                totalSupply: Number(token.totalSupply),
                circulatingSupply: Number(token.circulatingSupply),
                price: Number(token.price),
                website: token.website || null,
                totalMarketCap: Number(token.totalMarketCap),
                issueDate: new Date(Number(token.issueDate)),
                transactionAmount24h: Number(token.transactionAmount24h),
                tvl: Number(token.tvl),
                logoUrl: token.logoUrl,
            };

            // Insert into MongoDB
            try {
                await collection.insertOne(tokenDocument);
            console.log(`Inserted token: ${token.token} (Chain ID: ${chain.id})`);
            } catch (err) {
                console.error("Error:", err);
            }
        }
    }
};
