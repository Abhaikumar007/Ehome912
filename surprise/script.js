
let timeLeft = document.querySelector(".time-left");
let quizContainer = document.getElementById("container");
let nextBtn = document.getElementById("next-button");
let countOfQuestion = document.querySelector(".number-of-question");
let displayContainer = document.getElementById("display-container");
let scoreContainer = document.querySelector(".score-container");
let restart = document.getElementById("restart");
let userScore = document.getElementById("user-score");
let startScreen = document.querySelector(".start-screen");
let startButton = document.getElementById("start-button");
let questionCount;
let scoreCount = 0;
let count = 31;
let clickCount = 0;
let progressBar = document.querySelector(".progress-bar");
let countdown;
let complete = false;
let boxy= document.querySelector(".box");
let userSolutions = [];


//Questions and Options array




//LISTEN YOU CAN ADD We promise not to spam or pass your details on to anyone else.

const quizArray = [
    {
        id: "0",
        question: "What is your Age group?",
        options: ["12-15", "16-20", "21-30", "above 30"],
    },
    {
        id: "1",
        question: "What are the major reason for seeking tuition centers?",
        options: ["Preparations for Entrance Exam", "Difficulty in understanding concept from schools", "Improvement in grades", "Friends are studyng in same tuition center"],
    },
	 {
        id: "2",
        question: "What factors do you consider when choosing tuiton center?",
        options: ["Reputation and track record", "Quality of teachers & teaching method", "Cost & affordability", "Recommendation from others"],

    },
      {
        id: "3",
        question: "Are you aware of Eduhome?",
        options: ["Yes I am familiar", "No i have not heard of it", "I Heard about it but not used their service", "I am currently using its service"],

    },
];



//Next Button
nextBtn.addEventListener(
    "click",
    (displayNext = () => {
    const selectedOption = document.querySelector(".option-div.correct");
    if (!selectedOption) {
        alert("Please Answer the Questions");
        return;
    }
	 nextBtn.disabled = true;
        //increment questionCount
        questionCount += 1;
        //if last question
        const progressPercentage = (questionCount/quizArray.length) * 100;  
        progressBar.style.width = progressPercentage + "%";
        if (questionCount == quizArray.length) {
			complete =true
            //hide question container and display score
            displayContainer.classList.add("hide");
            scoreContainer.classList.remove("hide");
            nextBtn.classList.add("hide");
			boxy.classList.remove("hide")
            //showing the share button			
            document.querySelector(".share-container").classList.remove("hide");
// Add event listener to share button
const shareButton = document.getElementById("share-button");
shareButton.addEventListener("click", () => {

    // Redirect to WhatsApp with a pre-filled message
    const text = "*🎉Edu Home Mega Gift Surprise* 😱🎊;                                                      Take Our Survey and claim your 100% guaranteed gift💯 worth ₹1000 and more.  {url} \n```                                  Exciting News!💎 Eduhome is now at Muslim Street,Kottarakkara``` \nAdmission Open";
    const phoneNumber = ""; // Replace with your phone number
    const whatsappLink = `https://api.whatsapp.com/send?text=${text}`;
   //const whatsappLink = `#`;
    window.location.href = whatsappLink;
});

   



        
        } else {
            //display questionCount
            countOfQuestion.innerHTML =
                questionCount + 1 + " of " + quizArray.length + " Question";
            //display quiz
            quizDisplay(questionCount);
            count = 31;
            clearInterval(countdown);
            timerDisplay();
        }
    })
);


//   HERE    IS THE BUG 
// Add event listener to share button
const shareButton = document.getElementById("share-button");
shareButton.addEventListener("click", () => {
  // Check if the questions are completed
if (complete) {
    // Increase the progress bar width by a specific amount
    const shareProgressBar = document.querySelector('.share-progress-bar');
    const currentWidth = shareProgressBar.style.width;
    const newWidth = currentWidth ? parseInt(currentWidth) + 50 : 50;
    shareProgressBar.style.width = `${newWidth}%`;

    // Check if the progress has reached the desired value (e.g., 100)
if (newWidth >= 100) {
  // Show the claim button
  const claimButton = document.getElementById("claim-button");
  claimButton.classList.remove("hide");
  

  
  claimButton.addEventListener("click", () => {
	  event.preventDefault();
    // Check if the credentials are filled
    const nameInput = document.getElementById("name");
    
    if (nameInput.value) {
      // Generate a random token
	  alert("Please wait for a few seconds for the token to register");
      const token = generateRandomToken();

      // Send POST request with the token
      sendToken(token,userSolutions);
    } else {
      // Notify the user to fill in the credentials
      alert("Please fill in the credentials before claiming!");
    }
  });

// Function to generate a random token
function generateRandomToken() {
  // Generate a random string of characters
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

// Function to send POST request with token
function sendToken(token,userSolutions) {
  const nameInput = document.getElementById("name");
  const name = nameInput.value;
  // Specify the endpoint URL for the POST request
  const endpointUrl = "https://eduhome.pythonanywhere.com/claim";
  //const endpointUrl = "http://localhost:5000/claim";
  console.log(userSolutions)
  const usersol=userSolutions

  // Create a new XMLHttpRequest object
  const xhr = new XMLHttpRequest();
  xhr.open("POST", endpointUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // Define the request payload
  const payload = JSON.stringify({ token,name,usersol});

  // Handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        console.log("Token sent successfully");
        // Display a success message to the user
        alert("Token sent successfully");
		const response = JSON.parse(xhr.responseText);
        const imageLink = response.image_link;

      // Access the imageLink variable and use it as needed
        console.log("Image link:", imageLink);
		const form = document.querySelector("form");
		form.remove();
		
		const processingMessage = document.createElement("p");
        processingMessage.innerText = "Processing...";
		 
	
          // Get the score container element
        const scoreContainer = document.querySelector(".score-container");
        // Add the processing message to the score container
        scoreContainer.appendChild(processingMessage);
		 setTimeout(() => {
          const imageUrl = imageLink; // Replace with your actual image URL
          window.location.href = `your-new-page.html?image=${encodeURIComponent(imageUrl)}`;
        }, 4000);
      } else {
        console.log("Failed to send token");
        // Display an error message to the user
        alert("Failed to send token");
      }
    }
  };

  // Send the POST request
  xhr.send(payload);
}
    }
  } else {
    // Notify the user to complete the questions first
    alert("Please complete the questions first!");
  }
});



