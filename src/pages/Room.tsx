import { useEffect, useState } from "react";
import { ActiveGameRoomProps, PlayerProps, gameEvents } from "../types";
import { doc, onSnapshot } from "firebase/firestore";
import {
  auth,
  db,
  deleteGameRoom,
  playInvalidCard,
  playValidCard,
  processVotingResults,
  requestThrowingStar,
  voteThrowingStar,
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
    throwingStarRequest: [{
        userid: "string",
        answer: false,
      }]
  });
  //State that helps render the ui when a life is lost
  const [lostLife, setLostLife] = useState(false);

  //State that contains the hands of the player
  const [playerHand, setPlayerHand] = useState<number[]>([]);

  //State that helps render the voting ui when a throwin star is requested;
  const [votingCompleted, setVotingCompleted] = useState(false);

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
        throwingStarRequest: doc.data()?.throwingStarRequest,
      };

      //TODO: Handle if document doesnt exist
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
      <main className="landing-dialog" style={{ padding: "1rem 2rem" }}>
      <div className="flex-col" style={{ width: "100%" }}>
        <h1>Welcome to {roomData.name} game room</h1>
        <h2>We are currently waiting for all players to join...</h2>
        <h3 style={{paddingTop: '2rem'}}>List of players:</h3>
        <ul>
          {roomData.players.map((item) => {
            return <li className = "font-bold font-xl"key={item.username}>{item.username}</li>;
          })}
        </ul>
        <h3 style={{paddingTop: '1rem'}}>
          {roomData.requiredPlayers - roomData.joinedPlayers} /{" "}
          {roomData.requiredPlayers} players remaining...
        </h3>
        </div>
      </main>
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
        roomData.players.length * roomData.players[0].hand.length
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
    await requestThrowingStar(roomId);
  }

  const handleThrowingStarRequest = async (answer: boolean) => {
    await voteThrowingStar(roomId, answer);
  }

  const finishThrowingStarRequest = async () => {
    console.log("here");
    if (roomData.throwingStarRequest.length === roomData.requiredPlayers) {
      console.log("voting completed");
      let answer = true;
      for (let i = 0; i < roomData.throwingStarRequest.length; i++) {
        if (!roomData.throwingStarRequest[i].answer) {
          answer= false;
        }
      }
      console.log(answer);
        await processVotingResults(roomId, answer, roomData.players, roomData.throwingStarRequest[0].userid, roomData.discarded);
    }
  }
  finishThrowingStarRequest();

  const handleGameOver = async () => {
    if (playerHand.includes(roomData.lastMove)) {
      await deleteGameRoom(roomId);
    }
    navigate("/find-a-room");
  };

  return (
    <main>
      <section className="flex-row" style={{width: '100%', justifyContent: "space-between", alignItems: "start"}}>
        <h2>Level {roomData.level}</h2>
        <h1>{roomData.name}'s Game Room</h1>
        <div className="flex-col" style={{alignItems: "end"}}>
          <p>Lives: {roomData.lives}</p>
          <p>Shooting Stars: {roomData.throwingStars}</p>
          {roomData.throwingStars ? 
          <button className="btn label" onClick={handlePlayThrowingStar}>
            Play Shooting star
          </button>
          : <></>}
        </div>
      </section>
      {/* MAIN GAME GRAPHICS */}
      {roomData.discarded.map((item) => {
        return (
          <button className="btn" key={item}>
            {item}
          </button>
        );
      })}
      <h2>Your hand</h2>
      <div style={{position: 'absolute', bottom: 0, left: '50%', justifyContent:'center'}} className="flex-row">
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
      </div>
      {/* THROWING STAR REQUESTED! */}
      {roomData.nextAction === gameEvents.throwingStarRequest ? (
        <div>
          <h3>{roomData.throwingStarRequest[0].userid} has requested to play a throwing star</h3>
          <p>{roomData.throwingStarRequest.length} / {roomData.requiredPlayers} players voted already</p>
          <p>Votes:</p>
          <div className="flex-row">
            <div>
          <p>Yes</p>
            <ul>
              {roomData.throwingStarRequest.map((item) => {
                if (item.answer) {
                  return (
                    <li>
                      {item.userid}
                    </li>
                  )
                }
              })}
            </ul>
              </div>
              <div>
          <p>No</p>
            <ul>
              {roomData.throwingStarRequest.map((item) => {
                if (!item.answer) {
                  return (
                    <li>
                      {item.userid}
                    </li>
                  )
                }
              })}
            </ul>
              </div>
          </div>
            <button className="btn" onClick={() => handleThrowingStarRequest(true)}>
              Accept
            </button>
            <button className="btn" onClick={() => handleThrowingStarRequest(false)}>
              Deny
            </button>
        </div>
      ) : (
        <></>
      )}
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
      {/* GAME COMPLETED GRAPHICS */}
      {roomData.nextAction === gameEvents.gameCompleted ? (
        <div>
          <h3>Congratulations!</h3>
          <p>You have managed to complete the game succesfully!</p>
          <button className="btn" onClick={() => {navigate("/find-a-room")}}>
            Accept
          </button>
        </div>
      ) : (
        <></>
      )}
      {/* TOOD: Chat */}
    </main>
  );
};

export default Room;
