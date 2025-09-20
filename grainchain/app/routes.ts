import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/batch/info/:id", "routes/batch.info.$id.tsx"),
] satisfies RouteConfig;
