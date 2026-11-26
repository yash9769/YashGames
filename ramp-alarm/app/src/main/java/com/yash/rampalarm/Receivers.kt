package com.yash.rampalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Scheduler.ACTION_RING) return
        val id = intent.getIntExtra(Scheduler.EXTRA_ID, -1)
        val offset = intent.getIntExtra(Scheduler.EXTRA_OFFSET, 0)
        val alarm = AlarmStore.get(context, id) ?: return
        if (!alarm.enabled) return

        ContextCompat.startForegroundService(
            context,
            Intent(context, AlarmService::class.java)
                .setAction(AlarmService.ACTION_START)
                .putExtra(Scheduler.EXTRA_ID, id)
                .putExtra(Scheduler.EXTRA_OFFSET, offset)
        )

        if (alarm.repeatDaily) {
            Scheduler.rescheduleRing(context, alarm, offset)
        } else if (offset == 0) {
            // Last ring of a one-time alarm: switch it off.
            AlarmStore.upsert(context, alarm.copy(enabled = false))
        }
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Scheduler.rescheduleEverything(context)
    }
}
