@file:OptIn(ExperimentalMaterial3Api::class)

package com.yash.rampalarm

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar

private val Orange = Color(0xFFFF7A45)

@Composable
fun RampTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Orange,
            onPrimary = Color(0xFF1A0E08),
            background = Color(0xFF0F1115),
            surface = Color(0xFF181B21),
            surfaceVariant = Color(0xFF232730),
            onSurface = Color(0xFFECEEF2),
            onSurfaceVariant = Color(0xFFA6ACB8),
            onBackground = Color(0xFFECEEF2),
        ),
        content = content,
    )
}

class MainActivity : ComponentActivity() {
    private val tick = mutableIntStateOf(0)

    private val notifPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { tick.intValue++ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= 33) notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        setContent { RampTheme { AlarmApp(tick.intValue) } }
    }

    override fun onResume() {
        super.onResume()
        tick.intValue++
    }
}

@Composable
fun AlarmApp(tick: Int) {
    val ctx = LocalContext.current
    val alarms = remember { mutableStateListOf<RampAlarm>() }
    var editing by remember { mutableStateOf<RampAlarm?>(null) }
    var editingIsNew by remember { mutableStateOf(false) }
    var expandedId by remember { mutableIntStateOf(-1) }

    // Reload whenever the app comes back to the front (a one-time alarm may have switched itself off).
    LaunchedEffect(tick) {
        alarms.clear()
        alarms.addAll(AlarmStore.load(ctx))
    }

    fun persist(a: RampAlarm) {
        val i = alarms.indexOfFirst { it.id == a.id }
        if (i >= 0) alarms[i] = a else alarms.add(a)
        AlarmStore.save(ctx, alarms.toList())
        Scheduler.scheduleAll(ctx, a)
    }

    fun remove(a: RampAlarm) {
        Scheduler.cancelAll(ctx, a.id)
        alarms.removeAll { it.id == a.id }
        AlarmStore.save(ctx, alarms.toList())
    }

    val current = editing
    if (current != null) {
        BackHandler { editing = null }
        EditorScreen(
            initial = current,
            isNew = editingIsNew,
            onSave = { persist(it); editing = null },
            onDelete = { remove(current); editing = null },
            onCancel = { editing = null },
        )
        return
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    val cal = Calendar.getInstance()
                    editingIsNew = true
                    editing = RampAlarm(
                        id = AlarmStore.nextId(alarms.toList()),
                        hour = (cal.get(Calendar.HOUR_OF_DAY) + 1) % 24,
                        minute = 0,
                    )
                },
                containerColor = Orange,
                contentColor = Color(0xFF1A0E08),
            ) { Icon(Icons.Default.Add, contentDescription = "New alarm") }
        },
    ) { pad ->
        val now = System.currentTimeMillis()
        // Soonest-ringing first, so what you need next is always at the top instead of "12 AM first".
        val sorted = alarms.sortedBy { Scheduler.nextRing(it, now) ?: Long.MAX_VALUE }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(pad).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Alarms", fontSize = 32.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 24.dp))
            }
            item { PermissionBanner(tick) }
            if (sorted.isEmpty()) {
                item {
                    Text(
                        "No alarms yet. Tap + and set the time you must be awake — the app adds the earlier rings for you.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 24.dp),
                    )
                }
            }
            items(sorted, key = { it.id }) { a ->
                AlarmCard(
                    alarm = a,
                    expanded = expandedId == a.id,
                    onToggleExpand = { expandedId = if (expandedId == a.id) -1 else a.id },
                    onToggleEnabled = { persist(a.copy(enabled = it)) },
                    onEdit = { editingIsNew = false; editing = a },
                )
            }
            item { Spacer(Modifier.height(96.dp)) }
        }
    }
}

@Composable
private fun AlarmCard(
    alarm: RampAlarm,
    expanded: Boolean,
    onToggleExpand: () -> Unit,
    onToggleEnabled: (Boolean) -> Unit,
    onEdit: () -> Unit,
) {
    val dim = if (alarm.enabled) 1f else 0.5f
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f).clickable(onClick = onToggleExpand)) {
                    Text(
                        alarm.targetLabel(),
                        fontSize = 34.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = dim),
                    )
                    Text(alarm.summary(), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                    Text(
                        "${alarm.profile.label} · ${if (alarm.repeatDaily) "Every day" else "Once"}",
                        color = Orange.copy(alpha = dim),
                        fontSize = 13.sp,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
                Switch(checked = alarm.enabled, onCheckedChange = onToggleEnabled)
            }
            AnimatedVisibility(expanded) {
                Column(Modifier.padding(top = 12.dp)) {
                    alarm.ringLabels().forEachIndexed { i, label ->
                        val last = i == alarm.offsets().lastIndex
                        Text(
                            (if (last) "● " else "○ ") + label + if (last) "  (wake-up time)" else "",
                            color = if (last) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(vertical = 2.dp),
                        )
                    }
                    TextButton(onClick = onEdit) { Text("Edit") }
                }
            }
        }
    }
}

