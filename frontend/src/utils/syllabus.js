/**
 * Mirror of the server's syllabus splitter.
 *
 * The importer is deliberately deterministic: POST /api/topics/course/:id/generate
 * splits the pasted text on newlines, drops blank lines and trims each one
 * (backend/controllers/topicController.js). There is no parsing intelligence,
 * no AI and no scheduling — one non-empty line becomes one topic, in order.
 *
 * This function reproduces exactly that rule so the dialog can show the user
 * what will be created *before* they commit. It must stay in step with the
 * controller; if the server rule changes, change it here too.
 */
export const splitSyllabus = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
