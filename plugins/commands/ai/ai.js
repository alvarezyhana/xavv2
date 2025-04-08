import axios from 'axios';

const config = {
    name: "ai",
    aliases: ["ai", "ask"],
    description: "Interact with AI or analyze images",
    usage: "[query]",
    cooldown: 5,
    permissions: [0],
    credits: "XaviaTeam",
};

async function onCall({ message, args }) {
    const query = args.join(" ") || "hi";
    const userId = message.senderID;

    if (message.messageReply && message.messageReply.attachments && message.messageReply.attachments[0]?.type === "photo") {
        const attachment = message.messageReply.attachments[0];
        const imageURL = attachment.url;

        try {
            const response = await axios.get(`https://api.shizuki.linkpc.net/api/gemini?chat=${encodeURIComponent(query)}&imageUrl=${encodeURIComponent(imageURL)}`);
            if (response.data && response.data.response && response.data.response) {
                return await message.reply(response.data.response);
            } else {
                return await message.reply("Failed to recognize the image.");
            }
        } catch (error) {
            console.error("Error fetching image recognition:", error);
            return await message.reply("An error occurred while processing the image.");
        }
    }

    try {
        const response = await axios.get(`https://api.shizuki.linkpc.net/api/gemini?chat=${encodeURIComponent(query)}`);
        if (response.data && response.data.response) {
            await message.reply(response.data.response);
        } else {
            await message.reply("Sorry, I couldn't get a response from the API.");
        }
    } catch (error) {
        console.error("Error fetching from GPT-4 API:", error);
        await message.reply("An error occurred while trying to reach the API.");
    }
}

export default {
    config,
    onCall,
};
