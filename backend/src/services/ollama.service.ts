import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://ollama:11434';

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

export interface OllamaListResponse {
    models: OllamaModel[];
}

export interface OllamaPullProgress {
    status: string,
    digest?: string;
    total?: number;
    completed?: number;
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
    try {
        const response = await axios.get<OllamaListResponse>(`${OLLAMA_BASE_URL}/api/tags`);
        return response.data.models || [];
    } catch (error: any) {
        console.error('Error listing Ollama models:', error.message);
        throw new Error('Failed to list models from Ollama');
    }
}

export async function pullOllamaModel(modelName: string): Promise<void> {
    try {
        const response = await axios.post(
            `${OLLAMA_BASE_URL}/api/pull`,
            { name: modelName },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 600000, // 10 minutes
            }
        );
    } catch (error: any) {
        console.error(`Error pulling model ${modelName}:`, error.message);
        throw new Error(`Failed to pull model: ${modelName}`);
    }
}

export async function deleteOllamaModel(modelName: string): Promise<void> {
    try {
        await axios.delete(`${OLLAMA_BASE_URL}/api/delete`, {
            data: { name: modelName },
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error(`Error deleting model ${modelName}:`, error.message);
        throw new Error(`Failed to delete model: ${modelName}`);
    }
}

export async function getModelInfo(modelName: string): Promise<OllamaModel | null> {
    try {
        const models = await listOllamaModels();
        return models.find(model => model.name === modelName) || null;
    } catch (error) {
        return null;
    }
}