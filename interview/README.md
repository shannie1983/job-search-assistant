# Interview Studio

Run with the bundled Node runtime: `node interview/server.cjs`. Open http://127.0.0.1:8770. The job/CV app remains at port 8765.

Select a CV and saved job or paste a description. Prepare STAR prompts/questions, edit your actual experience, add company presentation notes and references, then Save preparation. Profiles are stored in outputs/interview/. Text practice logs are saved in outputs/interview/sessions/.

The preparation pipeline now applies the installed JobClaw interview workflow: it detects the role track, builds a realistic multi-round loop, creates 8–12 evidence-linked questions, supplies a preparation checklist and questions to ask back, and archives the plan as `05-interview-preparation.md`. Saved practice sessions include a canonical 10-point report with verbatim answers, per-question scores, strengths, improvements, and a next drill. Company claims still require cited source material; the existing company presentation and online research output are used when available.

Spoken question mode works without an AI service. Ollama mode uses a downloaded local model at loopback port 11434, with cloud model names disabled. Start Ollama and download `qwen3:4b`, then Check local AI. Typed or optionally dictated answers are reviewed by the local model and a follow-up is spoken through browser speech synthesis. This is turn-based voice practice, not full-duplex voice streaming. Voice availability depends on the browser/OS. Choose a voice labeled local if you want local synthesis; optional browser dictation may process speech through the browser vendor.

Enable microphone/camera requests permission only on click. Start recording records the candidate microphone and optional camera in browser memory. Stop and release devices finalizes recording and provides playback/download. The interviewer's synthesized voice is not recorded. No audio/video is uploaded or sent to AI. Download before leaving. Camera footage is not analyzed for emotion, identity, or hiring suitability.

Company notes are editable presentation material, not automatically researched/verified. STAR results are prompts requiring actual outcomes. Changing CVs requires rebuilding evidence-linked stories. Tests: `node --test interview/engine.test.cjs`. Hardware capture cannot be validated without the user's browser permission and devices.

Interview Studio is also embedded in the original GUI’s Interview preparation tab at port 8765. The iframe keeps its preparation state when switching workspace tabs; its separate backend stays on port 8770. Camera/microphone access remains user-activated.

Question audio now defaults to Windows System.Speech generating local WAV files in outputs/interview/voice/. A visible audio player provides manual playback if autoplay is blocked. Browser speech synthesis is optional and reports its errors. The embedded tab allows autoplay; microphone/camera permission is unchanged.

## Recorded answer coaching
Record my voice captures microphone audio for up to five minutes; Stop saves it under outputs/interview/recordings/ with local playback. Existing recordings can be uploaded to the local server. Transcribe locally uses faster-whisper base.en on CPU with downloaded files only; edit the transcript before scoring. Local Ollama grades clarity, relevance, specificity, and appropriate answer structure from 0–5 each; the total is scaled to 100. The breakdown, strength, improvement, and rehearsal exercise are shown. Scores are subjective practice feedback, not accent analysis or hiring likelihood. Audio and transcript remain on this computer. Dependencies: faster-whisper and av==16.0.1 in the user’s .codex/local-ai/interview-python folder; model files are in .codex/local-ai/whisper-models. No OpenAI API call is made.

## Real-time interview tab
The original GUI now includes a separate Real-time interview tab, loading the same local interview service in live mode. It starts with the latest saved preparation and has CV/job/company/STAR reference buttons in the practice room. Stop an answer recording to automatically transcribe and score it; an optional automatic local AI follow-up speaks the next turn. This remains turn-based voice interaction and requires a working microphone. Full camera recording uses the existing explicit media controls and download. Camera footage is not assessed.
Scored and submitted answers save under outputs/interview/sessions/. Repeated saves update the same session ID. History shows average scored-answer results and user-reported Win/Loss/Pending labels, notes, transcripts, coaching, and saved answer audio. Outcome labels are independent of AI scores. New interview session saves the current case before clearing it. All recordings remain local.
