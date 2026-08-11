/**
 * Value Object che incapsula i dettagli dell'ultima operazione AI richiesta.
 */
export class RequestedOperation {
    public type: string;
    public params: object;

    constructor(type: string, params: object) {
        this.type = type;
        this.params = params;
    }
}