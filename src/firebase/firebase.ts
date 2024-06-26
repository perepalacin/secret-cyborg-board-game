import { initializeApp } from "firebase/app";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  increment,
  updateDoc,
} from "firebase/firestore";
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import {
  GameRoomProps,
  PlayerProps,
  gameEvents,
  throwingStarRequest,
} from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig); //firebase app => auth
export const db = getFirestore(app); //Firestore

export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    return signInAnonymously(auth);
  })
  .catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorCode, errorMessage);
  });

export const AnonymousLogIn = () => {
  signInAnonymously(auth);
};

var userId = "";
var votingProcess = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
  } else {
    console.log("not logged in");
  }
});

export const createGameRoom = async (data: GameRoomProps) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const docRef = await addDoc(collection(db, "gamerooms"), {
      name: data.name,
      requiredPlayers: data.requiredPlayers,
      players: data.players,
      creator: data.creator,
      started: false,
      discarded: [],
      level: 1,
      lives: data.requiredPlayers,
      throwingStars: 0,
      joinedPlayers: 1,
    });
    return docRef.id;
  } catch (e) {
    alert("Couldn't create your room, try again later");
    return "none";
  }
};

export const joinGameRoom = async (
  players: PlayerProps[],
  joinedPlayers: number,
  requiredPlayers: number,
  roomId: string
) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized User");
    }
    const gamerooms = doc(db, "gamerooms", roomId);
    if (joinedPlayers + 1 > requiredPlayers) {
      throw new Error("Room capacity already exceeded");
    } else if (joinedPlayers + 1 === requiredPlayers) {
      await updateDoc(gamerooms, {
        started: true,
      });
    }
    await updateDoc(gamerooms, {
      joinedPlayers: increment(1),
      players: players,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const playValidCard = async (
  card: number,
  roomId: string,
  discarded: number[],
  requiredCards: number
) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized User");
    }
    const gamerooms = doc(db, "gamerooms", roomId);

    if (discarded.length === requiredCards - 1) {
      await updateDoc(gamerooms, {
        discarded: arrayUnion(card),
        lastMove: card,
        nextAction: gameEvents.nextRound,
      });
    } else {
      await updateDoc(gamerooms, {
        discarded: arrayUnion(card),
        lastMove: card,
        nextAction: gameEvents.none,
      });
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const playInvalidCard = async (
  card: number,
  roomId: string,
  livesLeft: number,
  players: PlayerProps[],
  discarded: number[],
  requiredCards: number
) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized User");
    }
    const gamerooms = doc(db, "gamerooms", roomId);
    const playedCards = discarded;
    if (livesLeft <= 0) {
      await updateDoc(gamerooms, {
        lastMove: card,
        nextAction: gameEvents.lost,
        lives: 0,
      });
    } else {
      await updateDoc(gamerooms, {
        lastMove: card,
        nextAction: gameEvents.lostLive,
      });
      players.forEach((item) => {
        console.log(item);
        for (let i = 0; i < item.hand.length; i++) {
          if (item.hand[i] < card && !discarded.includes(item.hand[i])) {
            console.log("true: " + item.hand[i]);
            playedCards.push(item.hand[i]);
          }
        }
      });
      playedCards.push(card);
      console.log(playedCards);
      if (playedCards.length === requiredCards) {
        await updateDoc(gamerooms, {
          nextAction: gameEvents.nextRound,
          discarded: playedCards,
          lives: livesLeft,
          lastMove: card,
        });
      } else {
        await updateDoc(gamerooms, {
          discarded: playedCards,
          lives: livesLeft,
          lastMove: card,
        });
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const increaseLevel = async (
  players: PlayerProps[],
  reward: string,
  roomId: string,
  level: number,
) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized User");
    } 
    const gamerooms = doc(db, "gamerooms", roomId);
    if ((players.length === 2 && level === 12) || (players.length === 3 && level === 10) || (players.length === 4 && level === 8)) {
      await updateDoc(gamerooms, {
        nextAction: gameEvents.gameCompleted,
      });
      return null;
    }
    switch (reward) {
      case "none":
        await updateDoc(gamerooms, {
          discarded: [],
          players: players,
          level: increment(1),
          lastMove: 0,
          nextAction: gameEvents.none,
        });
        break;
      case "live":
        await updateDoc(gamerooms, {
          discarded: [],
          players: players,
          level: increment(1),
          lives: increment(1),
          lastMove: 0,
          nextAction: gameEvents.none,
        });
        break;
      case "throwingStar":
        await updateDoc(gamerooms, {
          discarded: [],
          players: players,
          level: increment(1),
          throwingStars: increment(1),
          lastMove: 0,
          nextAction: gameEvents.none,
        });
        break;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const deleteGameRoom = async (roomId: string) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized User");
    }
    await deleteDoc(doc(db, "gamerooms", roomId));
    //TODO: Delete chat;
  } catch (error) {}
};

export const requestThrowingStar = async (roomId: string) => {
  try {
    votingProcess = true;
    if (!userId) {
      throw new Error("Unauthorized user");
    }
    const gamerooms = doc(db, "gamerooms", roomId);
    await updateDoc(gamerooms, {
      nextAction: gameEvents.throwingStarRequest,
      throwingStarRequest: [
        {
          userid: userId,
          answer: true,
        },
      ],
    });
  } catch (error) {
    return null;
  }
};

export const voteThrowingStar = async (roomId: string, answer: boolean) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized user");
    }
    const gamerooms = doc(db, "gamerooms", roomId);
    await updateDoc(gamerooms, {
      throwingStarRequest: arrayUnion({
        userid: userId,
        answer: answer,
      }),
    });
  } catch (error) {
    return null;
  }
};

export const processVotingResults = async (
  roomId: string,
  answer: boolean,
  players: PlayerProps[],
  userid: string,
  discarded: number[]
) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized user");
    }
    console.log(userid);
    if (votingProcess) {
      votingProcess = false;
      if (userid === userId) {
        const gamerooms = doc(db, "gamerooms", roomId);
        if (!answer) {
          console.log("voting failed");
          await updateDoc(gamerooms, {
            throwingStarRequest: [],
            nextAction: gameEvents.none,
          });
        } else {
          console.log("voting passed");
          const newPlayersArray = players;
          newPlayersArray.forEach((item) => {
            for (let i = 0; i < item.hand.length; i++) {
              if (!discarded.includes(item.hand[i])) {
                console.log("found the minumum");
                item.hand.splice(i, 1);
                break;
              }
            }
          });
          console.log(newPlayersArray);
          await updateDoc(gamerooms, {
            throwingStarRequest: [],
            throwingStars: increment(-1),
            nextAction: gameEvents.none,
            players: newPlayersArray,
          });
        }
      }
    }
  } catch (error) {
    return null;
  }
};
