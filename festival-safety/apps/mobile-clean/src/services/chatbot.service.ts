const GEMINI_API_KEY = 'AIzaSyCzZwHmCzyVwZPyjjMDzWmy_G1i-oVUbCs';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const sendMessageToGemini = async (
  messages: Message[]
): Promise<string> => {
  try {
    const response = await fetch('https://gemini.googleapis.com/v1/models/gemini-1.5-pro:generateMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gemini-1.5-pro',
        max_tokens: 1024,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        system: `You are a helpful assistant for the WiCS Crowd Safety app. 
        You help attendees with:
        - Event information (ACL Music Festival at Zilker Park) or whatever the event is
        - Safety guidelines and emergency procedures (such as nearest exits, medical tents, etc.)
        - Navigation and crowd density information
        - General event questions
        Keep responses concise and helpful.`,
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Chatbot error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
};