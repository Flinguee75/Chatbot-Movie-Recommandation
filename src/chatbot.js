const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatInputDiv = document.querySelector(".chatbot .chat-input");

//Lier les questions à un BD et les reponses avec des fichiers lié aux côtes/Restau/etc
var questions = [
  "Quels sont les matchs prévus aujourd'hui ?",
  "Donne moi le top 5 buteurs de la CAN 2024",
  "Où puis-je prendre des billets pour les prochains matchs ?",
  "Y a-t-il des endroits où je peux regarder les matchs en plein air pendant la CAN 2024 ?",
  "Autres Questions",
];

let feedback = false;
let commentaire = "";
let userMessage = null; // Variable pour stocker le message de l'utilisateur
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, className) => {
  // Créer un élément <li> de chat avec le message et le nom de classe transmis.
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent =
    className === "outgoing"
      ? `<p></p>`
      : ` <span class="icon-bot-container"
      ><img src="images/chatbox/test.png" class="icon-bot-container"
    /></span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi; // Retourner l'élément <li> chat
};

//Créer un élément <li> de la classe question afin que je puisse afficher les questions que je souhaite

const createQuestion = (question) => {
  const questionli = document.createElement("li");
  questionli.classList.add("user-response");
  let chatContent = `<p></p>`;
  questionli.innerHTML = chatContent;
  questionli.querySelector("p").textContent = question;
  return questionli;
};

function createResponseBubbles(parentElement) {
  // Créez une bulle "oui"
  const ouiBubble = document.createElement("div");
  ouiBubble.classList.add("response-bubble");
  ouiBubble.innerHTML = '<span class="response-text">Oui</span>';

  // Créez une bulle "non"
  const nonBubble = document.createElement("div");
  nonBubble.classList.add("response-bubble");
  nonBubble.innerHTML = '<span class="response-text">Non</span>';

  // Ajoutez les bulles au parent
  parentElement.appendChild(ouiBubble);
  parentElement.appendChild(nonBubble);
}

function AppendQuestion() {
  questions.forEach((question) => {
    chatbox.appendChild(createQuestion(question));
  });
}

function Append_others_questions() {
  document.querySelectorAll(".user-response").forEach((question) => {
    if (
      question.querySelector(".user-response p").textContent !== userMessage
    ) {
      question.style.display = "flex";
      chatbox.appendChild(question);
    }
  });
}

function HideQuestions() {
  document.querySelectorAll(".user-response").forEach((element) => {
    element.style.display = "none";
  });
}

// Cette fonction fais le lien entre la question de l'utilisateur et la reponse du bot

const TreatmentQuestionUser = (question) => {
  if (feedback === true) {
    userMessage = chatInput.value.trim();
    insererFeedback(userMessage, commentaire);
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    chatbox.appendChild(
      createChatLi(
        "Ok, je verrai mieux la prochaine fois. Merci pour votre retour.",
        "incoming"
      )
    );
    chatInputDiv.style.display = "none";

    chatbox.scrollTo(0, chatbox.scrollHeight);
    Append_others_questions();
    feedback = false;
    commentaire = "";
    return;
  }
  if (chatInputDiv.style.display === "none") {
    userMessage = question.querySelector("p").textContent; // Get user entered message and remove extra whitespace
  } else {
    userMessage = chatInput.value.trim();
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`; // Get user entered message and remove extra whitespace
  }

  if (!userMessage) return;
  // Clear the input textarea and set its height to default

  HideQuestions(); // Cache les questions afficher en bas du chat

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    // Afficher le message "Réfléchir..." en attendant la réponse
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    generateResponse(incomingChatLi);
  }, 600);
};

chatInput.addEventListener("input", () => {
  // Adjust the height of the input textarea based on its content
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  // If Enter key is pressed without Shift key and the window
  // width is greater than 800px, handle the chat
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    TreatmentQuestionUser();
  }
});

sendChatBtn.addEventListener("click", () => {
  TreatmentQuestionUser();
});

closeBtn.addEventListener("click", () => {
  document.body.classList.remove("show-chatbot");
});

document.addEventListener("DOMContentLoaded", () => {
  chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot");
    chatInputDiv.style.display = "none";
  });
});

function addManagersToUserResponses() {
  document.querySelectorAll(".user-response").forEach((user_response) => {
    user_response.addEventListener("click", () => {
      TreatmentQuestionUser(user_response);
    });
  });
}

