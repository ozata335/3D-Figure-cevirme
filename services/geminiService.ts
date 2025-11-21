import { GoogleGenAI } from "@google/genai";

// Helper to convert file to base64 string (raw data, no prefix)
const fileToGenericPart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateFigurineImage = async (
  imageFile: File, 
  promptText: string
): Promise<{ imageUrl?: string; text?: string }> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const base64Data = await fileToGenericPart(imageFile);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: promptText,
          },
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Data,
            },
          },
        ],
      },
      config: {
        // Config for generating images
        imageConfig: {
          aspectRatio: "1:1", // Default square for product showcase
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const parts = response.candidates[0].content.parts;
    let generatedImageUrl: string | undefined;
    let generatedText: string | undefined;

    for (const part of parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        // Ensure we have the correct MIME type, defaulting to png if not provided
        const mimeType = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${mimeType};base64,${base64EncodeString}`;
      } else if (part.text) {
        generatedText = part.text;
      }
    }

    return { imageUrl: generatedImageUrl, text: generatedText };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};