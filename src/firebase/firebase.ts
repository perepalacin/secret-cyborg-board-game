import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore";
import { browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, signInAnonymously } from 'firebase/auth';
import { GameRoomProps } from '../types';


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);

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
      console.log(userId);
    } else {
        console.log("not logged in");
    }
  });

  export const createGameRoom = async (data: GameRoomProps) => {
    try {
        if (!userId) {
            throw new Error ("Unauthorized");   
        }
        await addDoc(collection(db, "gamerooms"), {
            name: data.name,
            votingTimer: data.votingTimer,
            requiredPlayers: data.requiredPlayers,
            discussionTimer: data.discussionTimer,
            players: [userId],
            creator: userId
            });
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("Couldn't create your room, try again later");
      }
}

export const getGameRoomsData = async () => {
    const querySnapshot = await getDocs(collection(db, "gamerooms"));
    const dataArray = querySnapshot.docs.map(doc => (
        {
            id: doc.id,
            name: doc.data().name,
            votingTimer: doc.data().votingTimer,
            requiredPlayers: doc.data().requiredPlayers,
            discussionTimer: doc.data().discussionTimer,
            players: doc.data().players,
            creator: doc.data().creator
        }
    ));
    return dataArray;
}

export const joinGameRoom = async (roomId: string, players: string[]) => {
    try {
        if (!userId) {
            throw new Error("Unauthorized User");
        }
        console.log(players);
        console.log(userId);
        if (!players.includes(userId)) {
            const updatedPlayers = players;
            updatedPlayers.push(userId);
            console.log(updatedPlayers);
            const gamerooms = doc(db, "gamerooms", roomId);
            await updateDoc(gamerooms, {
                players: updatedPlayers
            });
        } else {
            throw new Error ("User already in the game");
        }
    } catch (error) {
        console.log(error);
    }
}
