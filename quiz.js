const quizData = [
  {
    question: "Ce activitate te atrage cel mai mult?",
    options: [
      { text: "Să creez conținut vizual sau artistic", type: "creative", icon: "palette" },
      { text: "Să repar sau să construiesc obiecte", type: "technical", icon: "handyman" },
      { text: "Să ajut prietenii cu sfaturi", type: "social", icon: "diversity_3" }
    ]
  },
  {
    question: "În timpul liber, preferi să...",
    options: [
      { text: "Organizezi evenimente sau planuri", type: "organizational", icon: "calendar_month" },
      { text: "Rezolvi puzzle-uri sau probleme logice", type: "technical", icon: "extension" },
      { text: "Scrii povești sau să desenezi", type: "creative", icon: "edit" }
    ]
  },
  {
    question: "Ce materie ți-a plăcut cel mai mult la școală?",
    options: [
      { text: "Matematica sau Informatica", type: "technical", icon: "terminal" },
      { text: "Psihologia sau Științele Sociale", type: "social", icon: "psychology" },
      { text: "Artele sau Literatura", type: "creative", icon: "brush" }
    ]
  },
  {
    question: "Cum te descriu prietenii tăi?",
    options: [
      { text: "O persoană organizată și lider", type: "organizational", icon: "groups" },
      { text: "O persoană empatică și săritooare", type: "social", icon: "volunteer_activism" },
      { text: "O persoană originală și creativă", type: "creative", icon: "lightbulb" }
    ]
  },
  {
    question: "Ce fel de probleme îți place să rezolvi?",
    options: [
      { text: "Probleme tehnice sau de funcționare", type: "technical", icon: "settings" },
      { text: "Conflicte între oameni", type: "social", icon: "handshake" },
      { text: "Probleme de eficiență și organizare", type: "organizational", icon: "trending_up" }
    ]
  },
  {
    question: "Dacă ai lansa o afacere, ce rol ți-ar plăcea?",
    options: [
      { text: "Să creezi brandul și designul", type: "creative", icon: "design_services" },
      { text: "Să gestionezi echipa și bugetul", type: "organizational", icon: "attach_money" },
      { text: "Să dezvolți produsul tehnic", type: "technical", icon: "code" }
    ]
  },
  {
    question: "Ce te motivează cel mai mult?",
    options: [
      { text: "Să înțelegi cum funcționează lucrurile", type: "technical", icon: "search" },
      { text: "Să ai un impact pozitiv în viața altora", type: "social", icon: "favorite" },
      { text: "Să îți exprimi ideile liber", type: "creative", icon: "campaign" }
    ]
  },
  {
    question: "Ce mediu de lucru preferi?",
    options: [
      { text: "Un mediu structurat și clar", type: "organizational", icon: "apartment" },
      { text: "Un mediu flexibil și artistic", type: "creative", icon: "draw" },
      { text: "Un mediu unde lucrezi direct cu oamenii", type: "social", icon: "people" }
    ]
  },
  {
    question: "Când ai o sarcină nouă, cum o abordezi?",
    options: [
      { text: "Fac un plan detaliat înainte", type: "organizational", icon: "list_alt" },
      { text: "Mă apuc direct și experimentez", type: "creative", icon: "science" },
      { text: "Cer sfatul celorlalți", type: "social", icon: "forum" }
    ]
  },
  {
    question: "Ce gadget sau unealtă preferi?",
    options: [
      { text: "Un laptop performant", type: "technical", icon: "laptop_mac" },
      { text: "O agendă sau planner", type: "organizational", icon: "event_note" },
      { text: "O cameră foto sau tabletă grafică", type: "creative", icon: "camera_alt" }
    ]
  }
];

let currentQuestion = 0;
let scores = {
  creative: 0,
  technical: 0,
  social: 0,
  organizational: 0
};

const questionEl = document.getElementById("question-text");
const optionsEl = document.getElementById("options-container");
const progressText = document.getElementById("progress-text");
const progressPercentage = document.getElementById("progress-percentage");
const progressBar = document.getElementById("progress-bar-inner");
const nextBtn = document.getElementById("next-btn");
const quizContainer = document.getElementById("quiz-container");
const resultsContainer = document.getElementById("results-container");

// Initial state
nextBtn.disabled = true;

