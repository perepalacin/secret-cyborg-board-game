import { useEffect, useState } from "react";
import { GameRoomProps, PlayerProps } from "../types";
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
import { GameLogic } from "../utils/GameManager";

const Room = () => {

    const navigate = useNavigate();
    const GameManager = new GameLogic();
    //WE check the auth state
    var userId = "";
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            navigate("/");
        } else {
            userId = user.uid;
        }
      });

  //We get the room id if it doesnt exist, return to home;
  const { roomId } = useParams();
  if (!roomId) {
    navigate("/find-a-room");
    return null;
  }

  //TODO: Check every 60 seconds if the user is still there, if not, kick him out!
  const [roomData, setRoomData] = useState<GameRoomProps>({
    id: "",
    name: "",
    requiredPlayers: 15,
    players: [{
        userid: "string",
        username: "string",
        hand: [],
    }],
    creator: "",
    started: false,
    discarded: [],
    level: 1,
    joinedPlayers: 1,
  });
  const [playerHand, setPlayerHand] = useState<number[]>([]);

  
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
        discarded: doc.data()?.discarded,
        level: doc.data()?.level,
        joinedPlayers: doc.data()?.joinedPlayers,
      };

      let playerIn = false;
      fetchedData.players.forEach((item: PlayerProps) =>{
        if (item.userid === userId) {
          playerIn = true;
        }
      })
      if (!playerIn) {
        navigate("/find-a-room");
      }
      setRoomData(fetchedData);
      for (let i = 0; fetchedData.players.length; i++) {
        if (fetchedData.players[i].userid === userId) {
          setPlayerHand(fetchedData.players[i].hand);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!roomData.started) {
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
    )
  }


  const handlePlayCard = (card: number) => {
    
    const validMove = GameManager.playCard(roomData.players, card);
    if (!validMove) {
      alert("Lost");
    }
  }

  return (
    <section>
      <h1>Board Game</h1>
      {playerHand.map((item) => {
        return (
          <button className="btn" onClick={() => {handlePlayCard(item)}}>{item}</button>
        )
      })}
      {/* TOOD: Chat */}
    </section>
    ); 
};

export default Room;
