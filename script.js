let recognition;
let isRecognizing = false;
let transcriptElement = document.getElementById("transcript");
let rules = [];
let finalTranscript = ""; // store finalized text
let lastInterim = "";     // track last interim text

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

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript.trim() + " ";
        lastInterim = ""; // reset last interim after final
      } else {
        interimTranscript = result[0].transcript;

        // ✅ Only keep new text for interim to avoid duplication
        if (interimTranscript.startsWith(lastInterim)) {
          interimTranscript = interimTranscript.slice(lastInterim.length);
        }
        lastInterim = result[0].transcript; // update last interim
      }
    }

    let checkedText = highlightMistakes(finalTranscript);
    transcriptElement.innerHTML =
      checkedText + (interimTranscript ? `<span style="color: gray">${interimTranscript}</span>` : "");
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
    finalTranscript = ""; 
    lastInterim = "";
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
