import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";


//Landing page
const Home = () => {

    // const [userName, setUserName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        navigate("/find-a-room");
    };



  return (
    <div>
        <h1>Welcome to Play Secret Fascist</h1>
        <h2>We are very excited to have you here!</h2>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'}}>
            <button type="submit" className="btn btn-label">
                Find a game
            </button>
        </form>
    </div>
  )
};
export default Home;
