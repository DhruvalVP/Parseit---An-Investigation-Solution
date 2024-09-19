const socket = io();

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.querySelector('.new-chat-btn');
let currentChatId = null;
let aiMessageDiv = null;

// Function to add user messages to the chat window
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = `<span class="message-prefix">User:</span> ${escapeHtml(text)}`;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
        aiMessageDiv = document.createElement('div');
        aiMessageDiv.classList.add('message', 'ai-message');
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        aiMessageDiv.appendChild(contentDiv);
        chatMessages.appendChild(aiMessageDiv);
    }
    
    const contentDiv = aiMessageDiv.querySelector('.message-content');
    const formattedText = formatCodeBlocks(text);
    contentDiv.innerHTML = `<span class="message-prefix">zero:</span> ${formattedText}`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to handle user sending a message
function handleSend() {
    const message = userInput.value.trim();
    if (message) {
        addUserMessage(message);
        userInput.value = '';
        aiMessageDiv = null;
        
        socket.emit('user_message', { message: message });
    }
}

// Listen for incoming AI responses from the server
socket.on('ollama_response', (data) => {
    const parsedData = JSON.parse(data);
    updateAIMessage(parsedData.response);
});

// Attach event listener for the send button
sendButton.addEventListener('click', handleSend);

// Allow sending message via pressing "Enter"
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Handle starting a new chat
newChatBtn.addEventListener('click', function() {
    currentChatId = Date.now();
    chatMessages.innerHTML = '';
    aiMessageDiv = null;
    updateAIMessage("Initializing new operation. How may I assist you?");
});

// Add custom styles
const style = document.createElement('style');
style.textContent = `
    .message {
        margin-bottom: 10px;
        font-family: 'Courier New', monospace;
    }
    .message-content {
        padding: 8px;
        border-radius: 5px;
        background-color: #0f1e0f;
        border: 1px solid #00ff00;
    }
    .message-prefix {
        font-weight: bold;
        color: #00ff00;
    }
    .code-block {
        background-color: #1a2e1a;
        border: 1px solid #00ff00;
        border-radius: 5px;
        margin-top: 5px;
    }
    .code-header {
        background-color: #005000;
        color: #00ff00;
        padding: 2px 5px;
        border-bottom: 1px solid #00ff00;
    }
    .code-text {
        margin: 0;
        padding: 5px;
        white-space: pre-wrap;
    }
`;
document.head.appendChild(style);

// Initialize first chat
newChatBtn.click();