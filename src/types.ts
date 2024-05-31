export enum gameEvents {
    none = "", //Default state, game is either waiting to start or in progress without problems
    lost = "lost", //Event triggered when the game is lost and every player should leave the room
    lostLive = "lostLive", //Event triggered when a life is lost but the game keeps on going
    nextRound = "nextRound", //Event triggered when a level is finished and a new one should start, can only be confirmed by the user that played the last card
}

export interface GameRoomProps {
    id: string;
    name: string;
    requiredPlayers: number;
    players: PlayerProps[];
    creator: string;
    started: boolean;
    discarded: number[];
    level: number;
    joinedPlayers: number;
}

export interface ActiveGameRoomProps extends GameRoomProps{
    lives: number,
    throwingStars: number,
    lastMove: number,
    nextAction: gameEvents,
}

export interface PlayerProps {
    userid: string,
    username: string,
    hand: number[];
}

export interface userData {
    userName: string;
    userId: string;
}
