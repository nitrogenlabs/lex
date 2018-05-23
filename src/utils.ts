export const log = (message: string, cmd) => {
  if(!cmd.quiet) {
    console.log(message);
  }
}
