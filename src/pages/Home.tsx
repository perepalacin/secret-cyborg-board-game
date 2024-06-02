import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createRaindrops, rootDiv } from "../utils/animations";


//Landing page
const Home = () => {

    // const [userName, setUserName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        navigate("/find-a-room");
    };

      
    window.addEventListener('load', createRaindrops);
    window.addEventListener('load', rootDiv);

  return (
    <section className="flex-col landing-dialog">
        <h1>Welcome to Play The Mind Game Online</h1>
        <h2>We are very excited to have you here!</h2>
        <form onSubmit={handleSubmit}>
            <button type="submit" className="accent-btn label yellow-bg">
                Find a game
            </button>
        </form>
    </section>
  )
};
export default Home;
