import { increaseLevel } from "../firebase/firebase";
import { GameRoomProps, PlayerProps } from "../types";

//Get a random int from 0 to max - 1
export function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

export class GameLogic {
    private deck: number[];

    public constructor() {
        this.deck = [];
        for (var i = 1; i <= 99; i++) {
            this.deck.push(i+1);
        }
    }

    private resetDeck () {
        this.deck = [];
        for (var i = 1; i <= 100; i++) {
            this.deck.push(i);
        }
    }

    //Helper function to build the first game room
    public createGameRoom (name: string, requiredPlayers: number, username: string, userId: string) {
        const players: PlayerProps[] = [];
        const cards = this.shuffleCards(requiredPlayers, 1);
        for (let i = 0; i < requiredPlayers; i++) {
            if (i === 0) {
                players.push({
                    username: username,
                    userid: userId,
                    hand: [cards[i]],
                })
            } else {
                players.push({
                    username: "",
                    userid: "",
                    hand: [cards[i]],
                })
            }
        }
        const newGameRoom: GameRoomProps = {
            id: "",
            name: name,
            requiredPlayers: requiredPlayers,
            creator: "string",
            started: false,
            discarded: [],
            players: players,
            level: 1,
            joinedPlayers: 1,
        }
        return newGameRoom;
    }

    //Function that shuffles the cards and sends them to each user;
    public shuffleCards (players: number, level: number) {
        this.resetDeck();
        const cards: number[] = [];
        for (let i = 0; i < players; i++) {
            for (let j = 0; j < level; j++) {
                const card = getRandomInt(this.deck.length);
                if (!cards.includes(card)) {
                    cards.push(card);
                } else {
                    j--;
                }
                this.deck.filter((item) => item === card);
            }
        };
        return cards;
    }

    //Function to check if the last played card is valied
    public playCard(players: PlayerProps[], card: number, discarded: number[]) {
        let wastedLives = 0;
        for (let i = 0; i < players.length; i++) {
            for (let j = 0; j < players[i].hand.length; j ++) {
                if (card > players[i].hand[j] && !discarded.includes(players[i].hand[j])) {
                    wastedLives++;
                }
            }
        }
        return wastedLives;
    }

    public async moveToNextLevel (level: number, cards: number[], players: PlayerProps[], roomId: string) {
        //WE DEAL CARDS FOR EVERY PLAYER
        const newPlayersArray = players;
        console.log(cards);
        let cont = 0;
        newPlayersArray.forEach((item) => {
            item.hand = [];
            for (let i = 0; i < level; i++) {
                item.hand.push(cards[cont]);
                cont++;
            }
        });

        //GET A RANDOM REWARD FOR OVERCOMING THE LEVEL
        if (level >= 3) {
            const prob = getRandomInt(2);
            if (prob === 0) {
                await increaseLevel(newPlayersArray, "throwingStar", roomId)
            } else {
                await increaseLevel(newPlayersArray, "live", roomId)
            }
        } else {
            await increaseLevel(newPlayersArray, "none", roomId)
        }

        //WRITE THE CHANGES ONTO THE DB:
    }


}
