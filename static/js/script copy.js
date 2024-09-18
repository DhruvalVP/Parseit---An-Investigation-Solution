const socket = io();

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.querySelector('.new-chat-btn');
let currentChatId = null;
let aiMessageDiv = null;  // Variable to store the AI message element for updating

// Function to add user messages to the chat window
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    
    const profilePic = document.createElement('img');
    profilePic.classList.add('profile-pic');
    profilePic.src = 'https://api.dicebear.com/6.x/initials/svg?seed=JS';  // User avatar
    profilePic.alt = 'User';
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerText = text;  // Use innerText to preserve newlines
    
    messageDiv.appendChild(profilePic);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;  // Scroll to bottom
}

// Function to format code blocks within the message
function formatCodeBlocks(text) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let formattedText = text;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        const language = match[1] || 'plaintext';
        const code = match[2].trim();
        const formattedCode = `
            <div class="code-block">
                <div class="code-header">${language}</div>
                <pre class="code-text"><code class="language-${language}">${escapeHtml(code)}</code></pre>
            </div>
        `;
        formattedText = formattedText.replace(match[0], formattedCode);
    }

    return formattedText;
}

// Helper function to escape HTML special characters
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Function to handle AI message updates
function updateAIMessage(text) {
    if (!aiMessageDiv) {
        // Create a new AI message if it doesn't exist
        aiMessageDiv = document.createElement('div');
        aiMessageDiv.classList.add('message', 'ai-message');
        
        const profilePic = document.createElement('img');
        profilePic.classList.add('profile-pic');
        profilePic.src = 'https://api.dicebear.com/6.x/bottts/svg?seed=AI';  // AI avatar
        profilePic.alt = 'AI';
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        aiMessageDiv.appendChild(profilePic);
        aiMessageDiv.appendChild(contentDiv);
        chatMessages.appendChild(aiMessageDiv);
    }
    
    // Update the AI message content
    const contentDiv = aiMessageDiv.querySelector('.message-content');
    const formattedText = formatCodeBlocks(text);
    contentDiv.innerHTML = formattedText;  // Use innerHTML to render formatted HTML
    chatMessages.scrollTop = chatMessages.scrollHeight;  // Scroll to bottom
}

// Function to handle user sending a message
function handleSend() {
    const message = userInput.value.trim();
    if (message) {
        addUserMessage(message);  // Add user message to chat window
        userInput.value = '';  // Clear input field
        aiMessageDiv = null;  // Reset AI message container for a new response
        
        // Emit the user message to the server using SocketIO
        socket.emit('user_message', { message: message });
    }
}

// Listen for incoming AI responses from the server (chunked)
socket.on('ollama_response', (data) => {
    const parsedData = JSON.parse(data);  // Parse the JSON data
    updateAIMessage(parsedData.response);  // Update the AI message content with each chunk
});

// Attach event listener for the send button
sendButton.addEventListener('click', handleSend);

// Allow sending message via pressing "Enter"
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});

// Handle starting a new chat
newChatBtn.addEventListener('click', function() {
    currentChatId = Date.now();  // New unique chat ID
    chatMessages.innerHTML = '';  // Clear chat window
    aiMessageDiv = null;  // Reset AI message container
    addUserMessage("Hello! I'm a ChatGPT clone. How can I assist you today?");  // New AI greeting
});

// Initialize first chat
newChatBtn.click();  // Start with a new chat automatically