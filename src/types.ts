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

export interface PlayerProps {
    userid: string,
    username: string,
    hand: number[];
}

export interface userData {
    userName: string;
    userId: string;
}
