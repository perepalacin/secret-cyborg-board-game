import { FormEvent, useState } from "react";
import useComponentVisible from "../hooks/useComponentVisible";
import { XIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GameLogic } from "../utils/GameManager";
import { onAuthStateChanged } from "firebase/auth";
import { auth, createGameRoom } from "../firebase/firebase";

const CreateNewRoom = () => {
    
    var userId = "";

    onAuthStateChanged(auth, (user) => {
        if (user) {
          userId = user.uid;
        } 
      });

    //TODO: Pass a prop to disable the create a room button when the user joins a room or creates one!
    const [dialogVisible, setDialogVisible] = useState(false);
    const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [roomName, setRoomName] = useState("");
    const [requiredPlayers, setRequiredPlayers] = useState(2);
    const playersOptions = [2, 3, 4];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const game = new GameLogic();
        if (!userId) {
            console.log("error");
            return null;

        }
        const gameRoom = game.createGameRoom(roomName, requiredPlayers,userName, userId);
        console.log(gameRoom);
        const id = await createGameRoom(gameRoom);
        if (id === "none" || !id) {
            console.log("not id")
            alert("There was a problem creating your room, please try again later");
            return null;
        } else {
            navigate(`/room/${id}`);
        }
        console.log(id);
        setDialogVisible(false);
        setIsComponentVisible(false);
    }

  return (
    <div>
    <button className="btn label purple-bg"       
        onClick={() => {
            setIsComponentVisible(true);
            setDialogVisible(true);
        }}>Create a room</button>
      {isComponentVisible && dialogVisible ? 
          <div className="form-backplate" ref={ref}
        //   onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}
          >
            <form className = "flex-col create-room-form" onSubmit={handleSubmit}>
                <h4>Set up the rules for your game:</h4>
                <button className="btn btn-icon close-dialog-btn" type="button" onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}>
                    <XIcon width={12} height={12} />
                </button>
                <h5>Room name:</h5>
                <input autoFocus={true} placeholder="The best players" onChange={(e) => {setRoomName(e.target.value)}} value={roomName}/>
                <h5>Players:</h5>
                <ul className="flex-row" style={{"justifyContent": "start", "gap": "1rem", "flexWrap": "wrap"}}>
                    {playersOptions.map((item) => {
                        return (
                            <li key={item}>
                                <button type="button" className="btn icon" onClick={() => {setRequiredPlayers(item)}} style={{backgroundColor: requiredPlayers == item ? "#c4a1ff" : "#FFFFFF"}}>
                                    {item}
                                </button>
                            </li>
                        )
                    })}
                </ul>
                <h5>Your username:</h5>
                <input placeholder="Lucas" onChange={(e)=> {setUserName(e.target.value)}} value={userName}/>
                <button className="btn label purple-bg" disabled = {roomName.length === 0 || userName.length === 0}>Create room</button>
            </form>
          </div>
        :
        <></>
        }
    </div>
  )
}

export default CreateNewRoom