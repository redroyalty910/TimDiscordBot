const fs = require('fs'); // imports node's file system module
const path = require('path'); // imports path module (helps safely build file paths across OS)

const economyFile = path.join(__dirname, '..', 'data', 'economy.json'); // create path to .json adjacent

function loadEconomy() { // load the economy data from the file

    if (!fs.existsSync(economyFile)) { // check if the file already exists
        fs.writeFileSync(economyFile, JSON.stringify({}, null, 2)); // if it does not exist, create it with an empty object '{}'
    }

    const data = fs.readFileSync(economyFile, 'utf8'); // read file contents as text
    return JSON.parse(data); // convert that text into a JavaScript object
}

function saveEconomy(economy) { // save economy data back into the file
    fs.writeFileSync(economyFile, JSON.stringify(economy, null, 2)); // converts JavaScript object back into a JSON string
}

function ensureUser(economy, userId) { // make sure that the user exists within the economy system
    if (!economy[userId]) { // and if the user does NOT exist yet...
        economy[userId] = { // create a new entry for them
                balance: 0, // value for the starting money
                lastDailyPassive: 0 // last time the user recieved passive income
            };
        }
    }

function applyPassiveIncome(economy, userId) { // 100 per-day
    const now = Date.now(); // get current time in milliseconds
    const last = economy[userId].lastDailyPassive; // user's last passive income time
    const oneDay = 86400000; // milliseconds in one day
    const daysPassed = Math.floor((now-last) / oneDay); // how many full days have passed

    if (daysPassed > 0) { // if at least one day has passed...
        const amountEarned = daysPassed * 100; // give the user 100 tim moneys per day passed

        economy[userId].balance += amountEarned;
        economy[userId].lastDailyPassive = now; // update the last passive time to now
        return amountEarned; // return how much they earned
    }
    return 0; // if no days have passed
}

function addMoney(economy, userId, amount) { // add money to a user
    economy[userId].balance += amount;
}

function removeMoney(economy, userId, amount) { // remove money from a user
    economy[userId].balance -= amount;
}

function getBalance(economy, userId) { // get a user's balance
    return economy[userId].balance;
}

module.exports= { // export functions so that other .js files may use them
    loadEconomy,
    saveEconomy,
    ensureUser,
    applyPassiveIncome,
    addMoney,
    removeMoney,
    getBalance
};