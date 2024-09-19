from flask import Flask, render_template
from flask_socketio import SocketIO
from langchain_ollama import OllamaLLM
import json
import os
import time


class ConversationHistoryManager:
    def __init__(self, conversation_file="conversation_history.json", max_history_size=5):
        self.conversation_file = conversation_file
        self.history = []
        self.max_history_size = max_history_size  # Limit the history size
        self.load_history()

    def load_history(self):
        """Loads conversation history from JSON file, if it exists and is valid."""
        if os.path.exists(self.conversation_file):
            if os.path.getsize(self.conversation_file) > 0:  # Check if the file is not empty
                with open(self.conversation_file, 'r') as f:
                    try:
                        self.history = json.load(f)
                    except json.JSONDecodeError:
                        # If the file contains invalid JSON, initialize it with an empty list
                        self.history = []
            else:
                # If the file is empty, initialize the history with an empty list
                self.history = []

    def get_formatted_history(self, user_input):
        """Returns a limited, formatted history as a single string."""
        history_str = ""
        # Only retrieve the last few history entries
        recent_history = self.history[-self.max_history_size:]
        for entry in recent_history:
            history_str += f"User: {entry['User']}\nAssistant: {entry['Assistant']}\n"
        return history_str + f"User: {user_input}\nAssistant: "

    def update_history(self, user_input, assistant_response):
        """Adds an entry to the history with the specified role and content."""
        self.history.append({"User": user_input, "Assistant": assistant_response})
        self.save_history()

    def save_history(self):
        """Saves the updated conversation history to the JSON file."""
        with open(self.conversation_file, "w") as file:
            json.dump(self.history, file)


app = Flask(__name__)
socketio = SocketIO(app)

# Initialize the model
model = OllamaLLM(model="llama3-agent", stream=True)
history_manager = ConversationHistoryManager("conversation_history.json")


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('user_message')
def handle_message(data):
    user_input = data['message']

    # Get the formatted history for the input
    context = history_manager.get_formatted_history(user_input)

    # Stream the response from Ollama
    result = model.stream(context)

    # Stream the response chunk by chunk
    response = ""
    for chunk in result:
        response += chunk
        # Use JSON to properly encode newlines
        socketio.emit('ollama_response', json.dumps({'response': response}))
        # time.sleep(0.02)  # Slight delay to simulate real-time typing

    # Update the history with the new user input and assistant response
    history_manager.update_history(user_input, response)


if __name__ == "__main__":
    socketio.run(app, debug=True)
    # Replace with your actual local IP address
    # local_ip = '192.168.1.8'
    # socketio.run(app, host=local_ip, debug=True)
