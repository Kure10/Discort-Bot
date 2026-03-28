const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const sessions = {};

client.on('messageCreate', message => {

    const text = message.content;

    if (!text.includes("START: After") && !text.includes("QUIT: After")) return;

    if (text.includes("START: After")) {
        const user = extractUser(text);
        sessions[user] = Date.now();
    }

    if (text.includes("QUIT: After")) {
        const user = extractUser(text);

        if (sessions[user]) {
            const duration = Date.now() - sessions[user];

            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);

            message.reply(`⏱ ${user} worked ${minutes}m ${seconds}s`);

            delete sessions[user];
        }
    }
});

function extractUser(text) {
    const match = text.match(/👤\s*([^@|]+)/);
    return match ? match[1].trim() : "unknown";
}

client.login(process.env.DISCORD_TOKEN);