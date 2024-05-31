import { useEffect, useState } from "react";
import { ActiveGameRoomProps, PlayerProps, gameEvents } from "../types";
import { doc, onSnapshot } from "firebase/firestore";
import {
  auth,
  db,
  deleteGameRoom,
  playInvalidCard,
  playValidCard,
} from "../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { GameLogic } from "../utils/GameManager";

const Room = () => {
  const navigate = useNavigate();

  //Class that helps building the deck and managing the game state
  const GameManager = new GameLogic();

  //Check the auth state
  var userId = "";
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      navigate("/");
    } else {
      userId = user.uid;
    }
  });

  //Get the room id, if it doesnt exist, return to home;
  const { roomId } = useParams();
  if (!roomId) {
    navigate("/find-a-room");
    return null;
  }

  //TODO: Check every 60 seconds if the user is still there, if not, kick him out!

  const [roomData, setRoomData] = useState<ActiveGameRoomProps>({
    id: "",
    name: "",
    requiredPlayers: 15,
    players: [
      {
        userid: "string",
        username: "string",
        hand: [],
      },
    ],
    creator: "",
    started: false,
    discarded: [],
    level: 1,
    lives: 1,
    joinedPlayers: 1,
    throwingStars: 1,
    lastMove: 0,
    nextAction: gameEvents.none,
  });
  const [lostLife, setLostLife] = useState(false);

  //State that contains the hands of the player
  const [playerHand, setPlayerHand] = useState<number[]>([]);

  useEffect(() => {
    //SUBSCRIBE TO FIREBASE REALTIME DOC OF THE ROOM
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
        lives: doc.data()?.lives,
        throwingStars: doc.data()?.throwingStars,
        joinedPlayers: doc.data()?.joinedPlayers,
        lastMove: doc.data()?.lastMove,
        nextAction: doc.data()?.nextAction,
      };

      if (fetchedData.nextAction === gameEvents.lostLive) {
        setLostLife(true);
      } else if (fetchedData.nextAction === gameEvents.nextRound || fetchedData.nextAction === gameEvents.lost) {
        setLostLife(false);
      }
      //LOOK IF THE USER LOGGED IN IS INSIDE THE ROOM DOCUMENT, IF NOT, SEND HIM BACK TO THE LOBBY
      let playerIn = false;
      fetchedData.players.forEach((item: PlayerProps) => {
        if (item.userid === userId) {
          playerIn = true;
        }
      });
      if (!playerIn) {
        navigate("/find-a-room");
      }

      //UPDATE THE STATE THAT RENDERS THE ROOM
      setRoomData(fetchedData);

      //UPDATE THE STATE THAT RENDERS THE HANDS OF THE USER
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
        <h1>Welcome to {roomData.name} game room</h1>
        <h2>We are currently waiting for all players to join...</h2>
        <h3>
          {roomData.requiredPlayers - roomData.joinedPlayers} /{" "}
          {roomData.requiredPlayers} players remaining...
        </h3>
        <ul>
          {roomData.players.map((item) => {
            return <li key={item.username}>{item.username}</li>;
          })}
        </ul>
      </section>
    );
  }

  //FUNCTION THAT MANAGES WHEN A USER HAS CLICKED A CARD
  const handlePlayCard = async (card: number) => {
    //CHECK IF THE CARD IS LEGAL
    const wastedLives = GameManager.playCard(
      roomData.players,
      card,
      roomData.discarded
    );
    if (wastedLives > 0) {
      await playInvalidCard(
        card,
        roomId,
        roomData.lives - wastedLives,
        roomData.players,
        roomData.discarded,
        roomData.players.length * roomData.level
      );
    } else {
      await playValidCard(
        card,
        roomId,
        roomData.discarded,
        roomData.players.length * roomData.level
      );
    }
  };

  //ONCE A LEVEL IS COMPLETED, THE USER THAT DID THE LAST MOVE, SHOULD MOVE TO THE NEXT LEVEL
  const handleGetNextRound = async () => {
    const cards = GameManager.shuffleCards(
      roomData.players.length,
      roomData.level + 1
    );
    await GameManager.moveToNextLevel(
      roomData.level + 1,
      cards,
      roomData.players,
      roomId
    );
  };

  const handlePlayThrowingStar = async () => {
    alert("play a throwing star");
  }

  const handleGameOver = async () => {
    if (playerHand.includes(roomData.lastMove)) {
      await deleteGameRoom(roomId);
    }
    navigate("/find-a-room");
  };

  return (
    <section>
      <h1>Board Game</h1>
      {/* MAIN GAME GRAPHICS */}
      {roomData.discarded.map((item) => {
        return (
          <button className="btn" key={item}>
            {item}
          </button>
        );
      })}
      <h2>Your hand</h2>
      {playerHand.map((item) => {
        return (
          <button
            key={item}
            className="btn"
            onClick={() => {
              handlePlayCard(item);
            }}
          >
            {item}
          </button>
        );
      })}
      <p>Lives: {roomData.lives}</p>
      {roomData.throwingStars ? 
      <button className="btn" onClick={handlePlayThrowingStar}>
        Play Shooting star
      </button>
      : <></>}
      <p>Shooting Stars: {roomData.throwingStars}</p>
      {/* NEXT ROUND GRAPHICS */}
      {roomData.nextAction === gameEvents.nextRound ? (
        <div>
          <h3>Well done!</h3>
          {playerHand.includes(Number(roomData.lastMove)) ? (
            <button className="btn" onClick={handleGetNextRound}>
              Next Round
            </button>
          ) : (
            <p>Wait for the next move</p>
          )}
          Congratulations! Level {roomData.level} passed!
        </div>
      ) : (
        <></>
      )}
      {/* LOST LIVE GRAPHICS */}
      {lostLife ? (
        <div>
          <h3>Ooops... Looks like someone skipped a card...</h3>
            //Dialog with a graphic showing that a life was lost
            <button
              className="btn"
              onClick={() => {
                setLostLife(false);
              }}
            >
              Accept
            </button>
        </div>
      ) : (
        <></>
      )}
      {/* GAME OVER GRAPHICS */}
      {roomData.nextAction === gameEvents.lost ? (
        <div>
          <h3>Game over!</h3>
          //Dialog with a graphic showing that a life was lost
          <button className="btn" onClick={handleGameOver}>
            Accept
          </button>
        </div>
      ) : (
        <></>
      )}

      {/* TOOD: Chat */}
    </section>
  );
};

export default Room;
