const config = {
    name: "ai",
    aliases: ["ai", "ask"],
    description: "Interact with ALEXGPT4 AI or analyze a replied image.",
    usage: "[query]",
    cooldown: 5,
    permissions: [0],
    credits: "@jxm // don't change the credits."
};

async function onCall({ message, args }) {
    const query = args.join(" ") || " ";
    const userId = message.senderID;

    if (message.messageReply && message.messageReply.attachments && message.messageReply.attachments[0]?.type === "photo") {
        const attachment = message.messageReply.attachments[0];
        const imageURL = attachment.url;

        try {
            const response = await axios.get(`https://rapido.up.railway.app/api/alex?prompt=${encodeURIComponent(query)}&uid=${userId}&image=${encodeURIComponent(imageURL)}`);
            if (response.data && response.data.data) {
                return await message.reply(response.data.data);
            } else {
                return await message.reply("Failed to recognize the image.");
            }
        } catch (error) {
            console.error("Error fetching image recognition:", error);
            return await message.reply("An error occurred while processing the image.");
        }
    }

    try {
        const response = await axios.get(`https://rapido.up.railway.app/api/alex?prompt=${encodeURIComponent(query)}&uid=${userId}`);
        if (response.data && response.data.data) {
            await message.reply(response.data.data);
        } else {
            await message.reply("Sorry, I couldn't get a response from the API.");
        }
    } catch (error) {
        console.error("Error fetching from API:", error);
        await message.reply("An error occurred while trying to reach the API.");
    }
}

export default {
    config,
    onCall
};
