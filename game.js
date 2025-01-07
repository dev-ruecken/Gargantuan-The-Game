const timingOffset = 1250;  // Adjust this value to control the initial obstacle delay

const player = document.getElementById("player");
const groundLevel = parseFloat(getComputedStyle(player).bottom) || 64;
const gameContainer = document.getElementById("game-container");
const bgMusic = document.getElementById("bg-music");
const startButton = document.getElementById("start-button");
const retryButton = document.getElementById("retry-button");
const gameOverMessage = document.getElementById("game-over-message");


player.style.bottom = `${groundLevel}px`;

let obstacleTimeouts = [];  // Stores timeouts for each obstacle
let collisionInterval;

let selectedCharacter = null;

const characterSelectionScreen = document.getElementById("character-selection");
const characterOptions = document.querySelectorAll(".character");
const startGameButton = document.getElementById("start-game-button");



// array of obstacle appearances in milliseconds
const rhythmPattern = [2656, 4000, 5304]; 

// Jump physics variables
let isJumping = false;
let jumpVelocity = 0;
const gravity = 2.2;        // gravity (downward pull)
const jumpStrength = 25;    // initial jump force
const minJumpVelocity = 10 ;   // Minimum jump height threshold

let obstaclesCleared = 0;


// Display orientation warning
function checkOrientation() {
    const warning = document.getElementById("orientation-warning");
    const gameContainer = document.getElementById("game-container");

    if (window.innerWidth < window.innerHeight) {
        // Portrait mode
        warning.style.display = "flex";
        gameContainer.style.display = "none";
    } else {
        // Landscape mode
        warning.style.display = "none";
        gameContainer.style.display = "block";
    }
}

//request Fullscreen
function requestFullscreenMode() {
    const body = document.body; // Use the body element for fullscreen mode

    if (body.requestFullscreen) {
        body.requestFullscreen(); // Standard
    } else if (body.webkitRequestFullscreen) {
        body.webkitRequestFullscreen(); // Safari/Older Chrome
    } else if (body.msRequestFullscreen) {
        body.msRequestFullscreen(); // Older Microsoft Edge
    }

    // Scroll slightly to hide the URL bar (for mobile browsers)
    setTimeout(() => window.scrollTo(0, 1), 100);
}

// Handle character selection
characterOptions.forEach(option => {
    option.addEventListener("click", () => {
        // Remove selection from all characters
        characterOptions.forEach(option => option.classList.remove("selected"));

        // Add selection to the clicked character
        option.classList.add("selected");

        // Save the selected character
        selectedCharacter = option.dataset.character;

    if (selectedCharacter) {
        console.log(`Selected Character: ${selectedCharacter}`);

        // Hide the character selection screen
        characterSelectionScreen.style.display = "none";

        // Show the game container
        gameContainer.style.display = "block";

        // Pass the selected character to the game logic
        startGameWithCharacter(selectedCharacter);
    }
	
	
    });
});


function startGameWithCharacter(character) {
    requestFullscreenMode();
	// Set the character sprite dynamically
    const player = document.getElementById("player");
    player.style.backgroundImage = `url('sprites/${character}.png')`;
	player.style.visibility = "visible";
	player.classList.add("walking");
	player.style.animationPlayState = "running";
	document.getElementById("game-container").classList.remove("paused");
	const gameContainer = document.getElementById("game-container");
    gameContainer.style.animationPlayState = "running";

    // Start the game
   // startGame();
}



// Function to start the game
function startGame() {
    // Reset game variables and start the game logic
    console.log("Game started!");
	obstaclesCleared = 0;
	console.log(obstaclesCleared);
    const bgMusic = document.getElementById("bg-music");
	bgMusic.play();
    gameOverMessage.style.display = "none";
    startButton.style.display = "none";
    retryButton.style.display = "none";
    // Listen for the end of the song to check win condition
    bgMusic.addEventListener("ended", checkWinCondition);
    // Start spawning obstacles based on rhythm pattern
    rhythmPattern.forEach((delay) => {
        const timeout = setTimeout(spawnObstacle, delay - timingOffset);
        obstacleTimeouts.push(timeout);
    });

    // Start collision checking at a regular interval
    collisionInterval = setInterval(checkCollision, 50);
}

// Function to spawn a new obstacle
function spawnObstacle() {
		console.log("spawn obstacle enterred");
		console.log(obstaclesCleared);
    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");

    // Place the obstacle at the right edge of the game container
    obstacle.style.right = "-50px";
    gameContainer.appendChild(obstacle);

    // Remove the obstacle after animation ends to avoid clutter
    setTimeout(() => {
		obstacle.remove();
		console.log("obstacle removed");
		console.log(obstaclesCleared);
		obstaclesCleared = obstaclesCleared + 1;
		console.log(obstaclesCleared);
		checkWinCondition(); // Check win condition after each obstacle is cleared
    }, 3000);  // Match this with the CSS animation duration
}

