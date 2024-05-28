export interface GameRoomProps {
    id: string;
    name: string;
    votingTimer: number;
    requiredPlayers: number;
    discussionTimer: number;
    players: PlayerProps[];
    creator: string;
    started: boolean;
}

export interface PlayerProps {
    userid: string,
    username: string,
    action: string,
    faction: string,
}

export interface userData {
    userName: string;
    userId: string;
}
