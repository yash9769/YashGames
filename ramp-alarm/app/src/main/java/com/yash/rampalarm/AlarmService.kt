package com.yash.rampalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/** Foreground service that actually makes noise: plays the profile's sound until stopped. */
class AlarmService : Service() {

    private var player: MediaPlayer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var savedAlarmVolume: Int? = null
    private var vibrator: Vibrator? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> stopRinging()
            ACTION_STOP_ALL -> {
                val id = intent.getIntExtra(Scheduler.EXTRA_ID, -1)
                AlarmStore.get(this, id)?.let { Scheduler.skipRestOfToday(this, it) }
                stopRinging()
            }
            else -> startRinging(intent)
        }
        return START_NOT_STICKY
    }

    private fun startRinging(intent: Intent?) {
        val id = intent?.getIntExtra(Scheduler.EXTRA_ID, -1) ?: -1
        val offset = intent?.getIntExtra(Scheduler.EXTRA_OFFSET, 0) ?: 0
        val alarm = AlarmStore.get(this, id)
        if (alarm == null) {
            stopSelf()
            return
        }

        createChannel()
        val notification = buildNotification(alarm, offset)
        if (Build.VERSION.SDK_INT >= 29) {
            ServiceCompat.startForeground(
                this, NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // Replace anything still ringing from the previous alarm in the ramp.
        releaseSound()
        handler.removeCallbacksAndMessages(null)
        playSound(alarm.profile)

        // Safety net: stop by itself so a missed alarm doesn't ring forever.
        handler.postDelayed({ stopRinging() }, AUTO_STOP_MS)
    }

    private fun playSound(profile: Profile) {
        val home = profile == Profile.HOME
        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager

        if (home) {
            // Home = loud: push the alarm stream to max, restore it afterwards.
            try {
                if (savedAlarmVolume == null) savedAlarmVolume = am.getStreamVolume(AudioManager.STREAM_ALARM)
                am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0)
            } catch (_: Exception) {
            }
        }

        try {
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            val res = if (home) R.raw.home_purge else R.raw.work_soft
            resources.openRawResourceFd(res).use { afd ->
                mp.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
            }
            mp.isLooping = true
            val startVol = if (home) 1f else 0.15f
            mp.setVolume(startVol, startVol)
            mp.prepare()
            mp.start()
            player = mp

            if (!home) fadeIn(0.15f, 0.6f)
        } catch (_: Exception) {
        }

        if (home) {
            @Suppress("DEPRECATION")
            vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 700, 400), 0))
        }
    }

    /** Work profile: start quiet and creep up so it never blasts in the office. */
    private fun fadeIn(from: Float, to: Float) {
        var v = from
        val step = object : Runnable {
            override fun run() {
                v = (v + 0.03f).coerceAtMost(to)
                player?.setVolume(v, v)
                if (v < to) handler.postDelayed(this, 1000)
            }
        }
        handler.postDelayed(step, 1000)
    }

    private fun releaseSound() {
        try {
            player?.stop()
        } catch (_: Exception) {
        }
        player?.release()
        player = null
        vibrator?.cancel()
        vibrator = null
    }

    private fun stopRinging() {
        handler.removeCallbacksAndMessages(null)
        releaseSound()
        savedAlarmVolume?.let {
            try {
                (getSystemService(Context.AUDIO_SERVICE) as AudioManager)
                    .setStreamVolume(AudioManager.STREAM_ALARM, it, 0)
            } catch (_: Exception) {
            }
        }
        savedAlarmVolume = null
        sendBroadcast(Intent(ACTION_STOPPED).setPackage(packageName))
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        releaseSound()
        super.onDestroy()
    }

    private fun createChannel() {
        val nm = getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(CHANNEL_ID) == null) {
            val ch = NotificationChannel(CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH)
            ch.setSound(null, null) // the service plays the sound itself
            ch.enableVibration(false)
            ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            nm.createNotificationChannel(ch)
        }
    }

    private fun buildNotification(alarm: RampAlarm, offset: Int): Notification {
        val ringIntent = Intent(this, AlarmActivity::class.java)
            .putExtra(Scheduler.EXTRA_ID, alarm.id)
            .putExtra(Scheduler.EXTRA_OFFSET, offset)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val full = PendingIntent.getActivity(this, alarm.id, ringIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

        val stop = PendingIntent.getService(
            this, 1, Intent(this, AlarmService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val stopAll = PendingIntent.getService(
            this, 2,
            Intent(this, AlarmService::class.java).setAction(ACTION_STOP_ALL).putExtra(Scheduler.EXTRA_ID, alarm.id),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Wake up! ${alarm.profile.label} alarm")
            .setContentText("Ramp for ${alarm.targetLabel()}")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setFullScreenIntent(full, true)
            .setContentIntent(full)
            .addAction(0, "Dismiss", stop)
            .addAction(0, "I'm awake – stop all", stopAll)
            .build()
    }

    companion object {
        const val ACTION_START = "com.yash.rampalarm.START"
        const val ACTION_STOP = "com.yash.rampalarm.STOP"
        const val ACTION_STOP_ALL = "com.yash.rampalarm.STOP_ALL"
        const val ACTION_STOPPED = "com.yash.rampalarm.STOPPED"
        private const val CHANNEL_ID = "ramp_alarm_ring"
        private const val NOTIFICATION_ID = 42
        private const val AUTO_STOP_MS = 90_000L
    }
}
