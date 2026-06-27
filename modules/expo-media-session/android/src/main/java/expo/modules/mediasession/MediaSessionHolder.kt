package expo.modules.mediasession

import android.support.v4.media.session.MediaSessionCompat

object MediaSessionHolder {
  var session: MediaSessionCompat? = null
  var commandEmitter: ((String) -> Unit)? = null
  var seekEmitter: ((Long) -> Unit)? = null

  var title: String = ""
  var artist: String = ""
  var album: String = ""
  var isPlaying: Boolean = false
  var canNext: Boolean = true
  var canPrevious: Boolean = true
  var durationMs: Long = 0
  var positionMs: Long = 0

  fun emit(command: String) {
    commandEmitter?.invoke(command)
  }

  fun emitSeek(positionMs: Long) {
    seekEmitter?.invoke(positionMs)
  }
}
