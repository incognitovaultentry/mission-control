import {
  convexAuthNextjsMiddleware,
} from "@convex-dev/auth/nextjs/server";

export default convexAuthNextjsMiddleware((_request, _ctx) => {
  // Let each page handle its own auth gate
  return;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
