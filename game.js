const timeCorrect = 1460;  // Adjust this value to control the initial obstacle delay
const HitCorrect = 7;

const player = document.getElementById("player");
const groundLevel = parseFloat(getComputedStyle(player).bottom) || 64;
const gameContainer = document.getElementById("game-container");
//const bgMusic = document.getElementById("bg-music");						//selecting song
const startButton = document.getElementById("start-button");
const retryButton = document.getElementById("retry-button");
const gameOverMessage = document.getElementById("game-over-message");
const characterSelectionScreen = document.getElementById("character-selection");
const characterOptions = document.querySelectorAll(".character");

const audioFileInput = document.getElementById('audio-file');
const progressBar = document.getElementById('progress-bar');
const runtimeDisplay = document.getElementById('runtime');
		
let audioContext, audioBufferSource, audioBuffer, startTime, pauseTime = 0, isPlaying = false;

const audioFilePath = 'audio/garguthesong.mp3'; // Replace with your audio file path
function initializeAudioContext() {
	audioContext = new (window.AudioContext || window.webkitAudioContext)();
}
/*
audioFileInput.addEventListener('change', async (event) => {
	const file = event.target.files[0];
	if (file) {
		const arrayBuffer = await file.arrayBuffer();
        if (!audioContext) initializeAudioContext();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        updateRuntime(0, audioBuffer.duration);
    }
});
*/
        

        function initializeAudioContext() {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        async function loadAudio() {
            try {
                if (!audioContext) initializeAudioContext();
                const response = await fetch(audioFilePath);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                console.log("Audio loaded successfully");
                playButton.disabled = false;
                pauseButton.disabled = false;
                updateRuntime(0, audioBuffer.duration);
            } catch (error) {
                console.error("Error loading audio file:", error);
            }
        }

function playAudio() {
	if (isPlaying) return;

    audioBufferSource = audioContext.createBufferSource();
    audioBufferSource.buffer = audioBuffer;
    audioBufferSource.connect(audioContext.destination);

	const offset = pauseTime || 0;
	audioBufferSource.start(0, offset);
	startTime = audioContext.currentTime - offset;
	isPlaying = true;

	audioBufferSource.onended = () => {
		isPlaying = false;
		pauseTime = 0;
		updateRuntime(audioBuffer.duration, audioBuffer.duration);
	};
	
    requestAnimationFrame(updateProgress);
	
	scheduleObstacles(audioContext.currentTime);
}


function pauseAudio() {
	if (!isPlaying) return;
        audioBufferSource.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPlaying = false;
    }

function updateRuntime(current, total) {
    runtimeDisplay.textContent = `Current Time: ${current.toFixed(1)}s / Total Time: ${total.toFixed(1)}s`;
}

function updateProgress() {
	if (isPlaying) {
        const elapsed = audioContext.currentTime - startTime;
        const total = audioBuffer.duration;
        updateRuntime(elapsed, total);

        const progressPercent = (elapsed / total) * 100;
        progressBar.style.width = `${progressPercent}%`;

        if (elapsed < total) {
             requestAnimationFrame(updateProgress);
        }
    }
}




player.style.bottom = `${groundLevel}px`;

let obstacleTimeouts = [];  // Stores timeouts for each obstacle
let collisionInterval;
let obstaclesCleared = 0;
let selectedCharacter = null;

// array of obstacle appearances in milliseconds
const rhythmPattern = [2588, 3274, 3961, 4625, 5281]; 

// Jump physics variables
let isJumping = false;
let jumpVelocity = 0;
const gravity = 2.5;        // gravity (downward pull)
const jumpStrength = 30;    // initial jump force
const minJumpVelocity = 15 ;   // Minimum jump height threshold


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
	playAudio();
	obstaclesCleared = 0;
	console.log(obstaclesCleared);
    gameOverMessage.style.display = "none";
    startButton.style.display = "none";
    retryButton.style.display = "none";
    // Listen for the end of the song to check win condition
	
	//bgMusic.addEventListener("ended", checkWinCondition);			//monitoring song end
	
    // Start spawning obstacles based on rhythm pattern
   /* rhythmPattern.forEach((delay) => {
        const timeout = setTimeout(spawnObstacle, delay - timeOffset);
        obstacleTimeouts.push(timeout);
    });*/

    // Start collision checking at a regular interval
    collisionInterval = setInterval(checkCollision, 50);
}

