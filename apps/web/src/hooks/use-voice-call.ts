import { useEffect, useRef, useState } from 'react'
import { HappyRobotVoiceClient, type VoiceConnection } from '@happyrobot-ai/sdk/voice'

import { createVoiceToken } from '../lib/api'
import type { CallStatus, StartCallInput } from '../types'

export function useVoiceCall() {
  const connectionRef = useRef<VoiceConnection | null>(null)
  const audioElementsRef = useRef<HTMLMediaElement[]>([])

  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [callError, setCallError] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [runId, setRunId] = useState('')
  const [roomName, setRoomName] = useState('')
  const [eventLog, setEventLog] = useState<string[]>([
    'Ready for the first browser-to-workflow call.',
  ])

  function appendLog(message: string) {
    const timestamp = new Date().toLocaleTimeString()
    setEventLog((current) => [`${timestamp} · ${message}`, ...current].slice(0, 10))
  }

  function cleanupAudio() {
    for (const element of audioElementsRef.current) {
      element.pause()
      element.remove()
    }

    audioElementsRef.current = []
  }

  function attachRemoteTrack(track: {
    kind: string
    attach: () => HTMLMediaElement
  }) {
    const mediaElement = track.attach()
    mediaElement.muted = false
    mediaElement.volume = 1
    mediaElement.autoplay = true
    mediaElement.setAttribute('playsinline', 'true')
    mediaElement.setAttribute('data-happyrobot-audio', track.kind)
    mediaElement.style.display = 'none'
    document.body.appendChild(mediaElement)
    audioElementsRef.current.push(mediaElement)
    appendLog(`Remote ${track.kind} track attached.`)

    void mediaElement
      .play()
      .then(() => {
        appendLog(`Remote ${track.kind} playback started.`)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Browser blocked playback.'
        setCallError(
          'Connected, but browser audio playback was blocked. Unmute the tab, check your output device, then try starting the call again.',
        )
        appendLog(`Remote ${track.kind} playback failed: ${message}`)
      })
  }

  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [])

  async function startCall(
    input: StartCallInput,
    options: {
      happyRobotReady: boolean
      onCallEnded?: () => void | Promise<void>
    },
  ) {
    if (!options.happyRobotReady) {
      setCallStatus('error')
      setCallError(
        'HappyRobot is not configured yet. Add HAPPYROBOT_API_KEY and HAPPYROBOT_WORKFLOW_ID in apps/api/.env before starting a call.',
      )
      return
    }

    setCallError('')
    cleanupAudio()
    setCallStatus('requesting_token')
    appendLog('Requesting browser voice token from the API.')

    try {
      const token = await createVoiceToken(input)
      setRunId(token.run_id)
      setRoomName(token.room_name)
      appendLog(`Token created. Run ${token.run_id} mapped to room ${token.room_name}.`)

      setCallStatus('connecting')
      const voiceClient = new HappyRobotVoiceClient({
        url: token.url,
        token: token.token,
      })

      const connection = await voiceClient.connect({
        onConnected: () => {
          setCallStatus('live')
          setCallError('')
          appendLog('Connected to HappyRobot voice room.')
        },
        onAgentConnected: (participant) => {
          appendLog(`Agent joined as ${participant.identity}.`)
        },
        onTrackSubscribed: (track) => {
          attachRemoteTrack(track)
        },
        onTrackUnsubscribed: (track) => {
          appendLog(`Remote ${track.kind} track unsubscribed.`)
        },
        onReconnecting: () => {
          appendLog('Voice room reconnecting.')
        },
        onReconnected: () => {
          appendLog('Voice room reconnected.')
        },
        onDisconnected: (reason) => {
          cleanupAudio()
          connectionRef.current = null
          setCallStatus('ended')
          setIsMuted(false)
          appendLog(`Disconnected${reason ? `: ${reason}` : '.'}`)

          if (options.onCallEnded) {
            void options.onCallEnded()
          }
        },
        onError: (error) => {
          setCallStatus('error')
          setCallError(error.message)
          appendLog(`Voice error: ${error.message}`)
        },
      })

      connectionRef.current = connection
      setIsMuted(connection.isMuted())

      const localParticipant = connection.room.localParticipant
      appendLog(
        `Local microphone publications after connect: ${localParticipant.audioTrackPublications.size}.`,
      )

      if (localParticipant.audioTrackPublications.size === 0) {
        appendLog('No local microphone track published yet. Retrying microphone enable.')
        await localParticipant.setMicrophoneEnabled(true)
        appendLog(
          `Local microphone publications after retry: ${localParticipant.audioTrackPublications.size}.`,
        )
      }

      const remoteParticipants = Array.from(connection.room.remoteParticipants.values())
      appendLog(`Room has ${remoteParticipants.length} remote participant(s) after connect.`)

      for (const participant of remoteParticipants) {
        appendLog(`Existing participant detected: ${participant.identity}.`)

        for (const publication of participant.trackPublications.values()) {
          const existingTrack = publication.track
          const isAudioTrack =
            existingTrack && 'kind' in existingTrack && existingTrack.kind === 'audio'

          if (isAudioTrack) {
            attachRemoteTrack({
              kind: existingTrack.kind,
              attach: () => existingTrack.attach(),
            })
          }
        }
      }

      window.setTimeout(() => {
        if (audioElementsRef.current.length === 0) {
          appendLog(
            'No remote audio track detected after connect. This usually means the agent never joined or the workflow did not start.',
          )
        }
      }, 4_000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Call startup failed.'
      setCallStatus('error')
      setCallError(message)
      appendLog(`Startup error: ${message}`)
    }
  }

  async function endCall() {
    if (!connectionRef.current) {
      return
    }

    appendLog('Disconnecting the active call.')
    await connectionRef.current.disconnect()
  }

  async function toggleMute() {
    if (!connectionRef.current) {
      return
    }

    if (connectionRef.current.isMuted()) {
      await connectionRef.current.unmute()
      setIsMuted(false)
      appendLog('Microphone unmuted.')
      return
    }

    await connectionRef.current.mute()
    setIsMuted(true)
    appendLog('Microphone muted.')
  }

  return {
    callStatus,
    callError,
    isMuted,
    runId,
    roomName,
    eventLog,
    hasActiveConnection: Boolean(connectionRef.current),
    startCall,
    endCall,
    toggleMute,
  }
}
