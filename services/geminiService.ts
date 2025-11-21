import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a game icon or box art using Gemini Image Generation model.
 */
export const generateGameImage = async (gameName: string): Promise<string | null> => {
  try {
    // Using the flash image model as requested for efficiency and style
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a high-quality, minimalist, square game icon or poster art for the video game "${gameName}". ensure it looks like official key art or a recognizable symbol from the game. No text overlays if possible.`,
          },
        ],
      },
      config: {
        // No schema/mime needed for flash-image according to instructions
      }
    });

    // Parse response for image data
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating game image:", error);
    throw error;
  }
};
