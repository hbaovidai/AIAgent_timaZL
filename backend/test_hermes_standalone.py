import os
import sys

hermes_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vendor", "hermes-agent"))
if hermes_path not in sys.path:
    sys.path.insert(0, hermes_path)

from run_agent import AIAgent

print("Hermes Agent AIAgent imported successfully!")

# Initialize AIAgent with custom/openai endpoint or test credentials
agent = AIAgent(
    base_url="https://api.openai.com/v1",
    api_key="sk-test-key-demo",
    model="gpt-4o-mini",
    provider="custom",
    skip_memory=False,
)

print("AIAgent initialized successfully:")
print(f" - Model: {agent.model}")
print(f" - Base URL: {agent.base_url}")
print(f" - Session ID: {agent.session_id}")
