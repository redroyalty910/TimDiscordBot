require('dotenv').config();  // Loads the .env file for the token

const { Client, GatewayIntentBits } = require('discord.js'); // imports the discord library

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Lets the bot work inside the server
        GatewayIntentBits.GuildMessages, // Lets the bot recieve server messages
        GatewayIntentBits.MessageContent, // Lets the bot read what people typed
    ],
});

client.once('ready', () => { // This runs when the bot logs in succesfully :)
    console.log(`Hey, its me! the one and only ${client.user.tag}!`);
});

client.on('messageCreate', (message) => { // This runs every time a message is sent
    console.log('Message recieved: ${message.content}'); // debugging purposes

    if (message.author.bot) return; // prevents the bot from talking to itself; he's a sily guy

    if (message.content.trim() === '!ping') { // test + .trim() ignores spaces
        message.reply('AH! you startled me there, do not say that!') // not a pong, shocks the viewer
    }

    if (message.content.trim() === '!hello') {
        message.reply('hiiiiiiii, im awake, its me :)');
    }
});

console.log('Token loaded?', !!process.env.DISCORD_TOKEN);
console.log('Token length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);

client.login(process.env.DISCORD_TOKEN); // Allows for bot to login using the token