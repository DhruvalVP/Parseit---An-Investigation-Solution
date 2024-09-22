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
        self.max_history_size = max_history_size
        self.load_history()

    def load_history(self):
        if os.path.exists(self.conversation_file):
            if os.path.getsize(self.conversation_file) > 0:
                with open(self.conversation_file, 'r') as f:
                    try:
                        self.history = json.load(f)
                    except json.JSONDecodeError:
                        self.history = []
            else:
                self.history = []

    def get_formatted_history(self, user_input):
        history_str = ""
        recent_history = self.history[-self.max_history_size:]
        for entry in recent_history:
            history_str += f"User: {entry['User']}\nAssistant: {entry['Assistant']}\n\n"
        return history_str + f"User: {user_input}\nAssistant: "

    def update_history(self, user_input, assistant_response):
        self.history.append({"User": user_input, "Assistant": assistant_response})
        self.save_history()

    def save_history(self):
        with open(self.conversation_file, "w") as file:
            json.dump(self.history, file)

    def clear_history(self):
        self.history = []
        self.save_history()

app = Flask(__name__)
socketio = SocketIO(app)

model = OllamaLLM(model="llama3", stream=True)
history_manager = ConversationHistoryManager("conversation_history.json")

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('user_message')
def handle_message(data):
    user_input = data['message']
    context = history_manager.get_formatted_history(user_input)
    result = model.stream(context)

    response = ""
    for chunk in result:
        response += chunk
        socketio.emit('ollama_response', json.dumps({'response': response}, ensure_ascii=False))

    history_manager.update_history(user_input, response)

@socketio.on('clear_history')
def clear_history():
    history_manager.clear_history()

if __name__ == "__main__":
    socketio.run(app, debug=True)
    # Uncomment and replace with your actual local IP address if needed
    # local_ip = '192.168.1.8'
    # socketio.run(app, host=local_ip, debug=True)