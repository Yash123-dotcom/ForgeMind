
import {
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/investigations(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const isFollowUpApi = req.nextUrl.pathname.endsWith('/follow-up');

  if (isProtectedRoute(req) && !isFollowUpApi) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