function loadQuestion() {
  const data = quizData[currentQuestion];
  questionEl.textContent = data.question;
  
  // Update progress
  const progress = ((currentQuestion + 1) / quizData.length) * 100;
  progressText.textContent = `Întrebarea ${currentQuestion + 1} din ${quizData.length}`;
  progressPercentage.textContent = `${Math.round(progress)}%`;
  progressBar.style.width = `${progress}%`;

  // Clear previous options
  optionsEl.innerHTML = "";
  nextBtn.disabled = true;
  nextBtn.classList.remove('bg-primary', 'hover:bg-[#20e06e]', 'text-background-dark');
  nextBtn.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');

  data.options.forEach((opt, index) => {
    const label = document.createElement("label");
    label.className = "group relative cursor-pointer w-full";
    label.innerHTML = `
      <input class="peer sr-only" name="answer" type="radio" value="${opt.type}"/>
      <div class="h-full min-h-[240px] p-6 rounded-2xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-[#234833] hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/5 peer-checked:shadow-glow transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 peer-checked:scale-110 peer-checked:bg-primary peer-checked:text-background-dark shadow-sm">
          <span class="material-symbols-outlined text-4xl">${opt.icon}</span>
        </div>
        <h3 class="text-lg font-bold text-slate-800 dark:text-white relative z-10 group-hover:text-primary transition-colors">${opt.text}</h3>
        <div class="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all">
          <span class="material-symbols-outlined text-sm text-background-dark opacity-0 peer-checked:opacity-100 font-bold">check</span>
        </div>
      </div>
    `;
    
    label.querySelector('input').addEventListener('change', () => {
      nextBtn.disabled = false;
        nextBtn.classList.add('bg-primary', 'hover:bg-[#20e06e]', 'text-background-dark');
        nextBtn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
    });
    
    optionsEl.appendChild(label);
  });
}

function handleNext() {
  const selectedOption = document.querySelector('input[name="answer"]:checked');
  if (!selectedOption) return;

  const answerType = selectedOption.value;
  scores[answerType]++;

  currentQuestion++;

  if (currentQuestion < quizData.length) {
    // Basic transition effect
    optionsEl.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => {
        loadQuestion();
        optionsEl.classList.remove('opacity-0', 'translate-y-4');
        optionsEl.classList.add('animate-[fadeIn_0.5s_ease-out]');
    }, 300);
  } else {
    showResults();
  }
}

function showResults() {
  quizContainer.classList.add('hidden');
  resultsContainer.classList.remove('hidden');

  // Calculate top result
  const maxScore = Math.max(...Object.values(scores));
  const resultType = Object.keys(scores).find(key => scores[key] === maxScore);

  const resultContents = {
    creative: {
      title: "Ești un Creator!",
      desc: "Ai o imaginație bogată și îți place să te exprimi prin artă, design sau idei inovatoare.",
      careers: "Designer Grafic, Arhitect, Director de Creație, UX/UI Designer, Content Creator",
      icon: "palette",
      color: "text-purple-500"
    },
    technical: {
      title: "Ești un Tehnician!",
      desc: "Îți place să înțelegi cum funcționează lucrurile și să rezolvi probleme complexe prin logică.",
      careers: "Programator, Inginer, Analist de Date, Specialist Cyber Security, Mecanic",
      icon: "terminal",
      color: "text-blue-500"
    },
    social: {
      title: "Ești un Helper!",
      desc: "Empatia este superputerea ta. Îți place să lucrezi cu oamenii și să îi ajuți să se dezvolte.",
      careers: "Psiholog, Profesor, Medic, Specialist HR, Asistent Social",
      icon: "volunteer_activism",
      color: "text-pink-500"
    },
    organizational: {
      title: "Ești un Lider!",
      desc: "Ești organizat, eficient și îți place să pui lucrurile în mișcare. Ai stofă de antreprenor.",
      careers: "Manager de Proiect, Antreprenor, Contabil, Consultant Business, Event Planner",
      icon: "trending_up",
      color: "text-green-500"
    }
  };

  const result = resultContents[resultType] || resultContents.creative; // Fallback

  document.getElementById('result-title').textContent = result.title;
  document.getElementById('result-desc').textContent = result.desc;
  document.getElementById('result-careers').textContent = result.careers;
  document.getElementById('result-icon').textContent = result.icon;
  document.getElementById('result-icon-container').className = `w-24 h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6 animate-[fadeIn_0.5s_ease-out] mx-auto ${result.color}`;
}

// Initial load
loadQuestion();

nextBtn.addEventListener("click", handleNext);
