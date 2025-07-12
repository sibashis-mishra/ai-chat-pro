import { config } from '../config/environment.js';
import { MockChatModel } from '../models/MockChatModel.js';
import { AIModel } from '../models/types.js';

// Try to import OpenAI (will fail gracefully if not available)
let ChatOpenAI: any = null;
let HumanMessage: any = null;
let SystemMessage: any = null;

try {
  const openaiModule = await import('@langchain/openai');
  const coreModule = await import('@langchain/core/messages');
  ChatOpenAI = openaiModule.ChatOpenAI;
  HumanMessage = coreModule.HumanMessage;
  SystemMessage = coreModule.SystemMessage;
} catch (error) {
  console.log('OpenAI module not available, using mock model only');
}

export class AIService {
  private model: AIModel;

  constructor() {
    this.model = this.getModel();
  }

  private getModel(): AIModel {
    const hasOpenAIKey = config.OPENAI_API_KEY && 
                        config.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                        ChatOpenAI;
    
    if (hasOpenAIKey) {
      try {
        console.log('Using OpenAI model (cost optimized)');
        return new ChatOpenAI({
          openAIApiKey: config.OPENAI_API_KEY,
          modelName: 'gpt-3.5-turbo-0125', // Latest 3.5 model, more efficient
          temperature: config.TEMPERATURE, // Lower temperature = more focused, cheaper
          maxTokens: config.MAX_TOKENS_PER_REQUEST, // Reduced to save costs
          topP: 0.9, // Slightly more focused
          frequencyPenalty: 0.1, // Reduce repetition
          presencePenalty: 0.1, // Encourage conciseness
        });
      } catch (error) {
        console.log('OpenAI initialization failed, using mock model');
        return new MockChatModel();
      }
    }
    
    console.log('Using mock model for testing');
    return new MockChatModel();
  }

  async invoke(messages: any[]): Promise<any> {
    return await this.model.invoke(messages);
  }

  async *stream(messages: any[]): AsyncGenerator<any> {
    yield* this.model.stream(messages);
  }

  pipe(parser: any): any {
    return this.model.pipe(parser);
  }

  // Helper method to create messages array
  createMessages(userMessage: string, systemPrompt?: string): any[] {
    const messages = [];
    
    if (systemPrompt && SystemMessage) {
      messages.push(new SystemMessage(systemPrompt));
    } else if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    if (HumanMessage) {
      messages.push(new HumanMessage(userMessage));
    } else {
      messages.push({ role: 'user', content: userMessage });
    }
    
    return messages;
  }
}

export default new AIService(); 