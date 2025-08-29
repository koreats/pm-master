export interface CommonProps {
  id: string
  createdAt: Date
  updatedAt: Date
}

export abstract class BaseEntity<T extends CommonProps> {
  protected readonly props: T

  constructor(props: T) {
    this.props = props
  }

  getId(): string {
    return this.props.id
  }

  getCreatedAt(): Date {
    return this.props.createdAt
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt
  }

  protected updateTimestamp(): void {
    ;(this.props as any).updatedAt = new Date()
  }
}