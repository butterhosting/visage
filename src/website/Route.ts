export const Route = {
  websites(id?: string) {
    return id ? `websites/${id}` : "websites";
  },
  api() {
    return "api";
  },
  data() {
    return "data";
  },
};
