const balloonSky = document.querySelector("#balloon-sky");
const openSurpriseButton = document.querySelector("#open-surprise");
const lightsButton = document.querySelector("#turn-on-lights");
const cake = document.querySelector("#birthday-cake");
const cutCakeButton = document.querySelector("#cut-cake");
const cakeMessage = document.querySelector("#cake-message");
const wishButton = document.querySelector("#make-wish");
const wishMessage = document.querySelector("#wish-message");
const birthdayAudio = document.querySelector("#birthday-audio");
const musicToggle = document.querySelector("#music-toggle");
const musicStatus = document.querySelector("#music-status");
const giftStatus = document.querySelector("#gift-status");
const lightbox = document.querySelector("#photo-lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxClose = document.querySelector("#lightbox-close");
const letterModal = document.querySelector("#letter-modal");
const readLetterButton = document.querySelector("#read-letter");
const letterCloseButton = document.querySelector("#letter-close");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const birthdayNotes = [
  [392, 0.9], [392, 0.45], [440, 1.3], [392, 1.3], [523.25, 1.3], [493.88, 1.8],
  [392, 0.9], [392, 0.45], [440, 1.3], [392, 1.3], [587.33, 1.3], [523.25, 1.8],
  [392, 0.9], [392, 0.45], [783.99, 1.3], [659.25, 1.3], [523.25, 1.3], [493.88, 1.3], [440, 1.8],
  [698.46, 0.9], [698.46, 0.45], [659.25, 1.3], [523.25, 1.3], [587.33, 1.3], [523.25, 2.2]
];

const balloonColors = ["#e994ac", "#f3c7b5", "#cf8fa9", "#f1d08e", "#bb88aa", "#f2a6a4"];
const confettiColors = ["#dfa2ac", "#e7b5bf", "#d7bc80", "#d8a0b8", "#f2dba1", "#f3b4be"];
let balloonsAdded = false;
let cakeCut = false;
let wishMade = false;
let lightboxTrigger = null;
let previousBodyOverflow = "";
let letterTrigger = null;

function createBirthdayTrack() {
  const sampleRate = 22050;
  const secondsPerBeat = 0.36;
  let melodyDuration = 0;
  const notes = birthdayNotes.map(([frequency, beats]) => {
    const note = { frequency, start: melodyDuration, duration: beats * secondsPerBeat };
    melodyDuration += note.duration + 0.045;
    return note;
  });
  const sampleCount = Math.ceil(sampleRate * (melodyDuration + 2.4));
  const samples = new Float32Array(sampleCount);

  notes.forEach(({ frequency, start, duration }) => {
    const firstSample = Math.floor(start * sampleRate);
    const lastSample = Math.min(sampleCount, Math.ceil((start + duration + 0.12) * sampleRate));
    for (let index = firstSample; index < lastSample; index += 1) {
      const time = index / sampleRate - start;
      const attack = Math.min(1, time * 25);
      const release = Math.min(1, Math.max(0, duration - time) * 22);
      const envelope = attack * release * Math.exp(-time * 2.6);
      const phase = 2 * Math.PI * frequency * time;
      const pluck = Math.sin(phase) + 0.28 * Math.sin(phase * 2) + 0.09 * Math.sin(phase * 3);
      samples[index] += pluck * envelope * 0.21;
    }
  });

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const gentlePad = Math.sin(2 * Math.PI * 130.81 * time) * 0.012
      + Math.sin(2 * Math.PI * 164.81 * time) * 0.009;
    const softAir = (Math.random() * 2 - 1) * 0.0015;
    samples[index] = Math.max(-1, Math.min(1, samples[index] + gentlePad + softAir));
  }

  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    view.setInt16(44 + index * 2, samples[index] * 32767, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function setMusicState(isPlaying) {
  const isAudible = isPlaying && !birthdayAudio?.muted;
  musicToggle?.setAttribute("aria-pressed", String(isAudible));
  musicToggle?.setAttribute("aria-label", isAudible ? "Mute birthday music" : "Unmute birthday music");
  const label = musicToggle?.querySelector(".music-toggle__label");
  if (label) label.textContent = isAudible ? "Music on" : "Music off";
}

async function playBirthdayMusic() {
  if (!birthdayAudio) return;
  try {
    await birthdayAudio.play();
    setMusicState(true);
    if (musicStatus) musicStatus.textContent = "The birthday instrumental is playing.";
  } catch (error) {
    setMusicState(false);
    if (musicStatus) musicStatus.textContent = "Autoplay was blocked. Tap the music button to start the birthday instrumental.";
    if (error?.name !== "NotAllowedError") {
      console.error("Birthday music could not be played:", error);
    }
  }
}

function addBalloons() {
  if (!balloonSky || balloonsAdded) return;
  balloonsAdded = true;

  for (let index = 0; index < 17; index += 1) {
    const balloon = document.createElement("span");
    const size = 38 + (index % 4) * 11;
    balloon.className = "balloon";
    balloon.style.setProperty("--left", `${(index * 37 + 8) % 100}%`);
    balloon.style.setProperty("--size", `${size}px`);
    balloon.style.setProperty("--color", balloonColors[index % balloonColors.length]);
    balloon.style.setProperty("--duration", `${16 + (index % 5) * 2}s`);
    balloon.style.setProperty("--delay", `${-((index * 3) % 19)}s`);
    balloon.style.setProperty("--drift", `${(index % 2 === 0 ? 1 : -1) * (18 + index % 4 * 8)}px`);

    const body = document.createElement("span");
    body.className = "balloon__body";
    const string = document.createElement("span");
    string.className = "balloon__string";
    body.append(string);
    balloon.append(body);
    balloonSky.append(balloon);
  }
}

function celebrateFrom(x, y, count = 48) {
  if (reducedMotion.matches) return;

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 150;
    const size = 5 + Math.random() * 7;
    piece.className = "confetti";
    piece.style.position = "fixed";
    piece.style.zIndex = "25";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.68}px`;
    piece.style.borderRadius = "2px";
    piece.style.background = confettiColors[index % confettiColors.length];
    piece.style.pointerEvents = "none";
    piece.animate([
      { opacity: 1, transform: "translate(0, 0) rotate(0)" },
      {
        opacity: 0,
        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 55}px) rotate(${Math.random() * 720 - 360}deg)`
      }
    ], { duration: 900 + Math.random() * 550, easing: "cubic-bezier(.14,.64,.38,1)", fill: "forwards" })
      .finished.then(() => piece.remove());
    document.body.append(piece);
  }
}

