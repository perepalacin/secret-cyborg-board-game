import { useEffect, useState } from "react";
import CreateNewRoom from "../components/CreateNewRoom";
import RoomsList from "../components/RoomsList";
import { auth, db } from "../firebase/firebase";
import { GameRoomProps, PlayerProps } from "../types";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getRandomInt } from "../utils/GameManager";

const FindARoom = () => {
  function createRaindrops() {
    const colorList = ["C64C9F", "E34431", "FE5A35", "FC9E27"];
    const rainContainer = document.querySelector(".landing-dialog");
    const dropCount = 10;
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement("p");
      drop.className = "falling-number";
      drop.innerHTML = String(getRandomInt(10));
      let randomLeft = Math.random() * 100;
      let randomColor = getRandomInt(colorList.length);
      while (randomLeft > 96) {
        randomLeft = Math.random() * 100;
      }
      drop.style.color = `#${colorList[randomColor]}`;
      drop.style.left = `${randomLeft}%`;
      drop.style.animation = `rain-fall ${
        Math.random() * 6 + 3
      }s linear infinite`;
      if (rainContainer) {
        rainContainer.appendChild(drop);
      }
    }
  }

  window.addEventListener("load", createRaindrops);

  const navigate = useNavigate();

  const [rooms, setRooms] = useState<GameRoomProps[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<GameRoomProps[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  var userId = "";

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
    }
  });

  useEffect(() => {
    const q = query(
      collection(db, "gamerooms"),
      orderBy("__name__", "asc"),
      where("started", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms: GameRoomProps[] = [];
      snapshot.forEach((doc) => {
        doc.data().players.forEach((item: PlayerProps) => {
          if (item.userid === userId) {
            navigate(`/room/${doc.id}`);
          }
        });
        fetchedRooms.push({
          id: doc.id,
          name: doc.data().name,
          requiredPlayers: doc.data().requiredPlayers,
          players: doc.data().players,
          creator: doc.data().creator,
          started: doc.data().started,
          discarded: doc.data().discarded,
          level: doc.data().level,
          joinedPlayers: doc.data().joinedPlayers,
        });
      });
      setRooms(fetchedRooms);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const filteredData = rooms.filter((item) =>
      item.name.includes(searchQuery.toLowerCase() || searchQuery.toUpperCase())
    );
    setFilteredRooms(filteredData);
  }, [searchQuery, rooms]);

  // rooms = getRooms();

  return (
    <main className="landing-dialog" style={{ padding: "1rem 2rem" }}>
      <div className="flex-col" style={{ width: "100%" }}>
          <h1>Welcome to Play The Mind Game Online</h1>
          <h2>Please join a game room or create your own!</h2>
        <div className="flex-row" style={{ width: "100%", gap: "0.5rem" }}>
          <input
            autoFocus={true}
            placeholder="Room name"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
          <CreateNewRoom />
        </div>
        <RoomsList data={filteredRooms} />
      </div>
    </main>
  );
};

export default FindARoom;
