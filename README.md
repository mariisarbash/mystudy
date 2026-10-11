# MyStudy — turning a university syllabus into a trackable study plan

> Student product project · Politecnico di Milano · **June 2025**
> By **Mariia Sarbash** — research, product concept and initial UX with **Matteo Soccali**
> Presented at Bending Spoons HQ, Milan, on **25 June 2025**, through the CSI / Passion in Action initiative

MyStudy began with a question we put to around 200 university students in Milan: what is actually
hardest about student life? Nearly half gave the same answer — organising time across lectures,
study and a personal life. MyStudy was our answer to it: paste the syllabus of a course, get an
ordered checklist of its topics, and always know how much is left before the exam.

📄 **[Read the original pitch deck — 25 June 2025](docs/mystudy-pitch-june-2025.pdf)** (12 slides, in Italian)

![The syllabus of a course, turned into a checklist](docs/screenshots/01-syllabus-checklist.png)

> **About this repository.** This is a historical portfolio piece, preserved rather than
> modernised. The interface is in Italian, for Italian university students. The README is in
> English, for everyone else.

---

## The problem

University students in Italy receive a course *programma* — a wall of text on a department web page
listing everything an exam can cover. It is the single most important document of the semester, and
it is almost impossible to work with: there is no way to see how much of it is done, how much is
left, or whether you are on track.

Students compensate with notebooks, spreadsheets and anxiety. That was the problem we set out to
investigate — not a technology looking for a use.

## Research & discovery

Before writing any code, we ran a survey of **approximately 200 university students aged 19–24**,
across Politecnico di Milano, Bocconi, Statale and Cattolica.

| Question | Leading answer |
|---|---|
| What is the biggest problem in your life as a university student? | **48.9%** — organising time across lectures, study and personal life |
| How important is it to you to solve that problem? *(1–5)* | **78%** chose 4 or 5 *(145 of the 186 answers to this question)* |
| Which task would most lighten your life if you could delegate it? | **45.7%** — creating a weekly study plan |

The open-ended answers all converged on the same need. One respondent asked for *"a planner that
tells me exactly what I have to do during the week so I don't fall behind — taking my wellbeing into
account too, I don't want to study until the middle of the night."*

So: a quantified problem, a quantified urgency, and a quantified preferred solution.

*All figures are as reported in our June 2025 presentation. This was a student survey, not an
audited study, and the sample was a convenience sample of students we could reach.*

## The product concept

Take the one document every student already has — the syllabus — and make it operable. Paste it in,
and the app turns it into a list of topics you tick off as you study them, with progress visible per
course. Around that: lessons, study sessions, a calendar and a Pomodoro timer, so the tracking lives
where the studying happens.

## What was actually built

A working full-stack prototype, in Italian:

| Feature | What it does |
|---|---|
| **Syllabus import** | Paste a course programme; every non-empty line becomes a topic. A live preview shows exactly how many topics will be created before you commit |
| **Topic checklist** | Tick topics off; per-course progress (`6 di 10 argomenti`, 60%) on the course page and the dashboard |
| **Courses** | Create, edit and delete courses with professor, CFU credits, colour and description |
| **Lessons** | A separate per-course list with dates, durations, notes and completion |
| **Study sessions** | Log study time against a course, with date, duration, topic and notes |
| **Calendar** | A month/week view of sessions, colour-coded by course (FullCalendar) |
| **Statistics** | Recorded study time, daily average, the last seven days as a bar chart, and the split across courses |
| **Pomodoro timer** | 25/5/15-minute cycles; a completed cycle can be saved as a study session |

![Pasting a syllabus](docs/screenshots/02-syllabus-import.png)
![Dashboard](docs/screenshots/03-dashboard.png)
![Statistics](docs/screenshots/04-statistics.png)
![The course page on a phone](docs/screenshots/05-mobile-course-detail.png)

*Screenshots of the 2026-maintained build. Interface in Italian; all data shown is fictional.*

## Vision versus implementation

The June 2025 presentation proposed an **AI-powered planner**: it would read study materials
uploaded by the user, estimate the time each topic needs, take exam dates and personal preferences
into account, and distribute the workload across the weeks automatically. Slide 10 sketched a
round trip through an OpenAI model selector.

**That was the product vision. It was never built, and nothing in this repository implements it.**
There is no LLM call, no API key, no file upload, no scheduling algorithm and no AI dependency
anywhere in the code.

What was built is deliberately simpler. The importer splits pasted text on line breaks, drops blank
lines, trims each remaining line and saves it as one topic, in order. **One line of text becomes one
topic** — that is the whole algorithm, and you can read it in
[`backend/controllers/topicController.js`](backend/controllers/topicController.js).

