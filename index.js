require('dotenv').config();  // Loads the .env file for the token

const { Client, GatewayIntentBits, Events } = require('discord.js'); // imports tools from the discord library

const {
    loadLevels,
    getXpNeeded,
    ensureLevelUser,
    canGainXp,
    giveXp,
    getLeaderboard
} = require('./systems/levels'); // imports the LEVEL system functions from levels.js

const {
    loadEconomy,
    saveEconomy,
    ensureUser,
    applyPassiveIncome,
    getBalance
} = require('./systems/economy'); // imports the ECONOMY system functions from economy.js

const client = new Client({ // create the ONE AND ONLY timbot
    intents: [  // tells discord what the BOT is allowed to recieve
        GatewayIntentBits.Guilds, // Lets the bot work inside the server
        GatewayIntentBits.GuildMessages, // Lets the bot recieve server messages
        GatewayIntentBits.MessageContent, // Lets the bot read what people typed
    ],
}); // finishes creating the bot :)

client.once(Events.ClientReady, () => { // this runs once when the bot logs in successfully
    console.log(`Hey, its me! the one and only ${client.user.tag}!`); // confirms the bot is awake
});

client.on(Events.MessageCreate, async (message) => { // this runs EVERY TIME somebody sends a message
    if (message.author.bot) return; // but ignores bots...
    if (!message.guild) return; // and ignores dms...

    console.log(`Message has been recieved: ${message.content}`); // debugging line that prints message into terminal

    const userId = message.author.id; // gets the user's unique ID

    const levels = loadLevels(); // gets all the saved level data
    ensureLevelUser(levels, userId); // makes sure the user exists in the level system

    const economy = loadEconomy(); // gets all the saved economy data
    ensureUser(economy, userId); // makes sure the user exists in the economy system

    const passiveEarned = applyPassiveIncome(economy, userId); // checks if the user should receive passive income
    saveEconomy(economy); // save any economy updates

    if (passiveEarned > 0) { // if the user earned passive money...
        await message.reply(`Hey, welcome back ${message.author}! You earned ${passiveEarned} coins from the passive daily moneys!`); // let them know :)
    }

    if (message.content.trim() === '!hello') { // this is a hello test command
        await message.reply('hiiiiiiii, im awake, its me :)'); // should reply with this
        return;
    }

    if (message.content.trim() === '!rank') { // checks whether !rank is typed, negating spaces
        const xpNeeded = getXpNeeded(levels[userId].level); // figures out how much XP is needed for the users current level

        await message.reply( // sends the rank message back to discord
            `Freakin' awesome user ${message.author} is level ${levels[userId].level} with ${levels[userId].xp}/${xpNeeded} XP! Keep it up!`
        );
        return;
    }

    if (message.content.trim() === '!leaderboard') { // if user typed in !leaderboard...
        const sortedUsers = getLeaderboard(levels); // gets the sorted leaderboard data

        if (sortedUsers.length === 0) { // if no one is in the system yet...
            await message.reply('Leaderboard is EMPTY! GET TO WORK FELLAS!'); // let them know dat
            return; // and stop the function
        }

        let leaderboardText = '☆☆☆ TIMBOT LEADERBOARD ☆☆☆\n\n'; // start message string

        for (let i = 0; i < sortedUsers.length; i++) { // iterate through the top twenty users
            const [leaderUserId, userData] = sortedUsers[i]; // leaderUserId = DISCORD_ID userData = {xp, level }

            let username = `Unknown User (${leaderUserId})`; // fallback if the username is unable to be acquired

            try { // in the case that the bot can't fetch a username. the command won't crash
                const user = await client.users.fetch(leaderUserId); // looks up the user's discord to show their USERNAME instead of their BORING ID NUMBER
                username = user.username; // replaces fallback with an actual username
            } catch (error) { // if the fetch fails...
                console.log(`I, the TIMBOT, can't seem to fetch the username for ID ${leaderUserId}`); // issue is logged, and the bot is not crashed
            }

            leaderboardText += `${i + 1}. ${username} - Level ${userData.level} (${userData.xp} XP)\n`; // user is added to the leaderboard text
        }

        await message.reply(leaderboardText); // full leaderboard message is sent to discord
        return; // thank you jesus!
    }

    if (message.content.trim() === '!balance') { // if the user typed !balance...
        await message.reply(`Hey there ${message.author}, you currently have ${getBalance(economy, userId)} moneys!`); // show them their balance
        return;
    }

    if (!canGainXp(userId)) { // if the user is still on cooldown...
        return; // do not give them XP yet
    }

    const result = giveXp(levels, userId); // gives the user XP and checks for level-up

    if (result.leveledUp) { // if they leveled up
        await message.reply( // let us all see the fun note
            `Can we get a huge round of applause for ${message.author} who just leveled up to level ${result.level} ?`
        );
    }
});

client.login(process.env.DISCORD_TOKEN); // Allows for bot to login using the token