import { UserIcon, XIcon } from 'lucide-react';
import { GameRoomProps, PlayerProps } from '../types';
import { auth, joinGameRoom } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import useComponentVisible from '../hooks/useComponentVisible';
import { onAuthStateChanged } from 'firebase/auth';

interface RoomsListProps {
    data: GameRoomProps[];
}

const RoomsList = ({data}: RoomsListProps) => {

    var userId = "";
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            navigate("/");
        } else {
            userId = user.uid;
        }
      });


    const navigate = useNavigate();
    const [dialogVisible, setDialogVisible] = useState(false);
    const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);
    const [username, setUserName] = useState("");

    if (data.length === 0) {
        return (
            <div style={{width: "50%"}}>
                <h3 className='no-rooms-text'>Sorry... there are no open game rooms at the moment</h3>
            </div>
        );
    };
    
    const handleSubmit = async (event: FormEvent, id: string, players: PlayerProps[], requiredPlayers: number, joinedPlayers: number) => {
        //Last player to join triggers the event that puts all players in the game!
        event.preventDefault();
        let success = false;
        //TODO: Check if the username is already taken!
        const newPlayersArray = players;
        for (let i = 0; i < players.length; i++) {
            if (newPlayersArray[i].username === username) {
                alert("Your username is already taken, please choose another one");
                success = false;
                break;
            } else if (newPlayersArray[i].userid == "") {
                newPlayersArray[i].username = username,
                newPlayersArray[i].userid = userId;
                success = true;
                break;
            }
        };
        if (success) {
            const response = await joinGameRoom(players, joinedPlayers, requiredPlayers, id);
            if (!response) {
                alert("There was a problem joining the room, please try again later");
            } else {
                navigate(`/room/${id}`);
            }
        }
        return null;
    }


  return (
    <ul className='games-list flex-col' style={{margin: '2rem 0rem'}}>
        {data.map((item) => {
            return (
                <li key={item.id} className='flex-row' style={{justifyContent: 'space-between', backgroundColor: "#E5F6F0"}}>
                    <div className='flex-col' style={{margin: '0rem 1rem', alignItems: 'start'}}>
                    <p className='font-xl font-bold'>{item.name}'s Game Room</p>
                    <p>Room Host: <span className='font-bold'>{item.players[0].username}</span></p>
                    </div>
                    <div className='flex-row'>
                        <div className='flex-col'>
                        </div>
                        <UserIcon />
                        <p>
                            {item.joinedPlayers} / {item.requiredPlayers}
                        </p>
                        <button className='btn icon dark-pink-bg' style={{padding: '0.25rem 0.5rem', margin: '0rem 1rem'}} onClick={() => {setDialogVisible(true); setIsComponentVisible(true);}}>Join</button>
                    </div>
                    {isComponentVisible && dialogVisible ? 
                      <div className='form-backplate' ref={ref}
                      >
                        <form className = "flex-col create-room-form" onSubmit={(event) => {handleSubmit(event, item.id, item.players, item.requiredPlayers, item.joinedPlayers)}}>
                            <div className="flex-row" style={{"justifyContent": "space-between", "width": "100%"}}>
                                <h4>Choose a username for this game:</h4>
                                <button className="btn btn-icon close-dialog-btn" type="button" onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}>
                                    <XIcon width={12} height={12} />
                                </button>
                            </div>
                            <h5>Name:</h5>
                            <input className="form_style" onChange={(e) => {setUserName(e.target.value)}} autoFocus={true}/>
                            <button className="btn label purple-bg" disabled = {username.length === 0}>Join</button>
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