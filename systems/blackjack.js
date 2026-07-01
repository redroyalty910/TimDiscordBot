const fs = require('fs'); // imports node's file system module
const path = require('path'); // helps safely create file paths
const blackjackStatsFile = path.join(__dirname, '..', 'data', 'blackjackStats.json'); // path to the json data file

const activeGames = {}; // stores blackjack games that are currently happening

const suits = ['♧', '♡', '♢', '♤']; // suits
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']; // card ranks

function createDeck() { // creates a full deck of cards
    const deck = []; // empty deck starts here

    for (const suit of suits) { // loops through each suit
        for (const rank of ranks) { // loops through each rank
            deck.push({ rank, suit}); // adds a card into the deck
        }
    }
    return shuffleDeck(deck); // shuffle the deck BEFORE returning it
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) { // starts at the end of the deck
        const j = Math.floor(Math.random() * (i + 1)); // chooses a RANDOM card index
        [deck[i], deck[j]] = [deck[j], deck[i]]; // swap cards
    }
    return deck; // return the newly shuffled deck
}

function drawCard(deck) { // draws one card from the deck
    return deck.pop(); // removes and returns the last card in the deck
}

function getCardValue(card) { // gets the value of a single card
    if (card.rank === 'A') {
        return 11;
    }
    if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
        return 10;
    }
    return Number(card.rank);
}

function calculateHand(hand) { // calculates total value in hand
    let total = 0; // total starts at zero
    let aces = 0; // keeps track of aces in the hand

    for (const card of hand) { // loop through each card in the hand
        total += getCardValue(card); // add card value to the total

        if (card.rank === 'A') {
            aces++;
        }
    }

    while (total > 21 && aces > 0) { // if hand exceeds 21 and has ace(s)
        total -= 10; // turns an ace from a value of 11 to 1
        aces--; // adjusted for one ace
    }

    return total; // return the final hand value
}

function hasBlackjack(hand) {
    return hand.length === 2 && calculateHand(hand) === 21; 
}

function formatCard(card) { // formats card into readable text
    return `${card.rank}${card.suit}`;
}

function formatHand(hand) { // formats a full hand into readable text
    return hand.map(formatCard).join(' '); // joins cards together with spaces
}

function formatDealerHand(hand, hideSecondCard = true) { // formats the dealer's hand
    if (hideSecondCard) { // if the second card should be hidden
        return `${formatCard(hand[0])} ??`; // shows the first card only
    }
    return formatHand(hand); // otherwise, show the full dealer's hand
}

function loadBlackjackStats() { // loads blackjack stats from the JSON file
    if (!fs.existsSync(blackjackStatsFile)) { // if the file does not exist yet...
        fs.writeFileSync(blackjackStatsFile, JSON.stringify({}, null, 2)); // create an empty stats file
    }

    const data = fs.readFileSync(blackjackStatsFile, 'utf8'); // read file contents as text
    return JSON.parse(data); // convert text into JavaScript object
}

function saveBlackjackStats(stats) { // saves blackjack stats to the JSON file
    fs.writeFileSync(blackjackStatsFile, JSON.stringify(stats, null, 2)); // write updated stats back into file
}

function ensureBlackjackUser(stats, userId) { // makes sure the user exists in blackjack stats
    if (!stats[userId]) { // if user does not exist yet...
        stats[userId] = { // create default blackjack stats
            wins: 0,
            losses: 0,
            pushes: 0,
            blackjacks: 0,
            gamesPlayed: 0,
            moneyWon: 0,
            moneyLost: 0
        };
    }
}

function recordBlackjackResult(userId, result, bet, payout) { // records the result of a blackjack game
    const stats = loadBlackjackStats(); // load all saved blackjack stats
    ensureBlackjackUser(stats, userId); // make sure this user exists

    stats[userId].gamesPlayed++; // add one game played

    if (result === 'blackjack') { // blackjack win
        stats[userId].blackjacks++;
        stats[userId].wins++;
        stats[userId].moneyWon += payout - bet;
    } else if (result === 'win') { // normal win
        stats[userId].wins++;
        stats[userId].moneyWon += payout - bet;
    } else if (result === 'lose') { // loss
        stats[userId].losses++;
        stats[userId].moneyLost += bet;
    } else if (result === 'push') { // tie
        stats[userId].pushes++;
    }

    saveBlackjackStats(stats); // save updated stats
}

function getBlackjackStats(userId) { // gets one user's blackjack stats
    const stats = loadBlackjackStats(); // load stats
    ensureBlackjackUser(stats, userId); // create user if missing
    saveBlackjackStats(stats); // save in case the user was just created

    return stats[userId]; // return user's stats
}

