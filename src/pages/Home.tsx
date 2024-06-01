import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getRandomInt } from "../utils/GameManager";


//Landing page
const Home = () => {

    // const [userName, setUserName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        navigate("/find-a-room");
    };

    function createRaindrops() {
        const colorList = ["C64C9F", "E34431", "FE5A35", "FC9E27"];
        const rainContainer = document.querySelector('.landing-dialog');
        const dropCount = 20;
        for (let i = 0; i < dropCount; i++) {
          const drop = document.createElement('p');
          drop.className = 'falling-number';
          drop.innerHTML = String(getRandomInt(10));
          let randomLeft = Math.random() * 100;
          let randomColor = getRandomInt(colorList.length);
          while (randomLeft > 96) {
            randomLeft = Math.random()*100;
          }
          drop.style.color = `#${colorList[randomColor]}`
          drop.style.left = `${randomLeft}%`;
          drop.style.animation = `rain-fall ${Math.random()*6+3}s linear infinite`;
          if (rainContainer) {
              rainContainer.appendChild(drop);
            }
        }
      }
      
    window.addEventListener('load', createRaindrops);

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
