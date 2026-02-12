
import { GoogleGenAI } from "@google/genai";

// Fix: Use the standard initialization pattern for GoogleGenAI as per strict guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWorkerData = async (workerData: any) => {
  const prompt = `
    Act as a Senior Legal Counsel in the construction industry in Venezuela. 
    Analyze the following worker profile for legal compliance and consistency.
    Look for missing critical data, potential legal risks in contract type, 
    and provide a summary of legal fitness for hiring.
    
    Data: ${JSON.stringify(workerData)}
    
    Response should be in a professional, structured legal report format.
  `;

  try {
    // Fix: Use ai.models.generateContent with the appropriate model for basic text analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access .text property directly (not as a method)
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "No se pudo realizar el análisis legal en este momento.";
  }
};

export const legalAssistantChat = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  // Fix: Create a chat instance using the properly initialized ai client
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'Eres un Consultor Jurídico Senior especializado en leyes laborales y de construcción en Venezuela. Ayudas a los gestores de KORE ERP a tomar decisiones legales correctas.',
    },
  });

  try {
    // Fix: sendMessage returns a response where text is accessed via a property
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Error en el asistente legal.";
  }
};
