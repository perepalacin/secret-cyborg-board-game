import { FormEvent, useState } from "react";
import useComponentVisible from "../hooks/useComponentVisible";
import { XIcon } from "lucide-react";
import { createGameRoom } from "../firebase/firebase";

const CreateNewRoom = () => {
    
    //TODO: Pass a prop to disable the create a room button when the user joins a room or creates one!
    const [dialogVisible, setDialogVisible] = useState(false);
    const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

    const playersOptions = [5, 6, 7, 8, 9, 10];
    const votingOptions =  [15, 30, 45, 60];
    const discussionOptions =  [30, 60, 90, 120, 150];

    const [gameRoom, setGameRoom] = useState({
        id: "",
        name: "",
        requiredPlayers: 5,
        votingTimer: 15,
        discussionTimer: 30,
        creator: "",
        players: [""]
    });

    const handleGameChange = (input: string, value: number) => {
        setGameRoom(prevGameRoom => {
            switch (input) {
                case "players":
                    return { ...prevGameRoom, requiredPlayers: value };
                case "voting":
                    return { ...prevGameRoom, votingTimer: value };
                case "discussion":
                    return { ...prevGameRoom, discussionTimer: value };
                default:
                    return prevGameRoom;
            }
        });
    };

    const handleInputChange = (value: string) => {
        setGameRoom(prevGameRoom => {
            return {...prevGameRoom, name: value};
        })
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        createGameRoom(gameRoom);
        setDialogVisible(false);
        setIsComponentVisible(false);
        //TODO: ERROR HANDLING
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
                <p>Name:</p>
                <input className="form_style" onChange={(e) => {handleInputChange(e.target.value)}}/>
                <p>Players:</p>
                <ul className="flex-row" style={{"justifyContent": "start", "gap": "1rem", "flexWrap": "wrap"}}>
                    {playersOptions.map((item) => {
                        return (
                            <li key={item}>
                                <button type="button" className="btn btn-icon" onClick={() => {handleGameChange("players", item)}} style={{backgroundColor: gameRoom.requiredPlayers == item ? "#c4a1ff" : "#FFFFFF"}}>
                                    {item}
                                </button>
                            </li>
                        )
                    })}
                </ul>
                <p>Voting Timer: (seconds)</p>
                <ul className="flex-row" style={{"justifyContent": "start", "gap": "1rem", "flexWrap": "wrap"}}>
                    {votingOptions.map((item) => {
                        return (
                            <li key={item}>
                                <button type="button" className="btn btn-icon" onClick={() => {handleGameChange("voting", item)}} style={{backgroundColor: gameRoom.votingTimer == item ? "#c4a1ff" : "#FFFFFF"}}>
                                    {item}
                                </button>
                            </li>
                        )
                    })}
                </ul>
                <p>Discussion Timer: (seconds)</p>
                <ul className="flex-row" style={{"justifyContent": "start", "gap": "1rem", "flexWrap": "wrap"}}>
                    {discussionOptions.map((item) => {
                        return (
                            <li key={item}>
                                <button type="button" className="btn btn-icon" onClick={() => {handleGameChange("discussion", item)}} style={{backgroundColor: gameRoom.discussionTimer === item ? "#c4a1ff" : "#FFFFFF"}}>
                                    {item}
                                </button>
                            </li>
                        )
                    })}
                </ul>
                <button className="btn btn-label" disabled = {gameRoom.name.length === 0}>Create room</button>
            </form>
          </div>
        :
        <></>
        }
    </div>
  )
}

export default CreateNewRoom