The prototype proved the part the research had actually validated: turning an unmanageable wall of
text into something a student can tick off. The deck is published here unedited, AI slides included,
because a product vision that outran a first prototype is a normal and honest part of the story.

## Architecture & technology

```text
frontend/   React 19 · Vite · React Router · react-bootstrap · FullCalendar
backend/    Express 5 · Mongoose 8 · MongoDB
docs/       the original presentation and screenshots
```

A conventional two-tier application. The frontend calls the API with same-origin relative `/api`
paths and Vite proxies them to Express in development. The API is a small REST surface over four
Mongoose models — `Course`, `Lesson`, `Topic`, `StudySession` — with controllers, routes and a
central error handler. There is no authentication: MyStudy was designed as a single-user local
prototype.

## Original presentation — 25 June 2025

📄 **[docs/mystudy-pitch-june-2025.pdf](docs/mystudy-pitch-june-2025.pdf)** — the 12 slides as
presented, in Italian, unedited.

MyStudy was presented at Bending Spoons HQ in Milan on 25 June 2025, through the CSI / Passion in
Action initiative at Politecnico di Milano. Presenting there was part of that programme: it was not
a competition win, a partnership, a commercial engagement or an endorsement of the project by
Bending Spoons. The logos on the slides are contextual.

The PDF is included byte-for-byte as a historical artifact. It was re-exported from Canva after
2025, so its file metadata carries a later date and the exporting account's name; the presentation
itself is dated 25 June 2025 on slide 1.

## Team & contributions

MyStudy was created and built by **Mariia Sarbash**, who wrote the application, produced the project
presentation, and presented it at Bending Spoons HQ on 25 June 2025. The research, the product
concept and the initial layout and UX were developed jointly with **Matteo Soccali**.

| | |
|---|---|
| Application code | Mariia Sarbash — 100% |
| Presentation (12 slides) and its delivery | Mariia Sarbash |
| Survey design, distribution and analysis | Mariia Sarbash and Matteo Soccali — together, ~50/50 |
| Product concept, initial layout and UX | Mariia Sarbash and Matteo Soccali — together |

## Project evolution

**June 2025 — the original project.** Problem analysis, the survey, the prototype and the
presentation. That is what this repository is a record of.

**2026 — maintenance for the portfolio.** The repository was later brought back to a working state
and made presentable. That work is *not* part of the original project and should not be read as
something that existed in June 2025:

- migrated the frontend from Create React App to Vite (the old toolchain no longer built at all);
- consolidated three competing HTTP clients into one and fixed features that had never worked from
  the interface, including saving a Pomodoro session and editing a course;
- stopped tracking `node_modules` and environment files, and wrote a real `.gitignore`;
- made the layout responsive, raised contrast and keyboard accessibility to WCAG 2.1 AA for the
  application's own components, and rewrote the empty states;
- separated recorded from planned study time (see Limitations).

No feature from the AI vision was added, then or now.

**Where I am now.** For more recent work, see
**[Sorteat](https://github.com/mariisarbash/sorteat_high_fidelity)** — a later project whose design
and engineering standard reflects where my product and technical work is today. MyStudy is kept as
it is precisely so the distance between the two is visible.

## Limitations

- The AI planning described in the presentation was never implemented. The importer is a
  deterministic line split.
- Study sessions have no completion state. The app distinguishes **recorded** time (sessions dated
  in the past) from **planned** time (sessions dated in the future) and labels the two separately,
  but it cannot know whether a session actually took place.
- Deleting a course leaves its topics and lessons in the database.
- There is no authentication, and no multi-user support. It is a single-user local prototype.
- There is no hosted demo. The screenshots above and the presentation are the evidence; the code
  runs locally in a couple of minutes.

## Running it locally

**Requirements:** Node.js 20 or newer, and a MongoDB instance you can write to.

```bash
git clone https://github.com/mariisarbash/mystudy.git
cd mystudy
npm install && npm run install:all

# Point the API at your database (see backend/.env.example for every variable)
cp backend/.env.example backend/.env
#   MONGODB_URI=mongodb://127.0.0.1:27017/mystudy
#   PORT=5001

npm run dev
```

`npm run dev` starts the API on <http://localhost:5001> and the frontend on
<http://localhost:3000>, with `/api` proxied to the API. `npm run build` produces the production
frontend in `frontend/dist`.

The app starts empty and walks you through creating a first course and pasting a syllabus.

## License

[MIT](LICENSE). The presentation in `docs/` is a historical document included for reference; the
third-party names and logos it contains belong to their respective owners.
