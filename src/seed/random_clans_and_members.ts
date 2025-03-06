import { faker } from '@faker-js/faker';
import { clansCollection, pixelLogsCollection, tokensCollection, usersCollection } from '../mongodb';
import { UserDocumentType } from '../types';

const generateFakeEthereumAddress = (): `0x${string}` => {
    return `0x${faker.string.hexadecimal({ length: 40, casing: "lower", prefix: "" })}`;
};

const main = async () => {
    console.log("Seeding database...");

    await clansCollection.deleteMany({});
    await pixelLogsCollection.deleteMany({});
    await usersCollection.deleteMany({});

    console.log("Collections cleared.");

    const addresses: UserDocumentType[] = [];

    // 🔹 Generate 1000 random user addresses
    for (let i = 0; i < 1000; i++) {
        addresses.push({
            address: generateFakeEthereumAddress(),
            pixelLimit: 1000,
            pixelLimitIsCreatedAt: new Date()
        });
    }

    await usersCollection.insertMany(addresses);
    console.log("Inserted users.");

    // 🔹 Fetch up to 1000 tokens
    const tokens = await tokensCollection.find({}).limit(1000).toArray();
    console.log(`Fetched ${tokens.length} tokens.`);

    const clanBulkOperations = [];
    const pixelLogsBulkOperations = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const ownerAddress = addresses[i]?.address;
        if (!ownerAddress || !token) continue;

        const members: { memberAddress: `0x${string}`; rating: 0, joined_at: Date }[] = [];
        for (let j = 0; j < 100; j++) {
            const userAddress = addresses[Math.floor(Math.random() * addresses.length)]?.address;
            if (userAddress) {
                members.push({ memberAddress: userAddress, rating: 0, joined_at: new Date() });
            }
        }

        // 🔹 Create a clan object
        const newClan = {
            clanName: faker.company.name(),
            chainId: token.chainId,
            contractAddress: token.tokenContractAddress,
            ownerAddress,
            rating: 0,
            members,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        clanBulkOperations.push({ insertOne: { document: newClan } });
    }

    // 🔹 Insert all clans in one bulk operation
    if (clanBulkOperations.length > 0) {
        const insertResult = await clansCollection.bulkWrite(clanBulkOperations);
        console.log(`Inserted ${insertResult.insertedCount} clans.`);
    }

    // 🔹 Get inserted clan IDs
    const clans = await clansCollection.find({}, { projection: { _id: 1 } }).toArray();

    // 🔹 Generate pixel logs
    for (const clan of clans) {
        const logEntries = [];
        for (let j = 0; j < Math.floor(Math.random() * (10000 - 100) + 100); j++) {
            const userAddress = addresses[Math.floor(Math.random() * addresses.length)]?.address;
            if (!userAddress) continue;
            logEntries.push({
                clan_id: clan._id,
                userAddress,
                created_at: new Date()
            });
        }
        pixelLogsBulkOperations.push(...logEntries.map(log => ({ insertOne: { document: log } })));
    }

    // 🔹 Bulk insert pixel logs
    if (pixelLogsBulkOperations.length > 0) {
        const logInsertResult = await pixelLogsCollection.bulkWrite(pixelLogsBulkOperations);
        console.log(`Inserted ${logInsertResult.insertedCount} pixel logs.`);
    }

    console.log("Seeding complete.");
};


main().then(() => {
    console.log("Done!");
})