// Schedule obstacles based on rhythm pattern
function scheduleObstacles(startTime) {
    rhythmPattern.forEach((timeOffset) => {
        const spawnTime = startTime + timeOffset - timeCorrect;
        const delay = (spawnTime - audioContext.currentTime); 

        if (delay > 0) {
            setTimeout(() => spawnObstacle(timeOffset), delay);
        }
    });
}



// Function to spawn a new obstacle
function spawnObstacle() {
	console.log(`Obstacle spawned at ${audioContext.currentTime}`);
    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");
	obstacle.style.animationPlayState = "running";
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

let lastTime = performance.now();

function applyPhysics() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 28; // Convert to seconds
    lastTime = currentTime;

    if (isJumping) {
        let currentBottom = parseFloat(player.style.bottom) || 0;
        player.style.bottom = `${currentBottom + jumpVelocity * deltaTime}px`;
        jumpVelocity -= gravity * deltaTime; // Gravity decreases jump velocity over time

        // Check if the player has landed
        if (parseFloat(player.style.bottom) <= groundLevel) {
            player.style.bottom = `${groundLevel}px`; // Set to ground level
            isJumping = false;

            // Trigger landing animation and switch to walking after landing
            player.classList.remove("jumping");
            player.classList.add("landing");
            setTimeout(() => {
                player.classList.remove("landing");
                player.classList.add("walking");
            }, 100); // Match with landing animation duration
        }
    }

    // Continue applying physics on the next frame
    requestAnimationFrame(applyPhysics);
}

requestAnimationFrame(applyPhysics);

/*
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
*/

// Collision Detection
function checkCollision() {
    const obstacles = document.querySelectorAll(".obstacle");
    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

		// Shrink the player's hitbox
        const playerHitbox = {
            left: playerRect.left + HitCorrect,   // Add padding to the left
            right: playerRect.right - HitCorrect, // Add padding to the right
            top: playerRect.top + HitCorrect,    // Add padding to the top
            bottom: playerRect.bottom - HitCorrect, // Add padding to the bottom
        };

        // Check for overlap between adjusted player hitbox and obstacle
        if (
            playerHitbox.left < obstacleRect.right &&
            playerHitbox.right > obstacleRect.left &&
            playerHitbox.bottom > obstacleRect.top &&
            playerHitbox.top < obstacleRect.bottom
        ) {
            gameOver();
        }
    });
}

function checkWinCondition() {
    // If the song has ended and all obstacles are cleared, redirect to win page
     console.log("checkWinConditionEntered");
	/*if (obstaclesCleared === rhythmPattern.length && bgMusic.ended) {				//check if bgMusic has ended
         console.log("WinCondition met");
		window.location.href = "win.html";
    }*/
}

// Function to handle game over
function gameOver() {
    pauseAudio();																//pause music if game over
    pauseTime = 0;  														//Reset the song for retry
    gameOverMessage.style.display = "block";
	gameContainer.style.animationPlayState = "paused";
	player.style.animationPlayState = "paused";
	player.classList.add("landing");
	
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
	obstacle.style.visibility = "visible";
}


// Stop upward momentum when releasing the jump key or mouse click, but only if the minimum height is reached
function stopJumpIfMinimumHeight() {
    if (jumpVelocity > minJumpVelocity) {
        jumpVelocity = minJumpVelocity;  // Set velocity to minimum height threshold
    }
}




// -----EVENT LISTNENERS -------------------------------------------------------------


//bgMusic.addEventListener("ended", checkWinCondition);					//listens for the end of the song to check win cond.

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


