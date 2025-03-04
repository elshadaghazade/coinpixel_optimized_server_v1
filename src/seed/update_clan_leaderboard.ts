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
        console.log("Connected to MongoDB...");

        const { lastMonday, lastSunday } = getLastWeekRange();

        // 🔹 Step 1: Aggregate clan ratings from pixel logs
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

        // 🔹 Step 2: Get user ratings across all clans
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

        // 🔹 Step 3: Update each clan's rating
        for (const entry of leaderboard) {
            await clansCollection.updateOne(
                { _id: entry._id },
                { $set: { rating: entry.rating, updatedAt: new Date() } }
            );
        }

        // 🔹 Step 4: Update each user's rating inside the members array
        for (const entry of userRatings) {
            await clansCollection.updateOne(
                {
                    _id: entry._id.clan_id,
                    "members.memberAddress": entry._id.userAddress
                },
                {
                    $set: { "members.$.rating": entry.userRating }
                }
            );
        }

        console.log("Clan leaderboard and member ratings updated successfully!");
    } catch (error) {
        console.error("Error updating leaderboard:", error);
    }
};

updateClanLeaderboard();