import ExpoModulesCore
import MediaPlayer
import AVFoundation

struct MediaMetadata: Record {
  @Field var title: String = ""
  @Field var artist: String = ""
  @Field var album: String = ""
  @Field var isPlaying: Bool = true
  @Field var canNext: Bool = true
  @Field var canPrevious: Bool = true
  @Field var durationMs: Double? = nil
  @Field var positionMs: Double? = nil
}

public class MediaSessionModule: Module {
  private var commandsConfigured = false

  public func definition() -> ModuleDefinition {
    Name("ExpoMediaSession")

    Events("onCommand")

    AsyncFunction("updateMetadata") { (meta: MediaMetadata) in
      self.configureCommandsIfNeeded()
      self.applyMetadata(meta)
    }.runOnQueue(.main)

    AsyncFunction("clear") {
      MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
      if #available(iOS 13.0, *) {
        MPNowPlayingInfoCenter.default().playbackState = .stopped
      }
    }.runOnQueue(.main)
  }

  private func applyMetadata(_ meta: MediaMetadata) {
    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
    info[MPMediaItemPropertyTitle] = meta.title
    info[MPMediaItemPropertyArtist] = meta.artist
    info[MPMediaItemPropertyAlbumTitle] = meta.album
    if let duration = meta.durationMs { info[MPMediaItemPropertyPlaybackDuration] = duration / 1000.0 }
    if let position = meta.positionMs { info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = position / 1000.0 }
    info[MPNowPlayingInfoPropertyPlaybackRate] = meta.isPlaying ? 1.0 : 0.0
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info

    if #available(iOS 13.0, *) {
      MPNowPlayingInfoCenter.default().playbackState = meta.isPlaying ? .playing : .paused
    }

    let center = MPRemoteCommandCenter.shared()
    center.nextTrackCommand.isEnabled = meta.canNext
    center.previousTrackCommand.isEnabled = meta.canPrevious
  }

  private func configureCommandsIfNeeded() {
    if commandsConfigured { return }
    commandsConfigured = true
    let center = MPRemoteCommandCenter.shared()

    center.playCommand.isEnabled = true
    center.playCommand.addTarget { [weak self] _ in
      self?.sendEvent("onCommand", ["command": "play"]); return .success
    }
    center.pauseCommand.isEnabled = true
    center.pauseCommand.addTarget { [weak self] _ in
      self?.sendEvent("onCommand", ["command": "pause"]); return .success
    }
    center.togglePlayPauseCommand.isEnabled = true
    center.togglePlayPauseCommand.addTarget { [weak self] _ in
      self?.sendEvent("onCommand", ["command": "togglePlayPause"]); return .success
    }
    center.nextTrackCommand.addTarget { [weak self] _ in
      self?.sendEvent("onCommand", ["command": "next"]); return .success
    }
    center.previousTrackCommand.addTarget { [weak self] _ in
      self?.sendEvent("onCommand", ["command": "previous"]); return .success
    }
    center.stopCommand.isEnabled = true
    center.stopCommand.addTarget { [weak self] _ in
      self?.sendEvent("onCommand", ["command": "stop"]); return .success
    }
  }
}
