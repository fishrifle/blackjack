// blackjack-server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Database connection configuration
mongoose.connect('mongodb://localhost:27017/blackjack', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const cardSchema = new mongoose.Schema({
    suit: String,
    rank: String,
    value: Number,
});

const playerSchema = new mongoose.Schema({
    name: String,
    hand: [cardSchema],
    score: Number,
});

const gameSchema = new mongoose.Schema({
    deck: [cardSchema],
    player: playerSchema,
    dealer: playerSchema,
    winner: String, // New field to store the winner
});


const Card = mongoose.model('Card', cardSchema);
const Player = mongoose.model('Player', playerSchema);
const Game = mongoose.model('Game', gameSchema);

// Helper function to create a new deck
function createDeck() {
    const suits =
        ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks =
        ['2', '3', '4', '5', '6', '7', '8',
            '9', '10', 'J', 'Q', 'K', 'A'];

    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            const card = new Card({
                suit: suit,
                rank: rank,
                value: rank ===
                    'A' ? 11 : isNaN(rank) ?
                    10 : parseInt(rank),
            });
            deck.push(card);
        }
    }

    return deck;
}

// Endpoint to start a new game
app.post('/game/start', async (req, res) => {
    try {
        const newDeck = createDeck();

        // Shuffle the deck (Fisher-Yates algorithm)
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], 
            newDeck[i]];
        }

        const newGame = new Game({
            deck: newDeck,
            player: { name: 'Player', hand: [], 
            score: 0 },
            dealer: { name: 'Dealer', hand: [], 
            score: 0 },
        });

        // Deal the initial two cards to the player and the dealer
        newGame.player.hand.push(newGame.deck.pop());
        newGame.dealer.hand.push(newGame.deck.pop());
        newGame.player.hand.push(newGame.deck.pop());
        newGame.dealer.hand.push(newGame.deck.pop());

        // Update scores
        newGame.player.score = calculateScore(
            newGame.player.hand);
        newGame.dealer.score = calculateScore(
            newGame.dealer.hand);

        // Save the new game to the database
        await newGame.save();

        res.status(201).json(newGame);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to handle player hits
app.post('/game/hit', async (req, res) => {
    try {
        const gameId = req.body.gameId;

        // Fetch the game from the database
        const game = await Game.findById(gameId);

        // Draw a card from the deck and add it to the player's hand
        const drawnCard = game.deck.pop();
        game.player.hand.push(drawnCard);

        // Update the player's score
        game.player.score = calculateScore(
            game.player.hand);

        // Set the winner field
        game.winner = determineWinner(game.player.score,
            game.dealer.score);

        // Save the updated game to the database
        await game.save();

        res.json({ ...game.toObject(), 
            winner: game.winner });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/game/stand', async (req, res) => {
    try {
        const gameId = req.body.gameId;

        // Fetch the game from the database
        const game = await Game.findById(gameId);

        // Dealer draws cards until their score is 17 or higher
        while (game.dealer.score < 17) {
            const drawnCard = game.deck.pop();
            game.dealer.hand.push(drawnCard);
            game.dealer.score = calculateScore(
                game.dealer.hand);
        }

        // Set the winner field
        game.winner = determineWinner(game.player.score,
            game.dealer.score);

        // Save the updated game to the database
        await game.save();

        res.json({ ...game.toObject(), 
            winner: game.winner });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Helper function to calculate the score of a hand
function calculateScore(hand) {
    let score = hand.reduce((total, card) =>
        total + card.value, 0);

    // Handle Aces (reduce value from 11 to 1 if necessary)
    hand.filter(card => card.rank === 'A')
    .forEach(_ => {
        if (score > 21) {
            score -= 10;
        }
    });

    return score;
}

// Helper function to determine the winner
function determineWinner(playerScore, 
    dealerScore) {
    if (playerScore > 21) {
        return 'Dealer'; // Player busts, dealer wins
    }

    if (dealerScore > 21) {
        return 'Player'; // Dealer busts, player wins
    }

    if (playerScore > dealerScore) {
        return 'Player'; // Player has a higher score
    } else if (playerScore < dealerScore) {
        return 'Dealer'; // Dealer has a higher score
    } else {
        return 'Draw'; // Scores are equal, it's a draw
    }
}


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
