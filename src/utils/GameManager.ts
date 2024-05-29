import { GameRoomProps, PlayerProps } from "../types";

export function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

export class GameLogic {
    private deck: number[];

    public constructor() {
        this.deck = [];
        for (var i = 1; i <= 100; i++) {
            this.deck.push(i);
        }
    }

    //Helper function to build the first game room
    public createGameRoom (name: string, requiredPlayers: number, username: string, userId: string) {
        const players: PlayerProps[] = [];
        const cards = this.createHands(requiredPlayers, 1);
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
    public createHands (players: number, level: number) {
        const cards = [];
        for (let i = 0; i < players; i++) {
            for (let j = 0; j < level; j++) {
                const card = getRandomInt(this.deck.length);
                cards.push(card);
                this.deck.filter((item) => item === card);
            }
        };
        return cards;
    }

    //Function to check if the last played card is valied
    public playCard(players: PlayerProps[], card: number) {
        for (let i = 0; i < players.length; i++) {
            for (let j = 0; j < players[i].hand.length; j ++) {
                if (card > players[i].hand[j]) {
                    return false;
                }
            }
        }
        return true;
    }


}
