import { useEffect, useState } from "react";
import { GameRoomProps } from "../types";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const Room = () => {

    const navigate = useNavigate();
    var userId = "";
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            navigate("/");
        } else {
            userId = user.uid;
        }
      });

  const { roomId } = useParams();
  if (!roomId) {
    navigate("/find-a-room");
    return null;
  }
  //TODO: Check every 60 seconds if the user is still there, if not, kick him out!
  const [roomData, setRoomData] = useState<GameRoomProps>({
    id: "",
    name: "",
    votingTimer: 15,
    requiredPlayers: 15,
    discussionTimer: 15,
    players: [{
        userid: "string",
        username: "string",
        action: "string",
        faction: "string",
    }],
    creator: "",
    started: false,
  });

  useEffect(() => {
    const docRef = doc(db, "gamerooms", roomId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      const fetchedData = {
        id: doc.id,
        name: doc.data()?.name,
        votingTimer: doc.data()?.votingTimer,
        requiredPlayers: doc.data()?.requiredPlayers,
        discussionTimer: doc.data()?.discussionTimer,
        players: doc.data()?.players,
        usernames: doc.data()?.usernames,
        creator: doc.data()?.creator,
        started: doc.data()?.started,
      };
      setRoomData(fetchedData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (roomData.started === true) {
        //TODO: display a loading widget while this happends.
        //Send everyone to a new room;
        alert("The game shall begin!");
    }
  }, [roomData])
  return (
    <section>
        <h1>
            Welcome to {roomData.name} game room
        </h1>
        <h2>
            We are currently waiting for all players to join... 
        </h2>
        <h3>
            {roomData.requiredPlayers - roomData.players.length} / {roomData.requiredPlayers} players remaining...
        </h3>
        <ul>
            {roomData.players.map((item) => {
                return (
                    <li>
                        {item.username}
                    </li>
                )
            })}
        </ul>

    </section>
    ); 
};

export default Room;
