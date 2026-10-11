import React from 'react';
import { Link } from 'react-router-dom';
import { FaBookOpen, FaClipboardList, FaCheckDouble, FaChartLine } from 'react-icons/fa';
import './Onboarding.css';

/**
 * First-run guidance, in Italian.
 *
 * A student opening MyStudy for the first time previously landed on an empty
 * dashboard whose only hint was the line "Aggiungi corsi per vedere i tuoi
 * progressi". Nothing explained what the app is for, and nothing pointed at
 * the syllabus importer — the feature the whole product is built around.
 *
 * Shown only while the workspace is empty; once a course exists the dashboard
 * shows real data instead.
 */

const STEPS = [
  {
    icon: FaBookOpen,
    title: 'Crea un corso',
    text: 'Nome, professore e CFU. Bastano pochi secondi.',
  },
  {
    icon: FaClipboardList,
    title: 'Incolla il programma',
    text: 'Copia il programma ufficiale: ogni riga diventa un argomento.',
  },
  {
    icon: FaCheckDouble,
    title: 'Spunta gli argomenti',
    text: 'Segna quello che hai già studiato, nell’ordine che preferisci.',
  },
  {
    icon: FaChartLine,
    title: 'Monitora i progressi',
    text: 'Vedi a che punto sei in ogni corso e quanto tempo hai studiato.',
  },
];

export const HowItWorks = ({ heading = 'Come funziona MyStudy', headingLevel: H = 'h2' }) => (
  <section className="onboarding-steps" aria-labelledby="come-funziona">
    <H id="come-funziona" className="onboarding-steps__heading">
      {heading}
    </H>
    <ol className="onboarding-steps__list">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li className="onboarding-step" key={title}>
          <span className="onboarding-step__badge" aria-hidden="true">
            <Icon size={18} />
          </span>
          <div>
            <h3 className="onboarding-step__title">
              <span className="onboarding-step__number">{i + 1}.</span> {title}
            </h3>
            <p className="onboarding-step__text">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);

const Onboarding = () => (
  <section className="onboarding" aria-labelledby="onboarding-titolo">
    <div className="onboarding__intro">
      <p className="onboarding__eyebrow">Benvenuta in MyStudy</p>
      <h1 id="onboarding-titolo" className="onboarding__title">
        Trasforma il programma d’esame in una lista di argomenti da spuntare.
      </h1>
      <p className="onboarding__lead">
        Il programma di un corso è un muro di testo: difficile capire quanto manca davvero
        all’esame. MyStudy lo trasforma in una checklist ordinata, così sai sempre cosa hai
        studiato, cosa ti resta e quanto tempo ci stai dedicando.
      </p>

      <div className="onboarding__actions">
        <Link to="/courses?nuovo=1" className="btn btn-primary btn-lg">
          Crea il tuo primo corso
        </Link>
      </div>

      <p className="onboarding__note">
        Non hai il programma sottomano? Nessun problema: crea il corso adesso e incolla il
        programma quando vuoi.
      </p>
    </div>

    <HowItWorks heading="In quattro passaggi" headingLevel="h2" />
  </section>
);

export default Onboarding;
