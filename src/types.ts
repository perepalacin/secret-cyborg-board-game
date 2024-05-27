export interface GameRoomProps {
    id: string;
    name: string;
    votingTimer: number;
    requiredPlayers: number;
    discussionTimer: number;
    players: string[];
    creator: string;
}

export interface userData {
    userName: string;
    userId: string;
}
