package com.yash.rampalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Tiny persistence layer: all alarms live as one JSON array in SharedPreferences. */
object AlarmStore {
    private const val PREFS = "ramp_alarms"
    private const val KEY = "list"

    fun load(ctx: Context): List<RampAlarm> {
        val raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
            ?: return emptyList()
        return try {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { i ->
                val o = arr.getJSONObject(i)
                RampAlarm(
                    id = o.getInt("id"),
                    hour = o.getInt("hour"),
                    minute = o.getInt("minute"),
                    leadMinutes = o.optInt("lead", 30),
                    intervalMinutes = o.optInt("interval", 5),
                    profile = runCatching { Profile.valueOf(o.optString("profile", "HOME")) }
                        .getOrDefault(Profile.HOME),
                    repeatDaily = o.optBoolean("repeat", true),
                    enabled = o.optBoolean("enabled", true),
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun save(ctx: Context, list: List<RampAlarm>) {
        val arr = JSONArray()
        list.forEach { a ->
            arr.put(
                JSONObject()
                    .put("id", a.id)
                    .put("hour", a.hour)
                    .put("minute", a.minute)
                    .put("lead", a.leadMinutes)
                    .put("interval", a.intervalMinutes)
                    .put("profile", a.profile.name)
                    .put("repeat", a.repeatDaily)
                    .put("enabled", a.enabled)
            )
        }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, arr.toString()).apply()
    }

    fun get(ctx: Context, id: Int): RampAlarm? = load(ctx).firstOrNull { it.id == id }

    fun upsert(ctx: Context, alarm: RampAlarm) {
        val list = load(ctx).toMutableList()
        val i = list.indexOfFirst { it.id == alarm.id }
        if (i >= 0) list[i] = alarm else list.add(alarm)
        save(ctx, list)
    }

    fun nextId(list: List<RampAlarm>): Int = (list.maxOfOrNull { it.id } ?: 0) + 1
}
