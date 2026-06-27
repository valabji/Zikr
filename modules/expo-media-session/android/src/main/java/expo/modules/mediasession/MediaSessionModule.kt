package expo.modules.mediasession

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class MediaMetadataRecord : Record {
  @Field var title: String = ""
  @Field var artist: String = ""
  @Field var album: String = ""
  @Field var isPlaying: Boolean = true
  @Field var canNext: Boolean = true
  @Field var canPrevious: Boolean = true
  @Field var durationMs: Double? = null
  @Field var positionMs: Double? = null
}

class MediaSessionModule : Module() {
  private val context get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val main = Handler(Looper.getMainLooper())

  override fun definition() = ModuleDefinition {
    Name("ExpoMediaSession")

    Events("onCommand")

    OnCreate {
      MediaSessionHolder.commandEmitter = { command -> sendCommand(command) }
      MediaSessionHolder.seekEmitter = { pos -> sendSeek(pos) }
    }

    AsyncFunction("updateMetadata") { meta: MediaMetadataRecord ->
      main.post {
        ensureSession()
        MediaSessionHolder.apply {
          title = meta.title
          artist = meta.artist
          album = meta.album
          isPlaying = meta.isPlaying
          canNext = meta.canNext
          canPrevious = meta.canPrevious
          durationMs = (meta.durationMs ?: 0.0).toLong()
          positionMs = (meta.positionMs ?: 0.0).toLong()
        }
        applySessionState()
        startOrUpdateService()
      }
    }

    AsyncFunction("clear") {
      main.post {
        MediaSessionHolder.isPlaying = false
        stopService()
        MediaSessionHolder.session?.isActive = false
      }
    }

    OnDestroy {
      main.post {
        stopService()
        MediaSessionHolder.session?.release()
        MediaSessionHolder.session = null
      }
    }
  }

  private fun ensureSession() {
    if (MediaSessionHolder.session != null) return
    val session = MediaSessionCompat(context, "ZikrMediaSession")
    session.setCallback(object : MediaSessionCompat.Callback() {
      override fun onPlay() { MediaSessionHolder.emit("play") }
      override fun onPause() { MediaSessionHolder.emit("pause") }
      override fun onSkipToNext() { MediaSessionHolder.emit("next") }
      override fun onSkipToPrevious() { MediaSessionHolder.emit("previous") }
      override fun onStop() { MediaSessionHolder.emit("stop") }
      override fun onSeekTo(pos: Long) { MediaSessionHolder.emitSeek(pos) }
    })
    session.isActive = true
    MediaSessionHolder.session = session
  }

  private fun sendCommand(command: String) {
    try { sendEvent("onCommand", mapOf("command" to command)) } catch (e: Exception) {}
  }

  private fun sendSeek(positionMs: Long) {
    try {
      sendEvent("onCommand", mapOf("command" to "seek", "positionMs" to positionMs.toDouble()))
    } catch (e: Exception) {}
  }

  private fun applySessionState() {
    val session = MediaSessionHolder.session ?: return
    val h = MediaSessionHolder

    val metadata = MediaMetadataCompat.Builder()
      .putString(MediaMetadataCompat.METADATA_KEY_TITLE, h.title)
      .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, h.artist)
      .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, h.album)
      .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, h.durationMs)
      .build()
    session.setMetadata(metadata)

    var actions = PlaybackStateCompat.ACTION_PLAY or
      PlaybackStateCompat.ACTION_PAUSE or
      PlaybackStateCompat.ACTION_PLAY_PAUSE or
      PlaybackStateCompat.ACTION_STOP or
      PlaybackStateCompat.ACTION_SEEK_TO
    if (h.canNext) actions = actions or PlaybackStateCompat.ACTION_SKIP_TO_NEXT
    if (h.canPrevious) actions = actions or PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS

    val state = if (h.isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
    val playbackState = PlaybackStateCompat.Builder()
      .setActions(actions)
      .setState(state, h.positionMs, if (h.isPlaying) 1f else 0f)
      .build()
    session.setPlaybackState(playbackState)
    session.isActive = true
  }

  private fun startOrUpdateService() {
    val intent = Intent(context, MediaSessionService::class.java).setAction(MediaSessionService.ACTION_UPDATE)
    try { ContextCompat.startForegroundService(context, intent) } catch (e: Exception) {}
  }

  private fun stopService() {
    val intent = Intent(context, MediaSessionService::class.java).setAction(MediaSessionService.ACTION_STOP)
    try { ContextCompat.startForegroundService(context, intent) } catch (e: Exception) {}
  }
}
