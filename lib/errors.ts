export class MetaPayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "MetaPayError"
  }
}
