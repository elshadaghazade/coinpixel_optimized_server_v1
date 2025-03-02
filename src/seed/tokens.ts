import { seedTokens } from "../helpers/OKLink/seed_tokens";

seedTokens()
    .then(() => {
        console.log("Completed");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error seeding tokens:", err);
        process.exit(1);
    });