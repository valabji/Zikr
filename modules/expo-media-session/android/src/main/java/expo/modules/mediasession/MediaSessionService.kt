package expo.modules.mediasession

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.support.v4.media.session.MediaSessionCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.media.session.MediaButtonReceiver

class MediaSessionService : Service() {
  companion object {
    const val ACTION_UPDATE = "expo.modules.mediasession.UPDATE"
    const val ACTION_STOP = "expo.modules.mediasession.STOP"
    const val ACTION_PLAY = "expo.modules.mediasession.PLAY"
    const val ACTION_PAUSE = "expo.modules.mediasession.PAUSE"
    const val ACTION_NEXT = "expo.modules.mediasession.NEXT"
    const val ACTION_PREV = "expo.modules.mediasession.PREV"
    const val CHANNEL_ID = "zikr_media_playback"
    const val NOTIF_ID = 4517
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val session = MediaSessionHolder.session
    if (session == null || intent?.action == ACTION_STOP) {
      startForegroundCompat(minimalNotification())
      ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }

    when (intent?.action) {
      ACTION_PLAY -> MediaSessionHolder.emit("play")
      ACTION_PAUSE -> MediaSessionHolder.emit("pause")
      ACTION_NEXT -> MediaSessionHolder.emit("next")
      ACTION_PREV -> MediaSessionHolder.emit("previous")
      Intent.ACTION_MEDIA_BUTTON -> MediaButtonReceiver.handleIntent(session, intent)
    }

    startForegroundCompat(buildNotification(session))
    return START_NOT_STICKY
  }

  private fun startForegroundCompat(notification: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIF_ID, notification)
    }
  }

  private fun minimalNotification(): Notification {
    createChannel()
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle(MediaSessionHolder.title)
      .build()
  }

  private fun buildNotification(session: MediaSessionCompat): Notification {
    createChannel()
    val h = MediaSessionHolder

    val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(
        this, 0, it,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
      )
    }

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(h.title)
      .setContentText(h.artist)
      .setSubText(h.album)
      .setSmallIcon(applicationInfo.icon)
      .setContentIntent(openIntent)
      .setDeleteIntent(servicePendingIntent(ACTION_STOP))
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

    val compact = mutableListOf<Int>()
    var index = 0
    if (h.canPrevious) {
      builder.addAction(android.R.drawable.ic_media_previous, "Previous", servicePendingIntent(ACTION_PREV))
      compact.add(index); index++
    }
    if (h.isPlaying) {
      builder.addAction(android.R.drawable.ic_media_pause, "Pause", servicePendingIntent(ACTION_PAUSE))
    } else {
      builder.addAction(android.R.drawable.ic_media_play, "Play", servicePendingIntent(ACTION_PLAY))
    }
    compact.add(index); index++
    if (h.canNext) {
      builder.addAction(android.R.drawable.ic_media_next, "Next", servicePendingIntent(ACTION_NEXT))
      compact.add(index); index++
    }

    builder.setStyle(
      androidx.media.app.NotificationCompat.MediaStyle()
        .setMediaSession(session.sessionToken)
        .setShowActionsInCompactView(*compact.toIntArray())
    )
    return builder.build()
  }

  private fun servicePendingIntent(action: String): PendingIntent {
    val intent = Intent(this, MediaSessionService::class.java).setAction(action)
    return PendingIntent.getService(
      this, action.hashCode(), intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW)
    channel.setShowBadge(false)
    channel.setSound(null, null)
    manager.createNotificationChannel(channel)
  }
}