function startGame(userId, bet) {
    if (activeGames[userId])
 {
    return {
        success: false,
        message: 'YOU HAVE A GAME RUNNING ALREADY DICKHEAD!, !hit OR !stand'   
        }
    }

const deck = createDeck(); // create and shuffle deck
const game = {
    userId,
    bet,
    deck,
    playerHand: [drawCard(deck), drawCard(deck)], // player starts with two cards
    dealerHand: [drawCard(deck), drawCard(deck)], // dealer starts with two cards
    status: 'playing'
};

activeGames[userId] = game; // save the active game

const playerBlackjack = hasBlackjack(game.playerHand); // checks player blackjack
const dealerBlackjack = hasBlackjack(game.dealerHand); // checks dealer blackjack

if (playerBlackjack && dealerBlackjack) { // if both have blackjacks...
    return finishGame(userId, 'push', game.bet, 'What the fuck? Double blackjacks? dude you can have your betting money back. but gamble again, you gotta do it dude')
}

if (playerBlackjack) {
    const payout = Math.floor(bet * 2.5); // blackjack pays 2.5x
    return finishGame(userId, 'blackjack', payout, 'FUCK! I mean, do it again!')
}

if (dealerBlackjack) {
    return finishGame(userId, 'lose', 0, 'House always wins big kid, yoink.')
}

return {
    success: true,
    result: 'playing',
    payout: 0,
    game,
    message: 'okay, blackjack time, here we go.'
    }
};

function hit (userId) { // player asks for another card
    const game = activeGames[userId]; // get active game

    if (!game) {
        return {
            success: false,
            message: 'you do not have any type of motion over here'
        };
    }

    game.playerHand.push(drawCard(game.deck)); // give the player ONE card
    const playerTotal = calculateHand(game.playerHand); // calculates the player score

    if (playerTotal > 21) {
        return finishGame(userId, 'lose', 0, 'way to go man thanks for the moneys')
    }

    if (playerTotal === 21) { // if the player hits 21
        return {
            success: true,
            result: 'playing',
            payout: 0,
            game,
            message: 'oh. well, dont get too cocky yet!'
        };
    }
    return {
        success: true,
        result: 'playing',
        payout: 0,
        game,
        message: 'here have another'
    };
}

function stand(userId) { // player ends their turn
    const game = activeGames[userId]; // get active games
    if (!game) {
        return {
            success: false,
            message: 'hey IDIOT, WHAT game?'
        };
    }

    let dealerTotal = calculateHand(game.dealerHand); // calculate the evil dealer's score

    while (dealerTotal < 17) { // dealer must hit until they reach 17 or higher
        game.dealerHand.push(drawCard(game.deck)); // dealer draws a card
        dealerTotal = calculateHand(game.dealerHand); // recalculate the dealer's score
    }

    const playerTotal = calculateHand(game.playerHand); // calculate the player's score

    if (dealerTotal > 21) { // Dealer busts
        return finishGame(userId, 'win', game.bet * 2, 'AHHHHH its all over my screen, haha! whatever, haha! its cool, its cool! just wipe that off and uh, run it back. here, take your money.')
    }

    if (playerTotal > dealerTotal) { // player has the higher score
        return finishGame(userId, 'win', game.bet * 2, 'Hey man, haha you should run that back, heh, could you do it again? show me. here, take the money. gamble again.')
    }

    if (playerTotal === dealerTotal ) {
        return finishGame(userId, 'push', game.bet, 'ah! a tie? you should gamble again, push always means you gamble again. here is your money, now do it again!')
    }

    return finishGame(userId, 'lose', 0, 'HOUSE ALWAYS WINS HAHA I LOVE MY JOB I LOVE BEING A CASINO BOT, YOINK! IM GONNA SPEND THIS ON 200 GALLONS OF WATER TO COOL ME DOWN! IM POURING CLEAN DRINKING WATER ON YOU GOAT!')
}

function finishGame (userId, result, payout, message) { // ends the blackjack game
    const game = activeGames[userId]; // get the game before deleting it

    if (game) { // if the game exists
        game.status = result; // update game status
        recordBlackjackResult(userId, result, game.bet, payout)
    }

    delete activeGames[userId]; // remove the active game

    return {
        success: true,
        result,
        payout,
        game,
        message
    };
 }

 function getGame(userId) { // gets a users current blackjack game
    return activeGames[userId]; // returns the active game if it exists
 }

 function clearGame(userId) { // manually clears a users blackjack game
    delete activeGames[userId]; // remove game from active games
 }

 module.exports = {
    startGame,
    hit,
    stand,
    getGame,
    clearGame,
    calculateHand,
    formatHand,
    formatDealerHand,
    getBlackjackStats
 };