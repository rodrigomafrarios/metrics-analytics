export class ArgumentError extends Error {
  constructor() {
    super("Argument is missing");
  }
}
