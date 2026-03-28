const { Client, GatewayIntentBits } = require('discord.js');
const express = require("express");
const app = express();

// 🌐 Fake web server for Render (IMPORTANT)
app.get("/", (req, res) => {
    res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// 🤖 Discord bot setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const sessions = {};

client.once("ready", () => {
    console.log("RENDER BOT READY");
});

client.on('messageCreate', async message => {

    // ❗ VERY IMPORTANT: ignore bots FIRST
    if (message.author.bot) return;

    const text = message.content;

    // command
    if (text === "UnityTracker: Status") {
        await handleStatusCommand(message);
        return;
    }

    if (!text.includes("START: After") && !text.includes("QUIT: After")) return;

    if (text.includes("START: After")) {
        const user = extractUser(text);
        sessions[user] = Date.now();
    }

    if (text.includes("QUIT: After")) {
        const user = extractUser(text);

        if (sessions[user]) {
            const duration = Date.now() - sessions[user];

            const hours = Math.floor(duration / 3600000);
            const minutes = Math.floor((duration % 3600000) / 60000);

            message.reply(`⏱ ${user} worked ${hours}h ${minutes}m`);

            delete sessions[user];
        }
    }
});

// 🔍 Extract username
function extractUser(text) {
    const match = text.match(/👤\s*([^@|]+)/);
    return match ? match[1].trim() : "unknown";
}

// 📊 Status command
async function handleStatusCommand(message) {

    let allMessages = [];
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await message.channel.messages.fetch(options);

        if (messages.size === 0) break;

        allMessages.push(...messages.values());
        lastId = messages.last().id;
    }

    const totals = {};

    allMessages.forEach(msg => {

        // only bot messages
        if (msg.author.id !== message.client.user.id) return;

        const content = msg.content;

        if (!content.includes("worked")) return;

        const userMatch = content.match(/⏱\s*(.*?)\s*worked/);
        const timeMatch = content.match(/(\d+)h\s*(\d+)m/);

        if (!userMatch || !timeMatch) return;

        const user = userMatch[1];
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);

        const totalMinutes = hours * 60 + minutes;

        if (!totals[user]) totals[user] = 0;
        totals[user] += totalMinutes;
    });

    let reply = "📊 Summary:\n";

    for (const user in totals) {
        const total = totals[user];

        const days = Math.floor(total / (60 * 24));
        const hours = Math.floor((total % (60 * 24)) / 60);
        const minutes = total % 60;

        reply += `${user} worked ${days}d ${hours}h ${minutes}m\n`;
    }

    await message.reply(reply);
}

// 🔐 Login (make sure env variable exists in Render)
client.login(process.env.DISCORD_TOKEN);