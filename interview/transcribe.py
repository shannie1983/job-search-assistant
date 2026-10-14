"""Local-only interview transcription after the one-time model download."""
import sys, json, re
from pathlib import Path
sys.path.insert(0,str(Path.home()/'.codex/local-ai/interview-python'))
from faster_whisper import WhisperModel
cache=str(Path.home()/'.codex/local-ai/whisper-models')
if '--setup' in sys.argv:
    WhisperModel('base.en',device='cpu',compute_type='int8',download_root=cache)
    print('Local English transcription model installed.')
    raise SystemExit(0)
model=WhisperModel('base.en',device='cpu',compute_type='int8',download_root=cache,local_files_only=True,cpu_threads=4)
segments,info=model.transcribe(sys.argv[1],language='en',beam_size=3,vad_filter=True)
segments=list(segments)
text=' '.join(s.text.strip() for s in segments).strip()
words=len(re.findall(r"\b[\w']+\b",text))
print(json.dumps({'text':text,'seconds':round(info.duration,2),'words':words,'words_per_minute':round(words*60/info.duration) if info.duration else 0,'segments':[{'start':round(s.start,2),'end':round(s.end,2),'text':s.text.strip()} for s in segments]},ensure_ascii=True))
