import { getRandomInt } from "./GameManager";

export function rootDiv() {
    const root = document.getElementById('root');
    if (root) {
      root.style.width = '100%';
      root.style.display = "flex";
      root.style.flexDirection = "row";
      root.style.justifyContent = "center";
    }
  }

export function createRaindrops() {
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

  export function coloredNumbers() {
        const colorList = ["C64C9F", "E34431", "FE5A35", "FC9E27"];
        const cards = document.querySelectorAll('.card');
        cards.forEach((card: Element) => {
          (card as HTMLElement).style.color = `#${colorList[getRandomInt(colorList.length)]}`;
        });
  }