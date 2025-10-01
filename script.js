let recognition;
let isRecognizing = false;
let transcriptElement = document.getElementById("transcript");
let rules = [];
let finalTranscript = ""; // store finalized text globally

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

// Initialize recognition
function createRecognition() {
  let recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = "en-US";

  let lastInterim = ""; // store last interim locally

  recog.onresult = (event) => {
    let interimTranscript = "";
    let localFinal = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        localFinal += result[0].transcript.trim() + " ";
      } else {
        interimTranscript = result[0].transcript;
      }
    }

    // Append new final text only once
    finalTranscript += localFinal;

    // Render final + interim (interim shown in gray)
    let checkedText = highlightMistakes(finalTranscript);
    transcriptElement.innerHTML =
      checkedText + (interimTranscript ? `<span style="color: gray">${interimTranscript}</span>` : "");

    // Update lastInterim (optional, could be used for diff logic later)
    lastInterim = interimTranscript;
  };

  recog.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (isRecognizing && event.error !== "not-allowed") {
      recog.stop();
      recognition = createRecognition();
      recognition.start();
    }
  };

  recog.onend = () => {
    if (isRecognizing) {
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
