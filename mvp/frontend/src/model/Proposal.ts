/**
 * Rappresenta una proposta generata dall'AI (es. Cappello Rosso, Distant Writing).
 */
export class Proposal {
    public content: string;
    public operationType: string;
    public createdAt: Date;

    constructor(content: string, operationType: string, createdAt: Date = new Date()) {
        this.content = content;
        this.operationType = operationType;
        this.createdAt = createdAt;
    }
}