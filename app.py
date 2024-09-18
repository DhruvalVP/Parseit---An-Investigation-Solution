from flask import Flask, render_template
from flask_socketio import SocketIO
from langchain_ollama import OllamaLLM
import json
import os
import time

app = Flask(__name__)
socketio = SocketIO(app)

# Initialize the model
model = OllamaLLM(model="llama3", stream=True)

# Create a JSON file for conversation history if it doesn't exist or is empty
if not os.path.exists("conversation_history.json") or os.stat("conversation_history.json").st_size == 0:
    with open("conversation_history.json", "w") as file:
        json.dump([], file)  # Initialize with an empty list


@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('user_message')
def handle_message(data):
    user_input = data['message']

    # Load the conversation history from the JSON file
    try:
        with open("conversation_history.json", "r") as file:
            conversation_history = json.load(file)
    except (json.JSONDecodeError, FileNotFoundError):
        # If file is empty or contains invalid JSON, reinitialize it
        conversation_history = []

    # Add the new turn to the conversation history
    conversation_history.append({"user": user_input, "assistant": ""})

    # Stream the response from Ollama
    context = "\n".join([f"user: {turn['user']}" if 'user' in turn else f"assistant: {turn['assistant']}" for turn in conversation_history])
    result = model.stream(context)

    # Stream the response chunk by chunk
    response = ""
    for chunk in result:
        response += chunk
        # Use JSON to properly encode newlines
        socketio.emit('ollama_response', json.dumps({'response': response}))
        time.sleep(0.02)  # Slight delay to simulate real-time typing

    # Update the conversation history with the assistant's response
    conversation_history[-1]["assistant"] = response

    # Save the updated conversation history to the JSON file
    with open("conversation_history.json", "w") as file:
        json.dump(conversation_history, file)


if __name__ == "__main__":
    socketio.run(app, debug=True)
    # Replace with your actual local IP address
    # local_ip = '192.168.1.8'
    # socketio.run(app, host=local_ip, debug=True)
