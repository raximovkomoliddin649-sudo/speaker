let recognition;
let isRecognizing = false;
let transcriptElement = document.getElementById("transcript");
let rules = [];
let finalTranscript = ""; // store finalized text

// Load grammar rules from rules.json
fetch("rules.json")
  .then(response => response.json())
  .then(data => {
    rules = data.rules;
  })
  .catch(error => console.error("Error loading rules:", error));

// Apply grammar rules and highlight mistakes
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

// Create a new recognition instance
function createRecognition() {
  let recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recog.continuous = true;       // keep listening
  recog.interimResults = true;   // partial results
  recog.lang = "en-US";

  recog.onresult = (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
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

    // Restart automatically if network/nomatch errors happen
    if (isRecognizing && event.error !== "not-allowed") {
      recog.stop();
      recognition = createRecognition();
      recognition.start();
    }
  };

  recog.onend = () => {
    if (isRecognizing) {
      // Sometimes it stops silently; restart if user hasn't pressed Stop
      recognition = createRecognition();
      recognition.start();
    }
  };

  return recog;
}

// Start button
document.getElementById("startBtn").addEventListener("click", () => {
  if (!isRecognizing) {
    finalTranscript = ""; // clear old text
    transcriptElement.innerHTML = "";
    recognition = createRecognition();
    recognition.start();
    isRecognizing = true;
  }
});

// Stop button
document.getElementById("stopBtn").addEventListener("click", () => {
  if (isRecognizing) {
    recognition.onend = null; // prevent auto-restart
    recognition.stop();
    isRecognizing = false;
  }
});
