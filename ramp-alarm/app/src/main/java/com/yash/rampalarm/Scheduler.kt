package com.yash.rampalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import java.util.Calendar

/**
 * Schedules every ring of every ramp with AlarmManager.setAlarmClock, which is the
 * same mechanism the stock clock app uses: exact, survives Doze, wakes the phone.
 */
object Scheduler {
    const val ACTION_RING = "com.yash.rampalarm.RING"
    const val EXTRA_ID = "alarm_id"
    const val EXTRA_OFFSET = "offset"
    private const val DAY_MS = 24L * 60 * 60 * 1000
    private const val MAX_RINGS = 100

    private fun ringIntent(ctx: Context, alarmId: Int, index: Int, offset: Int): Intent =
        Intent(ctx, AlarmReceiver::class.java)
            .setAction(ACTION_RING)
            .setData(Uri.parse("rampalarm://ring/$alarmId/$index"))
            .putExtra(EXTRA_ID, alarmId)
            .putExtra(EXTRA_OFFSET, offset)

    private fun pending(ctx: Context, alarmId: Int, index: Int, offset: Int, create: Boolean): PendingIntent? {
        val flags = PendingIntent.FLAG_IMMUTABLE or
            (if (create) PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_NO_CREATE)
        return PendingIntent.getBroadcast(ctx, alarmId * MAX_RINGS + index, ringIntent(ctx, alarmId, index, offset), flags)
    }

    private fun alarmManager(ctx: Context) = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun cancelAll(ctx: Context, alarmId: Int) {
        val am = alarmManager(ctx)
        for (i in 0 until MAX_RINGS) {
            pending(ctx, alarmId, i, 0, create = false)?.let {
                am.cancel(it)
                it.cancel()
            }
        }
    }

    /** Next occurrence of the alarm's target time that is not older than [graceMs]. */
    private fun nextTarget(alarm: RampAlarm, now: Long, graceMs: Long): Long {
        val cal = Calendar.getInstance().apply {
            timeInMillis = now
            set(Calendar.HOUR_OF_DAY, alarm.hour)
            set(Calendar.MINUTE, alarm.minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        if (cal.timeInMillis + graceMs <= now) cal.add(Calendar.DAY_OF_YEAR, 1)
        return cal.timeInMillis
    }

    /** When this ring should next fire, or null if a one-shot ring has already passed. */
    fun ringTime(alarm: RampAlarm, offset: Int, now: Long): Long? {
        var t = nextTarget(alarm, now, 0) - offset * 60_000L
        if (t <= now) {
            if (!alarm.repeatDaily) return null
            t += DAY_MS
        }
        return t
    }

    /** Soonest upcoming ring across the whole ramp, used for sorting the list. */
    fun nextRing(alarm: RampAlarm, now: Long): Long? =
        if (!alarm.enabled) null else alarm.offsets().mapNotNull { ringTime(alarm, it, now) }.minOrNull()

    private fun setRing(ctx: Context, alarm: RampAlarm, index: Int, offset: Int, at: Long) {
        val pi = pending(ctx, alarm.id, index, offset, create = true) ?: return
        val show = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager(ctx).setAlarmClock(AlarmManager.AlarmClockInfo(at, show), pi)
    }

    fun scheduleAll(ctx: Context, alarm: RampAlarm) {
        cancelAll(ctx, alarm.id)
        if (!alarm.enabled) return
        val now = System.currentTimeMillis()
        alarm.offsets().forEachIndexed { i, o ->
            ringTime(alarm, o, now)?.let { setRing(ctx, alarm, i, o, it) }
        }
    }

    /** Called right after a ring fires so a daily alarm is armed again for tomorrow. */
    fun rescheduleRing(ctx: Context, alarm: RampAlarm, offset: Int) {
        val index = alarm.offsets().indexOf(offset)
        if (index < 0 || !alarm.repeatDaily) return
        ringTime(alarm, offset, System.currentTimeMillis())?.let { setRing(ctx, alarm, index, offset, it) }
    }

    fun rescheduleEverything(ctx: Context) {
        AlarmStore.load(ctx).forEach { scheduleAll(ctx, it) }
    }

    /** "I'm awake": drop the rest of today's ramp. Daily alarms resume tomorrow. */
    fun skipRestOfToday(ctx: Context, alarm: RampAlarm) {
        cancelAll(ctx, alarm.id)
        if (!alarm.repeatDaily) {
            AlarmStore.upsert(ctx, alarm.copy(enabled = false))
            return
        }
        val now = System.currentTimeMillis()
        val tomorrowTarget = nextTarget(alarm, now, 2 * 60_000L) + DAY_MS
        alarm.offsets().forEachIndexed { i, o ->
            setRing(ctx, alarm, i, o, tomorrowTarget - o * 60_000L)
        }
    }
}
