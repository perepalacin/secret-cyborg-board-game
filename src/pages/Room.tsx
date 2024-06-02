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
import { createRaindrops, rootDiv } from "../utils/animations";
import { LoaderCircle } from "lucide-react";

const Room = () => {

  window.addEventListener('load', rootDiv);
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
    throwingStarRequest: [
      {
        userid: "string",
        answer: false,
      },
    ],
  });
  //State that helps render the ui when a life is lost
  const [lostLife, setLostLife] = useState(false);

  //State that contains the hands of the player
  const [playerHand, setPlayerHand] = useState<number[]>([]);

  //State that controls the last move made by the user to know if he has to take action
  const [lastPlayerMove, setLastPlayerMove] = useState<number>(1000);

  //State that controls wether or not the user has voted already or not.
  const [voted, setVoted] = useState(false);

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

      if (fetchedData.started) {
        window.removeEventListener('load', createRaindrops);

      }

      //TODO: Handle if document doesnt exist
      if (fetchedData.nextAction === gameEvents.lostLive) {
        setLostLife(true);
      } else if (
        fetchedData.nextAction === gameEvents.nextRound ||
        fetchedData.nextAction === gameEvents.lost
      ) {
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
          const filteredHands: number[] =  [];
          fetchedData.players[i].hand.forEach((card: number) => {
            if (!fetchedData.discarded.includes(card)) {
              filteredHands.push(card);
            }
          });
          setPlayerHand(filteredHands);
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
          <h3 style={{ paddingTop: "2rem" }}>List of players:</h3>
          <ul>
            {roomData.players.map((item) => {
              return (
                <li className="font-bold font-xl" key={item.username}>
                  {item.username}
                </li>
              );
            })}
          </ul>
          <h3 style={{ paddingTop: "1rem" }}>
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
    setVoted(true);
    await requestThrowingStar(roomId);
  };

  const handleThrowingStarRequest = async (answer: boolean) => {
    await voteThrowingStar(roomId, answer);
  };

  const finishThrowingStarRequest = async () => {
    console.log("here");
    if (roomData.throwingStarRequest.length === roomData.requiredPlayers) {
      if (voted) {
        setVoted(false);
      }
      let answer = true;
      for (let i = 0; i < roomData.throwingStarRequest.length; i++) {
        if (!roomData.throwingStarRequest[i].answer) {
          answer = false;
        }
      }
      console.log(answer);
      await processVotingResults(
        roomId,
        answer,
        roomData.players,
        roomData.throwingStarRequest[0].userid,
        roomData.discarded
      );
    }
  };
  finishThrowingStarRequest();

  const handleGameOver = async () => {
    if (playerHand.includes(roomData.lastMove)) {
      await deleteGameRoom(roomId);
    }
    navigate("/find-a-room");
  };

  return (
    <main style={{width: '100%', padding: 0, margin: 0}}>
      <section
        className="flex-row"
        style={{
          justifyContent: "space-between",
          alignItems: "start",
          margin: '2rem 4rem'
        }}
      >
        <h2>Level {roomData.level}</h2>
        <h1>{roomData.name}'s Game Room</h1>
        <div className="flex-col" style={{ alignItems: "end" }}>
          <p>Lives: <span className="font-bold">{roomData.lives}</span></p>
          <p>Shooting Stars: <span className="font-bold">{roomData.throwingStars}</span></p>
          {roomData.throwingStars ? (
            <button className="btn label yellow-bg" onClick={handlePlayThrowingStar}>
              Play Shooting star
            </button>
          ) : (
            <></>
          )}
        </div>
      </section>
      {/* MAIN GAME GRAPHICS */}
      {/* DISCARD PILE */}
      <ul className="flex-row discarded-pile">
      {roomData.discarded.map((item, index) => {
        return (
          <li className="discarded-card" key={item} 
          style={{left: `${index*2 + 2}rem`}}
          >
            <span className="info-card-number">{item}</span>
            <p className="main-card-number">{item}</p>
          </li>
        );
      })}
      </ul>
      {/* PLAYER HANDS */}
      <section
        className="flex-row player-hands"
      >
        {playerHand.map((item) => {
          return (
            <button
              key={item}
              className="card"
              onClick={() => {
                setLastPlayerMove(item);
                handlePlayCard(item);
              }}
            >
              <span className="info-card-number">{item}</span>
              <p className="main-card-number">{item}</p>
            </button>
          );
        })}
      </section>
      {/* THROWING STAR REQUESTED! */}
      {roomData.nextAction === gameEvents.throwingStarRequest ? (
                  <div className="form-backplate">
                  <article className="flex-col create-room-form" style={{gap: '1rem'}}>

          <h1>
            A player has requested to play a
            throwing star
          </h1>
          <p>
            {roomData.throwingStarRequest.length} / {roomData.requiredPlayers}{" "}
            players voted already
          </p>
          <p className="font-bold">Votes:</p>
          <div className="flex-row" style={{gap: '2rem'}}>
            <div>
              <p>Yes: <span className="font-bold">{roomData.throwingStarRequest.filter((item) => item.answer === true).length}</span></p>
            </div>
            <div>
              <p>No: <span className="font-bold">{roomData.throwingStarRequest.filter((item) => item.answer === false).length}</span></p>

            </div>
          </div>
          {voted ? <></> : 
          <div className="flex-row" style={{gap: '2rem'}}>
          <button
            className="btn label green-bg"
            onClick={() => {setVoted(true); handleThrowingStarRequest(true)}}
            >
            Accept
          </button>
          <button
            className="btn label red-bg"
            onClick={() => {setVoted(true); handleThrowingStarRequest(false)}}
            >
            Deny
          </button>
          </div>
          }
            </article>
        </div>
      ) : (
        <></>
      )}
      {/* NEXT ROUND GRAPHICS */}
      {roomData.nextAction === gameEvents.nextRound ? (
          <div className="form-backplate">
            <article className="flex-col create-room-form" style={{gap: '1rem'}}>
              <h1>Well done!</h1>
              <p>Congratulations! Level {roomData.level} completed!</p>
              {lastPlayerMove === Number(roomData.lastMove) ? (
                <button className="accent-btn label yellow-bg" onClick={handleGetNextRound}>
                  Next Round
                </button>
              ) : (
                <p className="loading-text">Wait for the next move <LoaderCircle className="loading-icon" size={10}/></p>
              )}
            </article>
          </div>
      ) : (
        <></>
      )}
      {/* LOST LIVE GRAPHICS */}
      {lostLife ? (
        <div className="form-backplate">
          <article className="flex-col create-room-form" style={{gap: '1rem'}}>
          <h1>Ooops... Looks like someone skipped a card...</h1>
          <p>You have lost one life. {roomData.lives} {roomData.lives >= 1 ? "lives" : "live"} remaining</p>
          <button
            className="accent-btn label yellow-bg"
            onClick={() => {
              setLostLife(false);
            }}
            >
            Accept
          </button>
            </article>
        </div>
      ) : (
        <></>
      )}
      {/* GAME OVER GRAPHICS */}
      {roomData.nextAction === gameEvents.lost ? (
        <div className="form-backplate">
        <article className="flex-col create-room-form" style={{gap: '2rem'}}>
          <h1>Game over!</h1>
          <p style={{textAlign: 'center'}}>Your team has run out of lives! Better luck next time!</p>
          <button className="btn label yellow-bg" onClick={handleGameOver}>
            Accept
          </button>
        </article>
        </div>
      ) : (
        <></>
      )}
      {/* GAME COMPLETED GRAPHICS */}
      {roomData.nextAction === gameEvents.gameCompleted ? (
                  <div className="form-backplate">
                  <article className="flex-col create-room-form" style={{gap: '1rem'}}>
      
          <h1>Congratulations!</h1>
          <p>You have managed to complete the game succesfully!</p>
          <button
            className="accent-btn label yellow-bg"
            onClick={() => {
              navigate("/find-a-room");
            }}
          >
            Accept
          </button>
          </article>
          </div>
      ) : (
        <></>
      )}

      {/* TOOD: Chat */}
    </main>
  );
};

export default Room;
