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
    <button className="btn btn-label"       
        onClick={() => {
            setIsComponentVisible(true);
            setDialogVisible(true);
        }}>Create a room</button>
      {isComponentVisible && dialogVisible ? 
          <div style={{"position": "absolute", "top": "0", "left": "0", "width": "100%", "height": "100vh", "backgroundColor": "rgba(1, 1, 1, 0.2)", "display": "flex", "flexDirection": "column", "justifyContent": "center", "alignItems": "center"}} ref={ref}
        //   onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}
          >
            <form className = "flex-col" style={{"zIndex": "50", "width": "600px", "backgroundColor": "white", "alignItems": "start"}} onSubmit={handleSubmit}>
                <div className="flex-row" style={{"justifyContent": "space-between", "width": "100%"}}>
                    <h4>Set up the rules for your game:</h4>
                    <button className="btn btn-icon" type="button" onClick={() => {setDialogVisible(false); setIsComponentVisible(false)}}>
                        <XIcon width={12} height={12} />
                    </button>
                </div>
                <p>Room name:</p>
                <input className="form_style" onChange={(e) => {setRoomName(e.target.value)}} value={roomName}/>
                <p>Players:</p>
                <ul className="flex-row" style={{"justifyContent": "start", "gap": "1rem", "flexWrap": "wrap"}}>
                    {playersOptions.map((item) => {
                        return (
                            <li key={item}>
                                <button type="button" className="btn btn-icon" onClick={() => {setRequiredPlayers(item)}} style={{backgroundColor: requiredPlayers == item ? "#c4a1ff" : "#FFFFFF"}}>
                                    {item}
                                </button>
                            </li>
                        )
                    })}
                </ul>
                <p>Your username:</p>
                <input className="form_style" onChange={(e)=> {setUserName(e.target.value)}} value={userName}/>
                <button className="btn btn-label" disabled = {roomName.length === 0 || userName.length === 0}>Create room</button>
            </form>
          </div>
        :
        <></>
        }
    </div>
  )
}

export default CreateNewRoom