//Timer
const timerDisplay = () => {
    countdown = setInterval(() => {
        count--;
        timeLeft.innerHTML = `${count}s`;
        if (count == 1) {
            clearInterval(countdown);
            displayNext();
        }
    }, 1000);
};

//Display quiz
const quizDisplay = (questionCount) => {
    let quizCards = document.querySelectorAll(".container-mid");
    //Hide other cards
    quizCards.forEach((card) => {
        card.classList.add("hide");
    });
    //display current question card
    quizCards[questionCount].classList.remove("hide");
};

//Quiz Creation
function quizCreator() {
    //randomly sort questions
    quizArray.sort(() => Math.random() - 0.5);
    //generate quiz
    const progressPercentage = (questionCount / quizArray.length) * 100;
    progressBar.style.width = progressPercentage + "%";
    for (let i of quizArray) {
        //randomly sort options
        i.options.sort(() => Math.random() - 0.5);
        //quiz card creation
        let div = document.createElement("div");
        div.classList.add("container-mid", "hide");
        //question number
        countOfQuestion.innerHTML = 1 + " of " + quizArray.length + " Question";
        //question
        let question_DIV = document.createElement("p");
        question_DIV.classList.add("question");
        question_DIV.innerHTML = i.question;
        div.appendChild(question_DIV);
        //options
        div.innerHTML += `
    <button class="option-div" onclick="checker(this)">${i.options[0]}</button>
     <button class="option-div" onclick="checker(this)">${i.options[1]}</button>
      <button class="option-div" onclick="checker(this)">${i.options[2]}</button>
       <button class="option-div" onclick="checker(this)">${i.options[3]}</button>
    `;
        quizContainer.appendChild(div);
    }

}

//Checker Function to check if option is correct or not
// Checker Function to check if option is correct or not
function checker(userOption) {
  let userSolution = userOption.innerText;
  let question = document.getElementsByClassName("container-mid")[questionCount];
  let options = question.querySelectorAll(".option-div");

  // If user clicked answer == correct option stored in object
  if (1==1) {
	  
	  //xhr send answers
    userOption.classList.add("correct");
	console.log(userSolution)
	userSolutions.push(userSolution);
	console.log(userSolutions)
    // Add celebration effect with confetti
    const celebrationMessage = document.createElement("p");
    celebrationMessage.classList.add("celebration");
    question.appendChild(celebrationMessage);
    
    // Create confetti effect
   const jsConfetti =new JSConfetti()
   jsConfetti.addConfetti()
    // Remove celebration message and confetti after 2 seconds
    setTimeout(() => {
      celebrationMessage.remove();
	    displayNext();
      
    }, 1000);
  } else {
    userOption.classList.add("incorrect");
    // For marking the correct option
    options.forEach((element) => {
      if (element.innerText == quizArray[questionCount].correct) {
		  console.log("correct")
      }
    });
  }

  // Clear interval (stop timer)
  clearInterval(countdown);
  // Disable all options
  options.forEach((element) => {
    element.disabled = true;
  });
}




//initial setup
function initial() {
    quizContainer.innerHTML = "";
    questionCount = 0;
    scoreCount = 0;
    count = 31;
    clearInterval(countdown);
    timerDisplay();
    quizCreator();
    quizDisplay(questionCount);
    progressBar.style.width = "0";
}

//when user click on start button
startButton.addEventListener("click", () => {
    startScreen.classList.add("hide");
    displayContainer.classList.remove("hide");
    initial();
});

//hide quiz and display start screen
window.onload = () => {
    startScreen.classList.remove("hide");
    displayContainer.classList.add("hide");
	console.log("it infact calls the onload()")
};




