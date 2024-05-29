import { initializeApp } from 'firebase/app';
import { addDoc, arrayUnion, collection, doc, getFirestore, updateDoc } from "firebase/firestore";
import { browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, signInAnonymously } from 'firebase/auth';
import { GameRoomProps, PlayerProps } from '../types';
import { getRandomInt } from '../utils/randomness';


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
    signInAnonymously(auth)
}

var userId = "";

onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
    } else {
        console.log("not logged in");
    }
  });

  export const createGameRoom = async (data: GameRoomProps, userName: string) => {
    try {
        if (!userId) {
            throw new Error ("Unauthorized");   
        }
        const faction = ""
        const docRef = await addDoc(collection(db, "gamerooms"), {
            name: data.name,
            votingTimer: data.votingTimer,
            requiredPlayers: data.requiredPlayers,
            discussionTimer: data.discussionTimer,
            players: [{
                userid: userId,
                username: userName,
                action: "none",
                faction: faction,
            }],
            creator: userId,
            started: false,
        })
        return docRef.id;
      } catch (e) {
          alert("Couldn't create your room, try again later");
          return "none";
      }
}

export const joinGameRoom = async (roomId: string, players: PlayerProps[], userName: string, requiredPlayers: number) => {
    try {
        if (!userId) {
            throw new Error("Unauthorized User");
        }
        players.forEach((item: PlayerProps) => {
            if (item.userid === userId) {
                throw new Error("User already in the game");
            }
        });
        const newPlayer = {
                userid: userId,
                username: userName,
                action: "none",
                faction: "none", 
            }
            const gamerooms = doc(db, "gamerooms", roomId);
            if (players.length + 1 > requiredPlayers) {
                throw new Error("Room capacity already exceeded");
            } else if (players.length + 1 === requiredPlayers) {
                console.log("here");
                await updateDoc(gamerooms, {
                    started: true,
                });
            }
            await updateDoc(gamerooms, {
                players: arrayUnion(newPlayer)
            });
        return true;
    } catch (error) {
        return false;
    }
}
