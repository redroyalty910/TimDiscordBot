const fs = require('fs'); // gives access to file system
const path = require('path'); // helps find file paths safely

// THIS STARTS EVERYTHING REGARDING THE TIMBOTS BUILT-IN LEVELING SYSTEM
const levelsFile = path.join(__dirname, '..', 'data', 'levels.json'); // creates a path to levels.json, with __dirname being the current folder

const cooldowns = {}; // this object stores when each user last got XP

function loadLevels() { // reads saved data
    if (!fs.existsSync(levelsFile)) { // if the file doesn't exist yet...
        fs.writeFileSync(levelsFile, JSON.stringify({}, null, 2)); // create an empty levels.json file
    }

    const data = fs.readFileSync(levelsFile, 'utf8'); // read the file contents as TEXT
    return JSON.parse(data); // and convert that TEXT to a JavaScript object that we can use in code
}

function saveLevels(levels) { // Saves updated data
    fs.writeFileSync(levelsFile, JSON.stringify(levels, null, 2)); // writes updated data back into the file
}

function getXpNeeded(level) { // calculates the XP needed to level up
    return level * 100; // each level needs 100 XP multiplied by the users level
}

function ensureLevelUser(levels, userId) { // makes sure the user exists in the level system
    if (!levels[userId]) { // if the user is brand new...
        levels[userId] = { // the user will be given a starting status :)
            xp: 0,
            level: 1
        };
    }
}

function canGainXp(userId) { // this checks whether a user is still on cooldown
    const now = Date.now(); // gets the current time
    const cooldownTime = 10000; // 10 second cooldown

    if (cooldowns[userId] && now - cooldowns[userId] < cooldownTime) { // if user is still on cooldown...
        return false; // do NOT let them gain XP
    }

    cooldowns[userId] = now; // update their last XP time
    return true; // allow XP gain
}

function giveXp(levels, userId) { // giving XP GAIN system for normal ordinary messages
    const xpGain = Math.floor(Math.random() * 11) + 10; // gives a random amount of XP between the numbers 10 and 20
    levels[userId].xp += xpGain; // and gives that same value of XP to the user who sent the message

    let leveledUp = false;

    while (levels[userId].xp >= getXpNeeded(levels[userId].level)) { // while the user has enough XP to level up...
        levels[userId].xp -= getXpNeeded(levels[userId].level); // subtract the XP needed
        levels[userId].level += 1; // increase their level
        leveledUp = true; // and mark that they have leveled up
    }

    saveLevels(levels); // save their progress

    return {
        leveledUp,
        level: levels[userId].level,
        xp: levels[userId].xp,
        xpNeeded: getXpNeeded(levels[userId].level)
    };
}

function getLeaderboard(levels) { // this code handles the LEADERBOARD system
    return Object.entries(levels) // turns the LEVELS OBJECT into a LIST array which is SORTABLE
        .sort((a, b) => { // this sorts the users from STRONGEST to WEAKEST
            const userA = a[1]; // 1 is the user's data object
            const userB = b[1];

            if (userB.level !== userA.level) { // puts the HIGHER levels FIRST
                return userB.level - userA.level; // if levels are tied, put the higher XP FIRST
            }

            return userB.xp - userA.xp; // if the levels are equal, the higher XP comes first
        })
        .slice(0, 20); // keeps ONLY the top 20 users on the rank display
}

module.exports = {
    loadLevels,
    saveLevels,
    getXpNeeded,
    ensureLevelUser,
    canGainXp,
    giveXp,
    getLeaderboard
};