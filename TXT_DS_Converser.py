import os
import threading

class ConversationHistoryManager:
    def __init__(self, conversation_file="ASSETS/conversation_history.txt", max_lines=50):
        self.conversation_file = conversation_file
        self.max_lines = max_lines
        self.history = []
        self.load_history()
        self.lock = threading.Lock()  # Initialize a thread lock for file operations

    def load_history(self):
        """Loads conversation history from file, if it exists."""
        if os.path.exists(self.conversation_file):
            with open(self.conversation_file, 'r') as f:
                self.history = f.readlines()

    def save_history(self):
        """Saves conversation history to file, truncating if necessary."""
        with self.lock:  # Ensure only one thread can write to the file at a time
            with open(self.conversation_file, 'w') as f:
                f.writelines(self.history[-self.max_lines:])

    def update_history(self, user_input, assistant_response):
        """Adds an entry to the history with the specified role and content."""
        self.history.append(f"User: {user_input}\n")
        self.history.append(f"Assistant: {assistant_response}\n")
        self.save_history()

    def get_formatted_history(self, user_input):
        """Returns the history formatted as a single string."""
        return "".join(self.history) + f"User: {user_input}\nAssistant: "
