export function isAccountAlreadyLinkedError(e: unknown): boolean {
  return e instanceof Error && e.name === "AccountAlreadyLinked";
}
