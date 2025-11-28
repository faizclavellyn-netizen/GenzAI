import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface Attachment {
  data: string;
  mimeType: string;
}

export const sendMessageToGeminiStream = async (
  prompt: string, 
  history: { role: string; parts: { text?: string; inlineData?: Attachment }[] }[] = [], 
  modelName: string = 'gemini-3-pro-preview',
  attachment?: Attachment | null
) => {
  try {
    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: "You are GenzAI, a helpful, witty, and professional AI assistant. You can analyze images if provided. Format your responses with clear paragraphs and Markdown.",
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    // Construct the message content
    // If there is an attachment, we need to pass it as a part
    let messageContent: any = prompt;
    
    if (attachment) {
      messageContent = [
        {
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        },
        {
          text: prompt
        }
      ];
    }

    const result = await chat.sendMessageStream({
      message: messageContent
    });

    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};