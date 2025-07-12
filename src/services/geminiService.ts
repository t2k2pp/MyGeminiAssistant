
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Source, Artifact, ArtifactType, InputMode, Language } from '../types.ts';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface ParsedResponse {
  text: string;
  sources?: Source[];
  artifact?: Omit<Artifact, 'id'>;
}

function parseArtifact(text: string): { cleanText: string; artifactData?: Omit<Artifact, 'id'> } {
  const artifactRegex = /```(react|json-chart|html|markdown)(?:\s*\(label:\s*([^)]+)\))?\s*([\s\S]+?)```/s;
  const match = text.match(artifactRegex);

  if (match) {
    const type = match[1] as 'react' | 'json-chart' | 'html' | 'markdown';
    const label = match[2]?.trim();
    const data = match[3].trim();
    const cleanText = text.replace(artifactRegex, "").trim();
    
    let artifactType: ArtifactType;
    let parsedData: any = data;

    switch(type) {
      case 'react':
        artifactType = 'react';
        break;
      case 'json-chart':
        artifactType = 'chart';
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          return { cleanText: text, artifactData: { type: 'text', data: `Invalid JSON for chart: ${e instanceof Error ? e.message : String(e)}` } };
        }
        break;
      case 'html':
        artifactType = 'html';
        break;
      case 'markdown':
        artifactType = 'markdown';
        break;
      default:
        return { cleanText: text };
    }
    
    return { cleanText, artifactData: { type: artifactType, data: parsedData, label } };
  }
  return { cleanText: text };
}

async function generateWithSearch(prompt: string, language: Language): Promise<ParsedResponse> {
  const model = "gemini-2.5-flash";
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: `Language: ${language}. Query: ${prompt}`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const sources: Source[] = groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri) || [];

  return { text: response.text, sources };
}

async function generateDeepResearchReport(prompt: string, language: Language): Promise<ParsedResponse> {
  // FUTURE_IMPLEMENTATION_NOTE:
  // A more advanced Deep Research feature could be implemented as a multi-step agent.
  // This would involve:
  // 1. A planning stage where the model breaks the research topic into multiple, specific search queries.
  // 2. An execution stage where the model iterates through the queries, calling the search tool for each.
  // 3. A synthesis stage where the model aggregates the results from all searches into a final, coherent report.
  // This would require a more complex orchestration logic than the current single-call approach.
  const model = "gemini-2.5-flash";
  const systemInstruction = `You are a specialist research assistant. Your task is to conduct in-depth research on the given topic using Google Search.
1. Break down the main topic into key sub-questions.
2. Gather information to answer these questions.
3. Synthesize the findings into a comprehensive, well-structured report in Markdown format.
4. The report must include:
    - A title (e.g., # Research Report: [Topic]).
    - An executive summary.
    - A detailed analysis covering different facets of the topic, using headings (##).
    - Key findings presented as a bulleted list.
    - A conclusion.
5. The final output must be ONLY the Markdown report itself. Do not wrap it in a code block.
6. The report should be written in ${language === 'ja' ? 'Japanese' : 'English'}.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: systemInstruction,
    },
  });

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const sources: Source[] = groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri) || [];

  const reportText = response.text;
  const reportLabel = language === 'ja' ? `深層調査: ${prompt}` : `Deep Research: ${prompt}`;
  const responseText = language === 'ja' ? `「${prompt}」に関する深層リサーチが完了しました。詳細はアーティファクトパネルをご覧ください。` : `Deep research on "${prompt}" is complete. See the artifact panel for details.`;

  return {
    text: responseText,
    sources: sources,
    artifact: {
      type: 'markdown',
      data: reportText,
      label: reportLabel,
    }
  };
}


async function generateImage(prompt: string, language: Language): Promise<ParsedResponse> {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    const responseText = language === 'ja' ? `プロンプト「${prompt}」に基づいて画像を生成しました。` : `Generated an image based on the prompt: "${prompt}"`;

    return {
      text: responseText,
      artifact: {
        type: 'image',
        data: imageUrl,
        label: prompt.substring(0, 50)
      }
    };
  } catch(error) {
    console.error("Image generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
    return { text: `Error generating image: ${errorMessage}` };
  }
}

async function generateStandardText(prompt: string, history: {role: 'user' | 'model', parts: Part[]}[], images: string[] | undefined, language: Language): Promise<ParsedResponse> {
    const model = "gemini-2.5-flash";
    const chat = ai.chats.create({
      model: model,
      history: history,
      config: {
          systemInstruction: `You are Gemini Pro, a helpful assistant.
- To generate a React component, wrap the code in \`\`\`react (label: Component Name) block.
- To generate a chart, provide data in a \`\`\`json-chart (label: Chart Title) block. The JSON should be an array of objects.
- To generate formatted text like tables, lists, or styled text, wrap it in a \`\`\`markdown (label: Document Title) block.
- To generate raw HTML, wrap it in a \`\`\`html (label: HTML Snippet) block.
- When you create an artifact, provide a clear, concise label in the parentheses.
- When you use a tool, inform the user.
- Respond in ${language === 'ja' ? 'Japanese' : 'English'}.`,
      },
    });

    const imageParts: Part[] = (images || []).map(imgDataUrl => {
        const [_, mimeType, data] = imgDataUrl.match(/^data:(.+);base64,(.+)$/) || [];
        if (!mimeType || !data) {
            throw new Error('Invalid image data URL format');
        }
        return { inlineData: { mimeType, data } };
    });

    const messageParts = [
      { text: prompt },
      ...imageParts,
    ];

    const response = await chat.sendMessage({ message: messageParts });
    
    const { cleanText, artifactData } = parseArtifact(response.text);

    return { text: cleanText, artifact: artifactData };
}

export const geminiService = {
  async generateResponse(prompt: string, history: {role: 'user' | 'model', parts: Part[]}[], images: string[] | undefined, mode: InputMode, language: Language): Promise<ParsedResponse> {
    if ((mode === 'research' || mode === 'deep-research' || mode === 'image') && images && images.length > 0) {
      return { text: language === 'ja' ? "このモードでは画像を送信できません。" : "Images cannot be sent in this mode." };
    }

    switch (mode) {
      case 'image':
        return generateImage(prompt, language);
      case 'research':
        return generateWithSearch(prompt, language);
      case 'deep-research':
        return generateDeepResearchReport(prompt, language);
      case 'chat':
      default:
        return generateStandardText(prompt, history, images, language);
    }
  }
};
