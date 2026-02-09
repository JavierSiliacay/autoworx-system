import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import 'dotenv/config';

const ollama = createOllama();

async function main() {
    const result = streamText({
        model: ollama('llama3.2:1b'),
        prompt: 'Invent a new holiday and describe its traditions.',
    });

    console.log('--- Ollama is thinking... ---');
    for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
    }

    console.log('\n');
    console.log('Token usage:', await result.usage);
    console.log('Finish reason:', await result.finishReason);
}

main().catch(console.error);
