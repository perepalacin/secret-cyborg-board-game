import { UserIcon, XIcon } from 'lucide-react';
import { GameRoomProps, PlayerProps } from '../types';
import { joinGameRoom } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import useComponentVisible from '../hooks/useComponentVisible';

interface RoomsListProps {
    data: GameRoomProps[];
}

const RoomsList = ({data}: RoomsListProps) => {

    const navigate = useNavigate();
    const [dialogVisible, setDialogVisible] = useState(false);
    const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);
    const [username, setUserName] = useState("");

    if (data.length === 0) {
        return (
            <p>No game rooms found</p>
        );
    };
    
    const handleSubmit = async (event: FormEvent, id: string, players: PlayerProps[], requiredPlayers: number) => {
        //Last player to join triggers the event that puts all players in the game!
        event.preventDefault();
        //TODO: Check if the username is already taken!
        const response = await joinGameRoom(id, players, username, requiredPlayers);
        if (!response) {
            alert("There was a problem joining the room, please try again later");
        } else {
            navigate(`/room/${id}`);
        }
    }


  return (
    <ul className='games-list flex-col'>
        {data.map((item) => {
            return (
                <li key={item.id} className='flex-row' style={{justifyContent: 'space-between'}}>
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
                        <button className='btn' onClick={() => {setDialogVisible(true); setIsComponentVisible(true);}}>Join</button>
                    </div>
                    {isComponentVisible && dialogVisible ? 
                      <div style={{"position": "absolute", "top": "0", "left": "0", "width": "100%", "height": "100vh", "backgroundColor": "rgba(1, 1, 1, 0.2)", "display": "flex", "flexDirection": "column", "justifyContent": "center", "alignItems": "center"}} ref={ref}
                    //   onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}
                      >
                        <form className = "flex-col" style={{"zIndex": "50", "width": "600px", "backgroundColor": "white", "alignItems": "start"}} onSubmit={(event) => {handleSubmit(event, item.id, item.players, item.requiredPlayers)}}>
                            <div className="flex-row" style={{"justifyContent": "space-between", "width": "100%"}}>
                                <h4>Choose a username for this game:</h4>
                                <button className="btn btn-icon" type="button" onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}>
                                    <XIcon width={12} height={12} />
                                </button>
                            </div>
                            <p>Name:</p>
                            <input className="form_style" onChange={(e) => {setUserName(e.target.value)}} autoFocus={true}/>
                            <button className="btn btn-label" disabled = {username.length === 0}>Join</button>
                        </form>
                      </div>
                    :
                    <></>
                    }
                </li>
            )
        })}
    </ul>
  )
}

export default RoomsList