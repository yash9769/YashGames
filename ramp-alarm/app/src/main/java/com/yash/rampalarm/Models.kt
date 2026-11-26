package com.yash.rampalarm

import java.time.LocalTime
import java.time.format.DateTimeFormatter

enum class Profile(val label: String) {
    HOME("Home"),
    WORK("Work"),
}

/**
 * One "ramp": a target wake-up time plus a series of earlier rings.
 * Example: target 10:00 PM, lead 30, interval 5 -> 9:30, 9:35 ... 9:55, 10:00.
 */
data class RampAlarm(
    val id: Int,
    val hour: Int,
    val minute: Int,
    val leadMinutes: Int = 30,
    val intervalMinutes: Int = 5,
    val profile: Profile = Profile.HOME,
    val repeatDaily: Boolean = true,
    val enabled: Boolean = true,
) {
    /** Minutes before the target for each ring, earliest first, always ending with 0. */
    fun offsets(): List<Int> {
        val step = intervalMinutes.coerceAtLeast(1)
        val list = mutableListOf<Int>()
        var o = leadMinutes.coerceIn(0, MAX_LEAD)
        while (o > 0) {
            list.add(o)
            o -= step
        }
        list.add(0)
        return list
    }

    /** Clock times of every ring, earliest first. */
    fun ringLabels(): List<String> = offsets().map { formatMinuteOfDay(hour * 60 + minute - it) }

    fun targetLabel(): String = formatMinuteOfDay(hour * 60 + minute)

    fun summary(): String {
        val n = offsets().size
        return if (leadMinutes == 0) {
            "Single alarm"
        } else {
            "${formatMinuteOfDay(hour * 60 + minute - leadMinutes)} – ${targetLabel()} · every $intervalMinutes min · $n alarms"
        }
    }

    companion object {
        const val MAX_LEAD = 90
    }
}

private val timeFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("h:mm a")

fun formatMinuteOfDay(raw: Int): String {
    val m = ((raw % 1440) + 1440) % 1440
    return LocalTime.of(m / 60, m % 60).format(timeFormat)
}
