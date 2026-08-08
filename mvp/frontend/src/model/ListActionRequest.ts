import { ListOperationType } from './ListOperationType';
import { ListType } from './ListType';

export class ListActionRequest {
    public operation: ListOperationType;
    public listType?: ListType;

    constructor(operation: ListOperationType, listType?: ListType) {
        this.operation = operation;
        this.listType = listType;
    }
}