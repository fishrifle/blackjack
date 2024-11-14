import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const Game = () => {
    const [gameState, setGameState] = useState(null);
    const [winnerMessage, setWinnerMessage] = useState('');

    useEffect(() => {
        // Fetch initial game state when the component mounts
        axios.post('http://localhost:5000/game/start')
            .then(response => setGameState(response.data))
            .catch(error =>
                console.error('Error starting a new game:', error));
    }, []);

    const handleHit = () => {
        // Implement logic for the player to hit
        axios.post('http://localhost:5000/game/hit',
            { gameId: gameState._id })
            .then(response => {
                setGameState(response.data);
                checkWinner(response.data.winner);
            })
            .catch(error => console.error('Error hitting:', error));
    };

    const handleStand = () => {
        // Implement logic for the player to stand
        axios.post('http://localhost:5000/game/stand',
            { gameId: gameState._id })
            .then(response => {
                setGameState(response.data);
                checkWinner(response.data.winner);
            })
            .catch(error =>
                console.error('Error standing:', error));
    };

    const startNewGame = () => {
        // Implement logic to start a new game
        setWinnerMessage(''); // Clear the winner message
        axios.post('http://localhost:5000/game/start')
            .then(response => setGameState(response.data))
            .catch(error =>
                console.error('Error starting a new game:', error));
    };

    const checkWinner = (winner) => {
        // Display winner message and start a new game
        setWinnerMessage(`Winner: ${winner}`);
        setTimeout(() => {
            startNewGame();
        }, 3000); // Automatically start a new game after 3 seconds
    };
    const deleteGame = () => {
        // Delete the current game state
        axios.delete(`http://localhost:5000/game/${gameState._id}`)
            .then(() => {
                setGameState(null); // Clear the game state
                setWinnerMessage(''); // Clear any winner message
            })
                    .catch(error => console.error('Error deleting game:', error));
            };

    return (
        <div className="kl">
            {gameState ? (
                <>
                    <h1>TEST YOUR LUCK</h1>
                    {winnerMessage && <p className="winner-message">
                        {winnerMessage} </p>}
                    <div className="ma">

                        <div className="playerside">
                            <h2>Your Hand:</h2>
                            <ul>
                                {gameState.player.hand.map((card, index) => (
                                    <li key={index}>{card.rank} 
                                        of {card.suit}</li>
                                ))}
                            </ul>
                            <p>where you stand: {gameState.player.score}</p>
                        </div>
                        <div className="dealerside">
                            <h2>Dealer Hand:</h2>
                            <ul>
                                {gameState.dealer.hand.map((card, index) => (
                                    <li key={index}>{card.rank} 
                                        of {card.suit}</li>
                                ))}
                            </ul>
                            <p>where they stand: {gameState.dealer.score}</p>
                        </div>
                    </div>
                    <div className="buttons">
                        <button onClick={handleHit}>Hit</button>
                        <button onClick={handleStand}>Stand</button>
                        <button onClick={startNewGame}>Start Over</button>
                        <button onClick={deleteGame}>End Game</button> 
                    </div>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default Game;
