import { LinkOperationType } from './LinkOperationType'

export class LinkActionRequest {
  public operation: LinkOperationType
  public url?: string
  public label?: string

  constructor(operation: LinkOperationType, url?: string, label?: string) {
    this.operation = operation
    this.url = url
    this.label = label
  }
}
