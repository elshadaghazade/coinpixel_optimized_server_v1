import { pixelLogsCollection, clansCollection } from "../mongodb";

const getLastWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Get last Monday (Subtract days since last Monday)
    const lastMonday = new Date(now);
    lastMonday.setUTCDate(now.getUTCDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
    lastMonday.setUTCHours(0, 0, 0, 0);

    // Get last Sunday (lastMonday + 6 days)
    const lastSunday = new Date(lastMonday);
    lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
    lastSunday.setUTCHours(23, 59, 59, 999);

    return { lastMonday, lastSunday };
};

// 📌 Step 3: Run Aggregation Pipeline and Update Leaderboard
const updateClanLeaderboard = async () => {
    try {

        const t1 = Date.now();

        const { lastMonday, lastSunday } = getLastWeekRange();

        console.log(new Date(), 'Step 1: Aggregate clan ratings from pixel logs');
        const leaderboard = await pixelLogsCollection.aggregate([
            {
                $match: { created_at: { $gte: lastMonday, $lte: lastSunday } } // Filter last week's records
            },
            {
                $group: {
                    _id: "$clan_id",
                    rating: { $sum: 1 } // Count records per clan
                }
            }
        ]).toArray();

        console.log(new Date(), 'Step 2: Get user ratings across all clans');
        const userRatings = await pixelLogsCollection.aggregate([
            {
                $match: { created_at: { $gte: lastMonday, $lte: lastSunday } }
            },
            {
                $group: {
                    _id: { clan_id: "$clan_id", userAddress: "$userAddress" },
                    userRating: { $sum: 1 } // Count contributions per user per clan
                }
            }
        ]).toArray();

        console.log(new Date(), "Step 3: Update each clan's rating");
        for (const entry of leaderboard) {
            await clansCollection.updateOne(
                { _id: entry._id },
                { $set: { rating: entry.rating, updatedAt: new Date() } }
            );
        }

        console.log(new Date(), "Step 4: Update each user's rating inside the members array");
        const bulkOperations = userRatings.map((entry) => ({
            updateOne: {
                filter: {
                    _id: entry._id.clan_id,
                    "members.memberAddress": entry._id.userAddress
                },
                update: {
                    $set: { "members.$.rating": entry.userRating }
                }
            }
        }));
        
        if (bulkOperations.length > 0) {
            await clansCollection.bulkWrite(bulkOperations);
        }

        const t2 = Date.now();

        console.log("Clan leaderboard and member ratings updated successfully!", (t2 - t1) / 1000, "seconds");
    } catch (error) {
        console.error("Error updating leaderboard:", error);
    }
};

updateClanLeaderboard();