// Function to handle the jump
function jump() {
    if (!isJumping) {
        isJumping = true;
        jumpVelocity = jumpStrength;  // Set upward velocity
        player.classList.remove("walking");
        player.classList.add("jumping");  // Start jump animation
            
	}
}

// Apply physics to simulate jump and gravity
function applyPhysics() {
    if (isJumping) {
        let currentBottom = parseFloat(player.style.bottom) || 0;
        player.style.bottom = `${currentBottom + jumpVelocity}px`;
        jumpVelocity -= gravity;  // Gravity reduces the jump velocity over time

        // Check if the player has landed
        if (parseFloat(player.style.bottom) <= groundLevel) {
            player.style.bottom = `${groundLevel}px`;  // Set to ground level
            isJumping = false;

            // Trigger landing animation and switch to walking after landing
            player.classList.remove("jumping");
            player.classList.add("landing");
            setTimeout(() => {
                player.classList.remove("landing");
                player.classList.add("walking");
            }, 100);  // Match with landing animation duration
        }
    } else {
        // Apply walking animation if on the ground and not jumping
        if (!player.classList.contains("walking")) {
            player.classList.add("walking");
        }
    }
}

// Collision Detection
function checkCollision() {
    const obstacles = document.querySelectorAll(".obstacle");
    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        // Check for overlap between player and obstacle
        if (
            playerRect.left < obstacleRect.left + obstacleRect.width &&
            playerRect.left + playerRect.width > obstacleRect.left &&
            playerRect.bottom > obstacleRect.top &&
            playerRect.top < obstacleRect.bottom
        ) {
            gameOver();
        }
    });
}

function checkWinCondition() {
    // If the song has ended and all obstacles are cleared, redirect to win page
     console.log("checkWinConditionEntered");
	if (obstaclesCleared === rhythmPattern.length && bgMusic.ended) {
         console.log("WinCondition met");
		window.location.href = "win.html";
    }
}

// Function to handle game over
function gameOver() {
    bgMusic.pause();
    bgMusic.currentTime = 0;  // Reset the song
    gameOverMessage.style.display = "block";

	// Pause the background scrolling by adding the 'paused' class
    document.getElementById("game-container").classList.add("paused");
	
    // Clear all obstacle timeouts
    obstacleTimeouts.forEach(timeout => clearTimeout(timeout));
    obstacleTimeouts = [];

    // Stop collision checking
    clearInterval(collisionInterval);

    // Show the Retry button
    retryButton.style.display = "block";

    // Remove all obstacles
    document.querySelectorAll(".obstacle").forEach(obstacle => obstacle.remove());
}


// Stop upward momentum when releasing the jump key or mouse click, but only if the minimum height is reached
function stopJumpIfMinimumHeight() {
    if (jumpVelocity > minJumpVelocity) {
        jumpVelocity = minJumpVelocity;  // Set velocity to minimum height threshold
    }
}




// -----EVENT LISTNENERS -------------------------------------------------------------


bgMusic.addEventListener("ended", checkWinCondition);

document.addEventListener("DOMContentLoaded", () => {
    // Ensure animations are paused initially
    const gameContainer = document.getElementById("game-container");
    gameContainer.style.animationPlayState = "paused";

    const player = document.getElementById("player");
	player.style.visibility = "hidden";

    console.log("Game initialized in idle state.");
});


//orientation warning
window.addEventListener("resize", checkOrientation);
window.addEventListener("load", checkOrientation);

// Event listener for touch
gameContainer.addEventListener("touchstart", (event) => {
    // Prevent default behavior (like scrolling) if the touch is NOT on a button
    if (!event.target.closest("button")) {
        event.preventDefault();
        jump(); // Trigger jump on touch anywhere in the game container
    }
});

gameContainer.addEventListener("touchend", (event) => {
    //event.preventDefault(); // Prevent default scrolling
    stopJumpIfMinimumHeight(); // Stop upward momentum on touch release
});


// Event listener for spacebar
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        jump();
    }
});

document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
        stopJumpIfMinimumHeight();
    }
});

// Event listeners for mouse click
gameContainer.addEventListener("mousedown", () => {
    jump();
});

gameContainer.addEventListener("mouseup", () => {
    stopJumpIfMinimumHeight();
});

// Start button to initiate the game
startButton.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent click from triggering a jump
    startGame(); // Start the game
});

// Retry button to initiate the game
retryButton.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent click from triggering a jump
    startGame(); // Restart the game
});

// Apply physics at regular intervals for smooth motion
setInterval(applyPhysics, 20);  // Adjust for smoother physics simulation
