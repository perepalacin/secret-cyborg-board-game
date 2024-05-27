import { UserIcon } from 'lucide-react';
import { GameRoomProps } from '../types';
import { joinGameRoom } from '../firebase/firebase';

interface RoomsListProps {
    data: GameRoomProps[];
}

const RoomsList = ({data}: RoomsListProps) => {

    if (data.length === 0) {
        return (
            <p>No game rooms found</p>
        );
    };

  return (
    <ul className='games-list flex-col'>
        {data.map((item) => {
            return (
                <li className='flex-row' style={{justifyContent: 'space-between'}}>
                    <div className='flex-col'>
                    <p>{item.name}</p>
                    <p>{item.id}</p>
                    </div>
                    <div className='flex-row'>
                        <div className='flex-col'>
                            <p>Discussion: {item.discussionTimer} sec</p>
                            <p>Voting: {item.votingTimer} sec</p>
                        </div>
                        <UserIcon />
                        <p>
                            {item.players.length} / {item.requiredPlayers}
                        </p>
                        <button className='btn' onClick={() => {joinGameRoom(item.id, item.players)}}>Join</button>
                    </div>
                </li>
            )
        })}
    </ul>
  )
}

export default RoomsList