function cutCake() {
  if (!cake || cakeCut) return;
  if (!wishMade) {
    if (cakeMessage) cakeMessage.textContent = "Make your wish and blow out the candles first!";
    return;
  }
  cakeCut = true;
  cake.classList.add("is-cut");
  cake.setAttribute("aria-label", "The cake has been cut. Happy birthday, Purva!");
  if (cutCakeButton) {
    cutCakeButton.disabled = true;
    cutCakeButton.textContent = "First slice, coming up!";
  }
  if (cakeMessage) cakeMessage.textContent = "You did it! The first slice is always the sweetest one.";
  const bounds = cake.getBoundingClientRect();
  celebrateFrom(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 58);
}

function makeWish() {
  if (!cake || wishMade) return;
  wishMade = true;
  cake.classList.add("is-wished");
  if (wishButton) {
    wishButton.disabled = true;
    wishButton.textContent = "Wish sent ✨";
  }
  if (cutCakeButton) cutCakeButton.disabled = false;
  cake.setAttribute("aria-label", "Wish made! Tap or swipe across the cake to cut the first slice.");
  if (cakeMessage) cakeMessage.textContent = "Wish made! Now tap the cake or swipe across to cut your first slice.";
  if (wishMessage) wishMessage.textContent = "Your wish is on its way. Somewhere, a tiny star just said yes.";
  const bounds = cake.getBoundingClientRect();
  celebrateFrom(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 42);
}

addBalloons();

function openLightbox(button) {
  if (!lightbox || !lightboxImage) return;
  const image = button.querySelector("img");
  if (!image) return;

  lightboxTrigger = button;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  if (lightboxCaption) {
    lightboxCaption.textContent = button.closest(".polaroid")?.querySelector("figcaption")?.textContent?.trim() || "";
  }
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage?.removeAttribute("src");
  document.body.style.overflow = previousBodyOverflow;
  lightboxTrigger?.focus();
  lightboxTrigger = null;
}

