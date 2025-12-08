// Floating hearts animation

function createHeart() {
  const heart = document.createElement("div");
  heart.className = "heart-float";
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.animationDuration = 3 + Math.random() * 5 + "s";
  heart.innerHTML = "💗";
  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 8000);
}

setInterval(createHeart, 800);
