/**
 * Vercel Function entry point for the MyStudy API.
 *
 * Vercel's Express guide says the app must be exported as the module's default
 * export (or call app.listen). backend/app.js builds the Express app WITHOUT
 * listening, so the same app serves both local development (backend/server.js
 * adds listen) and this serverless entry.
 *
 * The database connection is established lazily inside app.js and cached on
 * globalThis, so a cold start connects once and warm invocations reuse it.
 *
 * NOT YET VERIFIED IN PRODUCTION. Two things need a preview deployment to
 * confirm, and are written up in MYSTUDY_PHASE2A_REPORT.md:
 *   1. that /api/* subpaths all reach this single function (the rewrite in
 *      vercel.json is there for exactly this reason), and
 *   2. that Vercel's file tracing bundles backend/'s dependencies from this
 *      monorepo layout.
 */
const app = require('../backend/app');

module.exports = app;
