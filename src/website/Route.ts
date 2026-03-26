export const Route = {
  websites(id?: string) {
    return id ? `websites/${id}` : "websites";
  },
  script() {
    return "script";
  },
  data() {
    return "data";
  },
};
