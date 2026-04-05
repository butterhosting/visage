export const Route = {
  websites(ref?: string) {
    return ref ? `/websites/${ref}` : "/websites";
  },
  api() {
    return "/api";
  },
  data() {
    return "/data";
  },
};
