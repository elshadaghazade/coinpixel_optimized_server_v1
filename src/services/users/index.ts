import { getSettings, usersCollection } from "../../mongodb";

export const initUser = async (address: string) => {
    
    const settings = await getSettings();
    if (!settings) {
        throw new Error('settings is not defined');
    }

    let user = await usersCollection.findOne({ address });

    if (!user) {
        const result = await usersCollection.insertOne({ 
            address,
            pixelLimit: settings.pixel_limit,
            pixelLimitIsCreatedAt: new Date(),
        });

        if (result.insertedId) {
            user = await usersCollection.findOne({ _id: result.insertedId });
        }
    }

    if (!user) {
        throw new Error('User could not be created');
    }

    // check if day passed then to reset pixel limit
    const pixelLimitIsCreatedAt = user.pixelLimitIsCreatedAt;
    const now = new Date();
    if (
        pixelLimitIsCreatedAt.getFullYear() !== now.getFullYear() || 
        pixelLimitIsCreatedAt.getMonth() != now.getMonth() ||
        pixelLimitIsCreatedAt.getDate() != now.getDate()
    ) {
        await usersCollection.updateOne(
            { _id: user._id },
            { 
                $set: {
                    pixelLimit: settings.pixel_limit,
                    pixelLimitIsCreatedAt: now
                } 
            }
        );

        user.pixelLimit = settings.pixel_limit;
        user.pixelLimitIsCreatedAt = now;
    }

    return {
        user,
        settings
    };
}