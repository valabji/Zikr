package expo.modules.strongvibration

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StrongVibrationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoStrongVibration")

    Function("vibrate") { durationMs: Int ->
      vibrateTimings(longArrayOf(0, durationMs.toLong()))
    }

    Function("vibratePattern") { pattern: List<Int> ->
      vibrateTimings(pattern.map { it.toLong() }.toLongArray())
    }

    Function("hasVibrator") {
      getVibrator()?.hasVibrator() ?: false
    }
  }

  // Max amplitude + NOTIFICATION usage so OEM touch-feedback sliders set to zero don't silence the app.
  private fun vibrateTimings(timings: LongArray) {
    val vibrator = getVibrator() ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val amplitudes = IntArray(timings.size) { if (it % 2 == 1) 255 else 0 }
      val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        vibrator.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_NOTIFICATION))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(effect, audioAttributes())
      }
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(timings, -1, audioAttributes())
    }
  }

  private fun audioAttributes(): AudioAttributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()

  private fun getVibrator(): Vibrator? {
    val context = appContext.reactContext ?: return null
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }
}
