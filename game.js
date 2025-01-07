const BPM = 120;  // Replace with your song's BPM if using for fallback timing
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



// Define the rhythm pattern directly in JavaScript (milliseconds)
const rhythmPattern = [2656, 4000, 5304]; 
// Jump physics variables
let isJumping = false;
let jumpVelocity = 0;
const gravity = 2.2;        // gravity (downward pull)
const jumpStrength = 25;    // initial jump force
const minJumpVelocity = 10 ;   // Minimum jump height threshold

let obstaclesCleared = 0;


// Function to start the game
function startGame() {
	document.getElementById("game-container").classList.remove("paused");
	obstaclesCleared = 0;
	console.log("obstaclesCleared reset");
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

// Event listener for jumping using spacebar and mouse click
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        jump();
    }
});

gameContainer.addEventListener("click", () => {
    jump();
});

// Stop upward momentum when releasing the jump key or mouse click, but only if the minimum height is reached
function stopJumpIfMinimumHeight() {
    if (jumpVelocity > minJumpVelocity) {
        jumpVelocity = minJumpVelocity;  // Set velocity to minimum height threshold
    }
}

bgMusic.addEventListener("ended", checkWinCondition);


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
startButton.addEventListener("click", startGame);

// Retry button to restart the game
retryButton.addEventListener("click", startGame);

// Apply physics at regular intervals for smooth motion
setInterval(applyPhysics, 20);  // Adjust for smoother physics simulation
