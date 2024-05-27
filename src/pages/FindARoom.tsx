import { useEffect, useState } from "react";
import CreateNewRoom from "../components/CreateNewRoom";
import RoomsList from "../components/RoomsList";
import { getGameRoomsData } from "../firebase/firebase";
import { GameRoomProps } from "../types";

const FindARoom = () => {

  const [rooms, setRooms] = useState<GameRoomProps[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<GameRoomProps[]>([])
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getGameRoomsData().then(
      data => {
        setRooms(data);
        setFilteredRooms(data);
      }
    ).catch(_e => {
      console.log("We couldn't find any rooms");
    });
  }, []);

  useEffect(() => {
    const filteredData = rooms.filter(item => item.name.includes(searchQuery));
    setFilteredRooms(filteredData);
  }, [searchQuery]);

  // rooms = getRooms();

  return (
    <main>
      <div className="flex-col" style={{ width: "100%" }}>
        <div className="flex-col" style={{ width: "100%" }}>
          <h1>Welcome to Play Secret Cyborg</h1>
          <h2>Please join a game room or create your own!</h2>
        </div>
        <div className="flex-row" style={{ width: "100%" }}>
          <input className="form_style" placeholder="Room name" value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value)}}/>
          <CreateNewRoom />
        </div>
        <RoomsList data={filteredRooms}/>
      </div>
    </main>
  );
};

export default FindARoom;
