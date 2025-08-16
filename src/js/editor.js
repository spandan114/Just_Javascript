//get element from dom
const consoleLogList = document.querySelector(".editor__console-logs");
const exicutebtn = document.querySelector(".run_code");
const clearbtn = document.querySelector(".clear_code");
const clearConsolebtn = document.querySelector(".clear_console");
const newSessionbtn = document.querySelector(".new_session");

let codeEditor = ace.edit("editorCode");
let defaultCode = 'console.log("Hello World!")';
let consoleMessages = [];

// LocalStorage management
const STORAGE_KEY = 'justjs_sessions';
const CURRENT_SESSION_KEY = 'justjs_current_session';
let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY) || generateSessionId();

// Helper functions
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveSession(code, title = null) {
  const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
  const sessionData = {
    id: currentSessionId,
    code: code,
    title: title || `Session ${new Date().toLocaleString()}`,
    timestamp: Date.now()
  };

  if (sessionIndex >= 0) {
    sessions[sessionIndex] = sessionData;
  } else {
    sessions.push(sessionData);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
}

function loadSession(sessionId) {
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    currentSessionId = sessionId;
    localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
    codeEditor.setValue(session.code);
    updateSessionDropdown();
  }
}

function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId);
}

function updateSessionDropdown() {
  const dropdown = document.getElementById('sessionDropdown');
  if (dropdown) {
    dropdown.innerHTML = '';
    sessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = session.title;
      option.selected = session.id === currentSessionId;
      dropdown.appendChild(option);
    });
  }
}

let editorLib = {
  clearConsoleScreen() {
    consoleMessages.length = 0;

    // Remove all elements in the log list
    while (consoleLogList.firstChild) {
      consoleLogList.removeChild(consoleLogList.firstChild);
    }
  },
  printToConsole() {
    consoleMessages.forEach((log) => {
      const newLogItem = document.createElement("li");
      const newLogText = document.createElement("pre");

      newLogText.className = log.class;
      newLogText.textContent = `> ${log.message}`;

      newLogItem.appendChild(newLogText);

      consoleLogList.appendChild(newLogItem);
    });
  },
  init() {
    // Configure Ace

    // Theme
    codeEditor.setTheme("ace/theme/dracula");

    // Set language
    codeEditor.session.setMode("ace/mode/javascript");

    // Set Options
    codeEditor.setOptions({
      fontFamily: "monospace",
      fontSize: "12pt",
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
    });

    // Load existing session or set default
    const currentSession = getCurrentSession();
    if (currentSession) {
      codeEditor.setValue(currentSession.code);
    } else {
      codeEditor.setValue(defaultCode);
      saveSession(defaultCode);
    }

    // Auto-save on code change
    codeEditor.session.on('change', () => {
      const code = codeEditor.getValue();
      saveSession(code);
    });

    // Update session dropdown
    updateSessionDropdown();
  },
};

//Events
//exicute
exicutebtn.addEventListener("click", () => {
  // Clear console messages
  editorLib.clearConsoleScreen();
  //get input from code editor
  const userCode = codeEditor.getValue();

  // Run the user code
  try {
    new Function(userCode)();
  } catch (err) {
    console.error(err);
  }

  // Print to the console
  editorLib.printToConsole();
});

//reset
clearbtn.addEventListener("click", () => {
  // Clear ace editor
  codeEditor.setValue(defaultCode);
  // Clear console messages
  editorLib.clearConsoleScreen();
  // Save the cleared state
  saveSession(defaultCode);
});

// Clear console only
clearConsolebtn.addEventListener("click", () => {
  editorLib.clearConsoleScreen();
});

// New session
newSessionbtn.addEventListener("click", () => {
  currentSessionId = generateSessionId();
  localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
  codeEditor.setValue(defaultCode);
  saveSession(defaultCode);
  updateSessionDropdown();
  editorLib.clearConsoleScreen();
});

// Session dropdown change
document.addEventListener('DOMContentLoaded', () => {
  const sessionDropdown = document.getElementById('sessionDropdown');
  if (sessionDropdown) {
    sessionDropdown.addEventListener('change', (e) => {
      if (e.target.value) {
        loadSession(e.target.value);
        editorLib.clearConsoleScreen();
      }
    });
  }
});

editorLib.init();
