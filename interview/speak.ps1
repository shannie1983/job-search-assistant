param([Parameter(Mandatory=$true)][string]$RequestFile)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$request=Get-Content -LiteralPath $RequestFile -Raw -Encoding UTF8 | ConvertFrom-Json
$speaker=New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $installed=$speaker.GetInstalledVoices() | ForEach-Object {$_.VoiceInfo}
    $voice=$installed | Where-Object {$_.Name -eq $request.voice} | Select-Object -First 1
    if(-not $voice){$voice=$installed | Where-Object {$_.Culture.Name -eq 'en-US'} | Select-Object -First 1}
    if($voice){$speaker.SelectVoice($voice.Name)}
    $speaker.Rate=-1
    $speaker.SetOutputToWaveFile($request.output)
    $speaker.Speak([string]$request.text)
} finally { $speaker.Dispose() }
