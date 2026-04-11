export const Route = {
  websites(ref?: string) {
    return ref ? `/websites/${ref}` : "/websites";
  },
  interface() {
    return "/interface";
  },
  settings() {
    return "/settings";
  },
};
