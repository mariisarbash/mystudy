import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from '../services/api';
import { splitSyllabus } from '../utils/syllabus';

/**
 * "Incolla il programma" — the single entry point for syllabus import.
 *
 * This used to live only inside a course's Programma tab, behind two
 * navigation steps. The same dialog is now reused from the dashboard, from
 * the courses list and from the course page, so the app's strongest feature
 * is reachable from wherever the student happens to be.
 *
 * It calls the existing deterministic endpoint unchanged. The live preview is
 * the real client-side mirror of the server's line split (see utils/syllabus),
 * not a guess about what the server might do.
 *
 * Props:
 *   show, onHide          — modal control
 *   courseId, courseName  — target course; omit courseId to let the user pick
 *   courses               — [{_id, name}] required when courseId is omitted
 *   successNote           — optional banner, e.g. right after creating a course
 *   onImported(topics, courseId) — called after a successful import
 */
const SyllabusImportModal = ({
  show,
  onHide,
  courseId,
  courseName,
  courses = [],
  successNote,
  onImported,
}) => {
  const [programText, setProgramText] = useState('');
  const [targetCourse, setTargetCourse] = useState(courseId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  const mustPickCourse = !courseId;

  useEffect(() => {
    setTargetCourse(courseId || '');
  }, [courseId, show]);

  useEffect(() => {
    if (!show) {
      setProgramText('');
      setError(null);
      setSubmitting(false);
    }
  }, [show]);

  const lines = useMemo(() => splitSyllabus(programText), [programText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetCourse || lines.length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await axios.post(`/api/topics/course/${targetCourse}/generate`, {
        programText,
      });
      setProgramText('');
      if (onImported) onImported(response.data, targetCourse);
      onHide();
    } catch (err) {
      setError(
        "Non è stato possibile importare il programma. Controlla la connessione e riprova."
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
      onEntered={() => textareaRef.current?.focus()}
      aria-labelledby="titolo-importa-programma"
    >
      <Modal.Header closeButton closeLabel="Chiudi">
        <Modal.Title id="titolo-importa-programma" className="h5 mb-0">
          Incolla il programma del corso
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {successNote && (
            <Alert variant="success" className="py-2">
              {successNote}
            </Alert>
          )}

          <p className="text-body-secondary mb-3">
            Copia il programma dal sito del corso e incollalo qui sotto.{' '}
            <strong>Ogni riga diventa un argomento</strong> da spuntare mano a mano che lo
            studi. Le righe vuote vengono ignorate.
          </p>

          {mustPickCourse && (
            <Form.Group className="mb-3" controlId="importa-programma-corso">
              <Form.Label>Corso</Form.Label>
              <Form.Select
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                required
              >
                <option value="">Seleziona un corso…</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {!mustPickCourse && courseName && (
            <p className="mb-3">
              Corso: <strong>{courseName}</strong>
            </p>
          )}

          <Form.Group className="mb-2" controlId="importa-programma-testo">
            <Form.Label>Testo del programma</Form.Label>
            <Form.Control
              as="textarea"
              ref={textareaRef}
              value={programText}
              onChange={(e) => setProgramText(e.target.value)}
              rows={10}
              required
              aria-describedby="anteprima-programma"
              placeholder={
                'Esempio:\n\nSuccessioni e serie di funzioni\nLimiti di funzioni di più variabili\nDerivate parziali\nIntegrali doppi'
              }
            />
          </Form.Group>

          {/* Honest preview of the deterministic split: the exact number of
              topics that will be created, and the first few of them. */}
          <div id="anteprima-programma" aria-live="polite" className="mb-0">
            {lines.length === 0 ? (
              <span className="text-body-secondary small">
                Nessun argomento rilevato: incolla almeno una riga di testo.
              </span>
            ) : (
              <div className="small">
                <span className="fw-semibold text-success">
                  Verranno creati {lines.length} argomenti
                </span>
                <span className="text-body-secondary">
                  {' '}
                  — i primi: {lines.slice(0, 3).map((l) => `“${l}”`).join(', ')}
                  {lines.length > 3 ? '…' : ''}
                </span>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="danger" className="mt-3 mb-0" role="alert">
              {error}
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer className="flex-wrap gap-2 justify-content-end">
          <Button variant="outline-secondary" onClick={onHide} disabled={submitting}>
            Annulla
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || lines.length === 0 || !targetCourse}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                Importazione…
              </>
            ) : (
              // With no usable lines the button is disabled; interpolating an
              // empty count left a double space ("Crea  argomenti").
              lines.length > 0 ? `Crea ${lines.length} argomenti` : 'Crea argomenti'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SyllabusImportModal;
