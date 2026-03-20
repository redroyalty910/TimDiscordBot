require('dotenv').config();  // Loads the .env file for the token

const fs = require('fs'); // gives access to file system
const path = require('path'); // helps find file paths safely
const { Client, GatewayIntentBits, Events } = require('discord.js'); // imports tools from the discord library
const cooldowns = {} // creates an empty object that can track the users last message timestamp; controlling their XP spammage

const client = new Client({ // create the ONE AND ONLY timbot
    intents: [  // tells discord what the BOT is allowed to recieve
        GatewayIntentBits.Guilds, // Lets the bot work inside the server
        GatewayIntentBits.GuildMessages, // Lets the bot recieve server messages
        GatewayIntentBits.MessageContent, // Lets the bot read what people typed
    ],
}); // finishes creating the bot :)

//THIS STARTS EVERYTHING REGARDING THE TIMBOTS BUILT-IN LEVELING SYSTEM

const levelsFile = path.join(__dirname, 'levels.json'); // creates a path to levels.json, with __durname being the current folder

function loadLevels() { //reads saved data
    if (!fs.existsSync(levelsFile)) { //if the file doesn't exist yet...
        fs.writeFileSync(levelsFile, JSON.stringify({}, null, 2)); //create an empty levels.json file
    }

    const data = fs.readFileSync(levelsFile, 'utf8'); //read the file contents as TEXT
    return JSON.parse(data); //and convert that TEXT to a JavaScript object taht we can use in code
}

function saveLevels(levels) { //Saves updated data
    fs.writeFileSync(levelsFile, JSON.stringify(levels, null, 2)); // writes updated data back into the file
}

function getXpNeeded(level) { // calculates the XP needed to level up
    return level * 100; // each level needs 100 XP multiplied by the users level
}


client.on(Events.MessageCreate, async (message) => { //this runs EVERY TIME somebody sends a message
    if (message.author.bot) return; // but ignores bots...
    if (!message.guild) return; // and ignores dms...

    console.log(`Message has been recieved: ${message.content}`); // debugging line that prints message into terminal

    const levels = loadLevels(); // gets all the saved user data
    const userId = message.author.id; // gets the user's unique ID

    if (!levels[userId]) { // if the user is brand new...
        levels[userId] = { // the user will be given a starting status :)
            xp: 0,
            level: 1
        };
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

// this code handles the LEADERBOARD system

if (message.content.trim() === '!leaderboard') { // if user typed in !leaderboard...
    const sortedUsers = Object.entries(levels) // turns the LEVELS OBJECT into a LIST array which is SORTABLE
    .sort((a, b) => { // this sorts the users from STRONGEST to WEAKEST
        const userA = a[1]; // 1 is the user's data object
        const userB = b[1];

        if (userB.level !== userA.level) { // puts the HIGHER levels FIRST
            return userB.level - userA.level; // if levels are tied, put the higher XP FIRST
        }

        return userB.xp - userA.xp; // if the levels are equal, the higher XP comes first 
    })
    .slice(0,20); // keeps ONLY the top 20 users on the rank display

if (sortedUsers.length === 0) { // if no one is in the system yet...
    await message.reply('Leaderboard is EMPTY! GET TO WORK FELLAS!'); // let them know dat
    return // and stop the function
}

let leaderboardText = '☆☆☆ TIMBOT LEADERBOARD ☆☆☆\n\n'; // start message string

for (let i = 0; i < sortedUsers.length; i++){ // iterate through the top twenty users
    const [userId, userData] = sortedUsers[i]; // userId = DISCORD_ID userData = {xp, level }

    let username = `Unknown User (${userId})`; // fallback if the username is unable to be acquired

    try { // in the case that the bot can't fetch a username. the command won't crash
        const user = await client.users.fetch(userId); // looks up the user's discord to show their USERNAME instead of their BORING ID NUMBER
        username = user.username; // replaces fallback with an actual username
    } catch (error) { // if the fetch fails...
        console.log(`I, the TIMBOT, can't seem to fetch the username for ID ${userId}`); // issues is logged, and the bot is not crashed
    }

        leaderboardText += `${i + 1}. ${username} - Level ${userData.level} (${userData.xp} XP)\n` // user is added to the leaderboard text
    }
    await message.reply(leaderboardText); // full leaderboard message is sent to discord
    return; // thank you jesus!

}

// XP COOLDOWN SYSTEM

const now = Date.now(); // this holds the current time (THE REAL TIME) in milliseconds
const cooldownTime = 10000; // the cooldown for message XP will be 10000 milliseconds = 10 seconds
 
if (cooldowns[userId] && now - cooldowns[userId] < cooldownTime) { // if the user is still on an active cooldown ...
    return; // DON'T GIVE ANY XP
}

cooldowns[userId] = now; // updates the last XP time

// XP GAIN system for normal ordinary messages
const xpGain = Math.floor(Math.random() * 11) + 10; // gives a random amount of XP between the numbers 10 and 20
levels[userId].xp += xpGain; // and gives that same value of XP to the user who sent the message

let leveledUp = false;

while (levels[userId].xp >= getXpNeeded(levels[userId].level)) { // while the user has enough XP to level up...
    levels[userId].xp -= getXpNeeded(levels[userId].level); // subtract the XP needed
    levels[userId].level += 1; // increase their level
    leveledUp = true; // and mark that they have leveled up
}

saveLevels(levels); // save their progress

if (leveledUp) { // if they leveled up
    await message.reply( // let us all see the fun note
        `Can we get a huge round of applause for ${message.author} who just leveled up to level ${levels[userId].level} ?`
    )
}

});

client.login(process.env.DISCORD_TOKEN); // Allows for bot to login using the token