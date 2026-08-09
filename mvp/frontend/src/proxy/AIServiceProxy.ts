import { AIService } from './AIService';
import { Proposal } from '../model/Proposal';

export class AIServiceProxy implements AIService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async requestOperation(type: string, text: string, params: object): Promise<Proposal> {
        const response = await fetch(`${this.baseUrl}/api/ai-operations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, text, params })
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(`Errore durante la richiesta AI: ${errorMsg}`);
        }

        const data = await response.json();
        return new Proposal(data.content, data.operation_type, new Date(data.created_at));
    }

    public async listOperations(): Promise<string[]> {
        // Step 2: list_operations(GET api-ai-operations)
        const response = await fetch(`${this.baseUrl}/api/ai-operations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(`Errore nel recupero delle operazioni: ${errorMsg}`);
        }

        // Step 8: operationsList
        return await response.json();
    }
}