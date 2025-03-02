import { MongoClient } from "mongodb";
import { 
    ClanCollectionType,
    ClanMembersCollectionType,
    SettingsDocumentType,  
    TokensCollectionType, 
    UserDocumentType 
} from "../types";

const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
const MONGODB_PORT = process.env.MONGODB_PORT || 27017;
const MONGODB_USER = process.env.MONGODB_USER || 'coinpixel_user';
const MONGODB_PASS = process.env.MONGODB_PASS || '12345';

const uri = `mongodb://${MONGODB_USER}:${MONGODB_PASS}@${MONGODB_HOST}:${MONGODB_PORT}/`;

const client = new MongoClient(uri);

export const db = client.db('coinpixel');
export const pixelsCollection = db.collection('pixels');
export const usersCollection = db.collection<UserDocumentType>('users');
export const settingsCollection = db.collection<SettingsDocumentType>('settings');
export const tokensCollection = db.collection<TokensCollectionType>('tokens');
export const clansCollection = db.collection<ClanCollectionType>('clans');
export const clanMembersCollection = db.collection<ClanMembersCollectionType>('clan_members');

export const getSettings = async () => {
    const settings = await settingsCollection.findOne({});
    return settings;
}

const colors = [
    '#fefeff', 
    '#e5e5e4', 
    '#898988', 
    '#232223', 
    '#ffa6d0', 
    '#e50101', 
    '#e49401', 
    '#a16a43', 
    '#e4d901', 
    '#95e144', 
    '#06bf03', 
    '#05d3dd', 
    '#0282c7', 
    '#0100e8', 
    '#c76fe4', 
    '#820181'
];

(async () => {
    // creating indexes
    try {
        await pixelsCollection.createIndex({ row: 1, col: 1 }, { unique: true, name: 'pixels_row_col_index' });
        await usersCollection.createIndex({ address: 1 }, { unique: true, name: 'users_address_index' });
        await tokensCollection.createIndex({ tokenContractAddress: 1, chainId: 1 }, { unique: true, name: 'token_contract_address_chain_id_unique'});
        await tokensCollection.createIndex({ tokenFullName: 1 }, { unique: false, name: 'token_full_name'});
        await tokensCollection.createIndex({ tokenSymbol: 1 }, { unique: false, name: 'token_symbol'});
        await tokensCollection.createIndex({ chainId: 1 }, { unique: false, name: 'token_chain_id'});
        await tokensCollection.createIndex({ chainShortName: 1 }, { unique: false, name: 'token_chain_short_name'});
        await tokensCollection.createIndex({ chainName: 1 }, { unique: false, name: 'token_chain_name'});
        await clansCollection.createIndex({ contractAddress: 1, chainId: 1 }, { unique: false, name: 'clan_contract_address_chain_id' });
        await clansCollection.createIndex({ clanName: 1 }, { unique: true, name: 'clan_name'});
        await clanMembersCollection.createIndex({ clan_id: 1, memberAddress: 1 }, { unique: false, name: 'clan_contract_address_chain_id' });
    } catch (err: any) {
        console.error("coinpixel.pixels.row_col_index error:", err.toString());
    }

    // creating settings
    try {
        const settings = await getSettings();
        if (!settings) {
            await settingsCollection.insertOne({
                colors,
                pixel_limit: 1000,
                area_width: 1000,
                area_height: 1000
            });
        }
    } catch (err: any) {
        console.error('settings creation error:', err.toString());
    }
})();