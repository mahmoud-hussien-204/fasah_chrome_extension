export function safeCall(message?: string, ...arg: unknown[]) {
  for (let i = 0; i < arg.length; i++) {
    if (arg[i] === undefined || arg[i] === null) {
      alert(message);
      return false;
    }
  }
  return true;
}
