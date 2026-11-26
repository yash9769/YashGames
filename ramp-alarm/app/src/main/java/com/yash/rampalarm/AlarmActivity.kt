package com.yash.rampalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/** Full-screen "alarm is ringing" screen shown over the lock screen. */
class AlarmActivity : ComponentActivity() {

    private val stopped = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        ContextCompat.registerReceiver(
            this, stopped, IntentFilter(AlarmService.ACTION_STOPPED), ContextCompat.RECEIVER_NOT_EXPORTED
        )

        val id = intent.getIntExtra(Scheduler.EXTRA_ID, -1)
        val alarm = AlarmStore.get(this, id)

        setContent {
            RampTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    RingingScreen(
                        title = alarm?.let { "${it.profile.label} alarm" } ?: "Alarm",
                        subtitle = alarm?.let { "Ramp for ${it.targetLabel()}" } ?: "",
                        onDismiss = {
                            startService(Intent(this, AlarmService::class.java).setAction(AlarmService.ACTION_STOP))
                            finish()
                        },
                        onAwake = {
                            startService(
                                Intent(this, AlarmService::class.java)
                                    .setAction(AlarmService.ACTION_STOP_ALL)
                                    .putExtra(Scheduler.EXTRA_ID, id)
                            )
                            finish()
                        },
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        unregisterReceiver(stopped)
        super.onDestroy()
    }
}

@Composable
private fun RingingScreen(title: String, subtitle: String, onDismiss: () -> Unit, onAwake: () -> Unit) {
    val now = LocalTime.now().format(DateTimeFormatter.ofPattern("h:mm a"))
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(now, fontSize = 64.sp, fontWeight = FontWeight.Bold)
        Text(title, fontSize = 22.sp)
        Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(48.dp))
        Button(onClick = onAwake, modifier = Modifier.fillMaxWidth().height(64.dp)) {
            Text("I'm awake – stop all", fontSize = 18.sp)
        }
        Spacer(Modifier.height(16.dp))
        OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text("Dismiss this one", fontSize = 16.sp)
        }
    }
}