@Composable
private fun PermissionBanner(tick: Int) {
    val ctx = LocalContext.current
    val problem = remember(tick) { permissionProblem(ctx) } ?: return
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(Modifier.padding(16.dp)) {
            Text(problem.first, fontWeight = FontWeight.SemiBold)
            Text(problem.second, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
            TextButton(onClick = problem.third) { Text("Fix in settings") }
        }
    }
}

private fun permissionProblem(ctx: Context): Triple<String, String, () -> Unit>? {
    if (!NotificationManagerCompat.from(ctx).areNotificationsEnabled()) {
        return Triple("Notifications are off", "Alarms need notifications to show the ringing screen.") {
            ctx.startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }
    if (Build.VERSION.SDK_INT >= 34) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        if (!nm.canUseFullScreenIntent()) {
            return Triple("Full-screen alarms are off", "Allow it so the alarm can wake the screen when the phone is locked.") {
                ctx.startActivity(
                    Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${ctx.packageName}"))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            }
        }
    }
    return null
}

@Composable
private fun EditorScreen(
    initial: RampAlarm,
    isNew: Boolean,
    onSave: (RampAlarm) -> Unit,
    onDelete: () -> Unit,
    onCancel: () -> Unit,
) {
    val timeState = rememberTimePickerState(initial.hour, initial.minute, is24Hour = false)
    var lead by remember { mutableFloatStateOf(initial.leadMinutes.toFloat()) }
    var interval by remember { mutableFloatStateOf(initial.intervalMinutes.toFloat()) }
    var profile by remember { mutableStateOf(initial.profile) }
    var repeat by remember { mutableStateOf(initial.repeatDaily) }

    val draft = initial.copy(
        hour = timeState.hour,
        minute = timeState.minute,
        leadMinutes = lead.toInt(),
        intervalMinutes = interval.toInt().coerceAtLeast(1),
        profile = profile,
        repeatDaily = repeat,
        enabled = true,
    )

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(if (isNew) "New alarm" else "Edit alarm", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text("Pick the time you MUST be awake.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) { TimePicker(state = timeState) }

        Spacer(Modifier.height(16.dp))
        Text("Start ringing ${if (lead.toInt() == 0) "at the time only" else "${lead.toInt()} min before"}", fontWeight = FontWeight.SemiBold)
        Slider(value = lead, onValueChange = { lead = it }, valueRange = 0f..RampAlarm.MAX_LEAD.toFloat(), steps = 17)

        Text("Ring every ${interval.toInt()} min", fontWeight = FontWeight.SemiBold)
        Slider(value = interval, onValueChange = { interval = it }, valueRange = 1f..15f, steps = 13)

        Spacer(Modifier.height(8.dp))
        Text("Where are you?", fontWeight = FontWeight.SemiBold)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
            FilterChip(
                selected = profile == Profile.HOME,
                onClick = { profile = Profile.HOME },
                label = { Text("Home · loud purge") },
            )
            FilterChip(
                selected = profile == Profile.WORK,
                onClick = { profile = Profile.WORK },
                label = { Text("Work · soft") },
            )
        }

        Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("Repeat every day", Modifier.weight(1f))
            Switch(checked = repeat, onCheckedChange = { repeat = it })
        }

        Spacer(Modifier.height(12.dp))
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(Modifier.padding(12.dp)) {
                Text("${draft.offsets().size} alarms will be created:", fontWeight = FontWeight.SemiBold)
                Text(draft.ringLabels().joinToString("  ·  "), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
            }
        }

        Spacer(Modifier.height(20.dp))
        Button(onClick = { onSave(draft) }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Save") }
        OutlinedButton(onClick = onCancel, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) { Text("Cancel") }
        if (!isNew) {
            TextButton(onClick = onDelete, modifier = Modifier.fillMaxWidth()) {
                Text("Delete alarm", color = MaterialTheme.colorScheme.error)
            }
        }
        Spacer(Modifier.height(32.dp))
    }
}