function closeLetter() {
  if (!letterModal?.open) return;
  letterModal.close();
}

openSurpriseButton?.addEventListener("click", () => {
  playBirthdayMusic();
  document.querySelector("#lights-section")?.scrollIntoView({
    behavior: reducedMotion.matches ? "auto" : "smooth",
    block: "start"
  });
});

lightsButton?.addEventListener("click", () => {
  document.body.classList.add("is-lit");
  lightsButton.setAttribute("aria-pressed", "true");
  lightsButton.innerHTML = '<span aria-hidden="true">✦</span> The lights are on!';
  addBalloons();
  document.querySelector("#main-celebration")?.scrollIntoView({
    behavior: reducedMotion.matches ? "auto" : "smooth",
    block: "center"
  });
});

musicToggle?.addEventListener("click", () => {
  if (!birthdayAudio) return;
  if (birthdayAudio.paused) {
    birthdayAudio.muted = false;
    playBirthdayMusic();
  } else {
    birthdayAudio.muted = !birthdayAudio.muted;
    setMusicState(true);
    if (musicStatus) musicStatus.textContent = birthdayAudio.muted ? "Birthday music is muted." : "The birthday instrumental is playing.";
  }
});

birthdayAudio?.addEventListener("play", () => setMusicState(true));
birthdayAudio?.addEventListener("pause", () => setMusicState(false));
birthdayAudio?.addEventListener("error", () => {
  if (musicStatus) musicStatus.textContent = "The birthday instrumental could not be loaded.";
  console.error("The generated birthday instrumental failed to load.");
});

cutCakeButton?.addEventListener("click", cutCake);
cake?.addEventListener("click", cutCake);
cake?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    cutCake();
  }
});

let pointerStart = null;
cake?.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});
cake?.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const swipeDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (swipeDistance > 18) cutCake();
});
cake?.addEventListener("pointercancel", () => {
  pointerStart = null;
});

wishButton?.addEventListener("click", makeWish);

document.querySelectorAll(".gift").forEach((gift) => {
  gift.addEventListener("click", () => {
    const message = document.getElementById(gift.getAttribute("aria-controls"));
    if (!message) return;
    const isOpening = gift.getAttribute("aria-expanded") !== "true";
    gift.setAttribute("aria-expanded", String(isOpening));
    gift.classList.toggle("is-open", isOpening);
    message.hidden = !isOpening;
    if (giftStatus) {
      giftStatus.textContent = isOpening ? `A little surprise: ${message.textContent}` : "Gift tucked away for later.";
    }
    if (isOpening) {
      const bounds = gift.getBoundingClientRect();
      celebrateFrom(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 26);
    }
  });
});

document.querySelectorAll(".polaroid__photo").forEach((button) => {
  const image = button.querySelector("img");
  image?.addEventListener("error", () => {
    button.classList.add("image-error");
    console.error(`Gallery photo failed to load: ${image.src}`);
  }, { once: true });
  button.addEventListener("click", () => openLightbox(button));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
  if (lightbox && !lightbox.hidden && event.key === "Tab") {
    event.preventDefault();
    lightboxClose?.focus();
  }
});

readLetterButton?.addEventListener("click", () => {
  if (!letterModal?.showModal) return;
  letterTrigger = readLetterButton;
  letterModal.showModal();
  letterCloseButton?.focus();
});

letterCloseButton?.addEventListener("click", closeLetter);
letterModal?.addEventListener("click", (event) => {
  if (event.target === letterModal) closeLetter();
});
letterModal?.addEventListener("close", () => {
  letterTrigger?.focus();
  letterTrigger = null;
});

if (birthdayAudio) {
  try {
    const trackUrl = createBirthdayTrack();
    birthdayAudio.src = trackUrl;
    birthdayAudio.volume = 0.34;
    window.addEventListener("pagehide", () => URL.revokeObjectURL(trackUrl), { once: true });
    playBirthdayMusic();
  } catch (error) {
    if (musicStatus) musicStatus.textContent = "The birthday instrumental could not be prepared.";
    console.error("Birthday music could not be prepared:", error);
  }
}