const generateResponse = async (chatElement) => {
  const messageElement = chatElement.querySelector("p"); // Récuperer le message du bot pour pouvoir le modifier après
  // Si le User veut poser une autres questions, on lui donne la possibilité de taper son message
  if (userMessage === "Autres Questions") {
    chatInputDiv.style.display = "flex"; // Je fais apparaitre la zone d'input
    chatElement.querySelector("p").textContent = "Je vous écoute"; // Le bot envoie ce message
    chatbox.scrollTo(0, chatbox.scrollHeight);
    TreatmentQuestionUser();
    return;
  }

  try {
    const response = await fetch("/test", {
      method: "POST",
      body: JSON.stringify({ UserMessage: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`La requête a échoué avec le statut ${response.status}`);
    }
    const data = await response.json();
    messageElement.textContent = data.result;
  } catch (error) {
    console.error(" ", error);
    messageElement.classList.add("error");
    messageElement.textContent =
      "Oops! Something went wrong. Please try again.";
  }
  // Réaffichage des questions non sélectionnées

  Satisfaction();
  chatInputDiv.style.display = "none";
  return;
};

AppendQuestion();
addManagersToUserResponses();

async function insererFeedback(commentaire, aiJeBienRepondu) {
  const response = {
    comment: commentaire,
    aiReponduCorrectement: aiJeBienRepondu,
  };

  fetch("/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de la réponse");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Réponse ajoutée avec succès :", data);
    })
    .catch((error) => {
      console.error("Erreur :", error);
    });
}

const Satisfaction = () => {
  feedback = true;
  chatbox.appendChild(createChatLi("Ai-je bien répondu ?", "incoming"));
  chatbox.scrollTo(0, chatbox.scrollHeight);
  createResponseBubbles(chatbox);

  // Ajoutez un gestionnaire d'événements de clic à la bulle "oui"
  chatbox.querySelectorAll(".response-text").forEach((element) => {
    element.addEventListener("click", async () => {
      commentaire = element.textContent;

      document.querySelectorAll(".response-bubble").forEach((element) => {
        element.remove();
      });
      if (element.textContent === "Oui") {
        chatbox.appendChild(createChatLi(element.textContent, "outgoing"));
        insererFeedback("Pas de soucis", element.textContent);
        feedback = false;
        chatbox.scrollTo(0, chatbox.scrollHeight);
      } else {
        chatbox.appendChild(createChatLi(element.textContent, "outgoing"));
        chatbox.appendChild(
          createChatLi(
            "Dites-moi ce que j'ai mal fais s'il vous plaît.",
            "incoming"
          )
        );
        chatbox.scrollTo(0, chatbox.scrollHeight);
        chatInputDiv.style.display = "flex";
        return;
      }
      Append_others_questions();
    });
  });
};

// const generateResponse2 = (chatElement, response) => {
//   // Gestion des réponses en fonction des questions
//   if (response === questions[0]) {
//     chatElement.querySelector("p").textContent =
//       "La hausse de frais de 5% est due à une mise à jour de nos services. Elle est destinée à améliorer votre expérience utilisateur.";
//   } else if (response === questions[1]) {
//     chatElement.querySelector("p").textContent =
//       "Nous proposons différentes options de carte bancaire, y compris Visa, MasterCard et American Express. Vous pouvez choisir celle qui vous convient le mieux.";
//   } else if (response === questions[2]) {
//     chatElement.querySelector("p").textContent =
//       "Les délais de retrait d'argent varient en fonction de votre méthode de retrait. Les retraits peuvent prendre de 1 à 5 jours ouvrables.";
//   } else if (response === questions[3]) {
//     chatElement.querySelector("p").textContent =
//       "Les dépôts d'argent sont généralement traités instantanément, mais cela peut varier en fonction de votre banque.";
//   } else {
//     chatElement.querySelector("p").textContent = "Je vous écoute";
//     chatInputDiv.style.display = "flex";
//     chatbox.scrollTo(0, chatbox.scrollHeight);
//     handleChat();
//     return;
//   }

//   // Réaffichage des questions non sélectionnées
//   document.querySelectorAll(".user-response").forEach((user_response) => {
//     if (
//       user_response.querySelector(".user-response p").textContent !== response
//     ) {
//       user_response.style.display = "flex";
//       chatbox.appendChild(user_response);
//       chatbox.scrollTo(0, chatbox.scrollHeight);
//     }
//   });
// };
