# Ramp Alarm

An Android alarm app for deep sleepers. Set **one** wake-up time; the app creates the whole run-up of alarms for you.

- **Ramp**: e.g. 10:00 PM, start 30 min before, every 5 min → 9:30, 9:35 … 10:00. Both numbers are adjustable per alarm.
- **Grouped**: one card per wake-up time. Tap it to see the individual rings. The list is sorted by what rings next (no more scrolling from 12 AM).
- **Home / Work profile**: Home = loud siren at max alarm volume + vibration. Work = quiet chime that fades in, no vibration.
- **I'm awake – stop all**: on the ringing screen, cancels the rest of today's ramp (daily alarms come back tomorrow). "Dismiss this one" only silences the current ring, so the next one still fires.
- Real alarms: `AlarmManager.setAlarmClock`, foreground service, full-screen lock-screen UI, re-armed after reboot.

## Your own purge sound
Replace `app/src/main/res/raw/home_purge.wav` (Home) and `work_soft.wav` (Work) with your own file of the same name (`.wav`, `.mp3` or `.ogg`; if you change the extension just keep the base name). The bundled files are placeholders.

## Build
Needs JDK 17 + Android SDK + Gradle 8.7 (or open the folder in Android Studio).

    cd ramp-alarm && gradle assembleDebug

APK: `app/build/outputs/apk/debug/app-debug.apk`. The GitHub Action in `.github/workflows` builds it on every push and uploads it as an artifact.

## OnePlus note
In Settings → Apps → Ramp Alarm → Battery, choose **Unrestricted**, and allow auto-launch, so OxygenOS never kills the app.
