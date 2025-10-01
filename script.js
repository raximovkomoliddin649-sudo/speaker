let recognition;
let isRecognizing = false;
let transcriptElement = document.getElementById("transcript");
let rules = [];
let finalTranscript = ""; 
let lastResultIndex = 0; // track last processed index

// Load grammar rules from rules.json
fetch("rules.json")
  .then(response => response.json())
  .then(data => {
    rules = data.rules;
  })
  .catch(error => console.error("Error loading rules:", error));

// Highlight grammar mistakes
function highlightMistakes(text) {
  let highlighted = text;
  rules.forEach(rule => {
    const regex = new RegExp(rule.pattern, "gi");
    highlighted = highlighted.replace(regex, match => {
      return `<span class="error" title="${rule.message}">${match}</span>`;
    });
  });
  return highlighted;
}

// Create recognition instance
function createRecognition() {
  let recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = "en-US";

  recog.onresult = (event) => {
    let interimTranscript = "";

    for (let i = lastResultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
        lastResultIndex = i + 1; // update processed index
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    let checkedText = highlightMistakes(finalTranscript);
    transcriptElement.innerHTML =
      checkedText + `<span style="color: gray">${interimTranscript}</span>`;
  };

  recog.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recog.onend = () => {
    if (isRecognizing) {
      // recognition ended unexpectedly
      console.log("Recognition ended, restart by pressing Start again.");
    }
  };

  return recog;
}

// Start button
document.getElementById("startBtn").addEventListener("click", () => {
  if (!isRecognizing) {
    finalTranscript = ""; 
    lastResultIndex = 0;
    transcriptElement.innerHTML = "";
    recognition = createRecognition();
    recognition.start();
    isRecognizing = true;
  }
});

// Stop button
document.getElementById("stopBtn").addEventListener("click", () => {
  if (isRecognizing) {
    recognition.stop();
    isRecognizing = false;
  }
});
