// ... (previous code remains unchanged)

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
    // Replace newlines with <br> tags for proper HTML rendering
    const htmlText = formattedText.replace(/\n/g, '<br>');
    contentDiv.innerHTML = `<span class="message-prefix">zero:</span> ${htmlText}`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ... (rest of the code remains unchanged)

// Listen for incoming AI responses from the server
socket.on('ollama_response', (data) => {
    const parsedData = JSON.parse(data);
    updateAIMessage(parsedData.response);
});

// ... (rest of the code remains unchanged)