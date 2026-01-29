
import { useState, useRef, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { RecordButton } from '../components/RecordButton';
import { TimerDisplay } from '../components/TimerDisplay';
import { SourceSelector } from '../components/SourceSelector';
import { AudioControls } from '../components/AudioControls';
import { FormatSelector } from '../components/FormatSelector';
import { SettingsModal } from '../components/SettingsModal';

export default function Recorder() {

    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [sourceMode, setSourceMode] = useState<SourceMode>('screen');
    const [micActive, setMicActive] = useState(true);
    const [systemActive, setSystemActive] = useState(false);
    const [format, setFormat] = useState(() => {
        const saved = localStorage.getItem('format');
        return saved || 'mp4';
    });
    const [frameRate, setFrameRate] = useState(() => {
        const saved = localStorage.getItem('frameRate');
        const parsed = saved ? parseInt(saved, 10) : 60;
        return isNaN(parsed) ? 60 : parsed;
    });
    const [showCursor, setShowCursor] = useState(() => {
        const saved = localStorage.getItem('showCursor');
        return saved !== null ? saved === 'true' : true;
    });
    const [countdown, setCountdown] = useState(() => {
        const saved = localStorage.getItem('countdown');
        return saved !== null ? saved === 'true' : true;
    });
    const [saveDirectory, setSaveDirectory] = useState(() => {
        return localStorage.getItem('saveDirectory') || '';
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [cachedSourceId, setCachedSourceId] = useState<string | null>(null);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedMicId, setSelectedMicId] = useState<string>(() => {
        return localStorage.getItem('selectedMicId') || 'default';
    });

    useEffect(() => {
        if (!saveDirectory && window.electron && window.electron.getDefaultSaveDirectory) {
            window.electron.getDefaultSaveDirectory().then(setSaveDirectory);
        }
    }, []);

    // Enumerate audio input devices
    useEffect(() => {
        const getAudioDevices = async () => {
            try {
                // Request permission first
                await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                });

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(device => device.kind === 'audioinput');
                setAudioDevices(audioInputs);
            } catch (err) {
                console.warn('Could not enumerate audio devices:', err);
            }
        };

        getAudioDevices();

        // Listen for device changes
        navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
        };
    }, []);

    const handleSelectDirectory = async () => {
        if (window.electron && window.electron.selectDirectory) {
            const path = await window.electron.selectDirectory();
            if (path) {
                setSaveDirectory(path);
                localStorage.setItem('saveDirectory', path);
            }
        } else {
            console.warn('Electron API not available');
            alert('Directory selection is only available in the desktop app.');
        }
    };

    const handleMicChange = (deviceId: string) => {
        setSelectedMicId(deviceId);
        localStorage.setItem('selectedMicId', deviceId);
    };

    const handleFrameRateChange = (fps: number) => {
        setFrameRate(fps);
        localStorage.setItem('frameRate', fps.toString());
    };

    const handleShowCursorChange = (show: boolean) => {
        setShowCursor(show);
        localStorage.setItem('showCursor', show.toString());
    };

    const handleCountdownChange = (enabled: boolean) => {
        setCountdown(enabled);
        localStorage.setItem('countdown', enabled.toString());
    };

    const handleFormatChange = (newFormat: string) => {
        setFormat(newFormat);
        localStorage.setItem('format', newFormat);
    };

    const handleSourceModeChange = async (mode: SourceMode) => {
        if (mode !== 'region') {
            setSourceMode(mode);
            setCachedSourceId(null);
            setSelectedRegion(null);
        } else {
            // Region mode
            const previousMode = sourceMode;
            setSourceMode('region');

            if (window.electron && window.electron.openRegionSelector) {
                const success = await window.electron.openRegionSelector();
                if (!success) {
                    console.log('Region selection cancelled or failed');
                    // Revert to previous mode if opening selector failed (e.g. user cancelled prompt)
                    setSourceMode(previousMode);
                }
            }
        }
    };

    const handleRegionSelect = (region: Region, sourceId?: string) => {
        setSelectedRegion(region);
        if (sourceId) {
            setCachedSourceId(sourceId);
        }
    };

    // Listen for region selected from the separate window
    useEffect(() => {
        if (window.electron && window.electron.onRegionSelected) {
            window.electron.onRegionSelected((region: Region, sourceId?: string) => {
                handleRegionSelect(region, sourceId);
            });
        }
    }, []);

    // Status text logic
    const [statusText, setStatusText] = useState('Ready to record');


    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const toggleRecording = async () => {
        if (!isRecording) {
            try {
                // 1. Check Electron APIs
                if (!window.electron || !window.electron.getSources) {
                    alert("Electron APIs not available");
                    return;
                }

                // Check if region mode is selected but no region is chosen
                if (sourceMode === 'region' && !selectedRegion) {
                    alert("Please select a region first");
                    if (window.electron && window.electron.openRegionSelector) {
                        window.electron.openRegionSelector();
                    }
                    return;
                }

                let desktopStream: MediaStream;
                let targetSourceId: string;

                // Determine the correct source ID based on mode
                if (sourceMode === 'region') {
                    if (cachedSourceId) {
                        console.log('Region mode: Using cached source ID');
                        targetSourceId = cachedSourceId;
                    } else {
                        // Fallback if no cached ID (e.g. legacy behavior or error)
                        const screenSource = await window.electron.getPrimaryScreen();
                        if (!screenSource) {
                            alert("No screen source available for region recording. Please ensure screen sharing permissions are granted.");
                            return;
                        }
                        targetSourceId = screenSource.id;
                    }
                } else {
                    // Start by getting potential sources
                    const sources = await window.electron.getSources();

                    const targetType = sourceMode === 'window' ? 'window' : 'screen';
                    const selectedSource = sources.find((s) => s.id.startsWith(targetType));
                    const sourceId = selectedSource ? selectedSource.id : sources[0]?.id;

                    if (!sourceId) {
                        alert("No source found to record");
                        return;
                    }
                    targetSourceId = sourceId;
                }

                // Use getUserMedia directly which should not prompt if sourceId is valid and permissions are granted
                // or prompt once if needed.
                try {
                    const constraints: RecordingConstraints = {
                        audio: systemActive ? {
                            mandatory: {
                                chromeMediaSource: 'desktop'
                            }
                        } : false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: targetSourceId,
                                minFrameRate: frameRate,
                                maxFrameRate: frameRate
                            }
                        }
                    };

                    console.log('Using constraints:', constraints);
                    desktopStream = await navigator.mediaDevices.getUserMedia(constraints as unknown as MediaStreamConstraints);
                } catch (err) {
                    console.error("Failed to get media stream:", err);
                    throw err;
                }

                // Microphone
                let micStream: MediaStream | null = null;
                if (micActive) {
                    try {
                        const audioConstraints: MediaTrackConstraints = {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: false // Sometimes helpful for music/high quality, but check
                        };

                        // Use specific device if selected (not 'default')
                        if (selectedMicId && selectedMicId !== 'default') {
                            audioConstraints.deviceId = { exact: selectedMicId };
                        }

                        micStream = await navigator.mediaDevices.getUserMedia({
                            audio: audioConstraints,
                            video: false
                        });
                    } catch (err) {
                        console.warn("Could not get microphone stream", err);
                    }
                }

                // Combine tracks using Web Audio API for better mixing if multiple audio sources exist
                const tracks = [...desktopStream.getVideoTracks()];

                // Explicitly stop and remove desktop audio tracks if system audio is disabled
                if (!systemActive) {
                    desktopStream.getAudioTracks().forEach(track => {
                        track.stop();
                        desktopStream.removeTrack(track);
                    });
                }

                const audioContext = new AudioContext();
                const destination = audioContext.createMediaStreamDestination();
                let hasAudio = false;

                // Explicitly resume context (required in some browsers/Electron environments)
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                if (systemActive && desktopStream.getAudioTracks().length > 0) {
                    const desktopSource = audioContext.createMediaStreamSource(desktopStream);
                    desktopSource.connect(destination);
                    hasAudio = true;
                } else if (systemActive) {
                    console.warn("System audio requested but no audio tracks found in desktop stream. Check OS permissions/capabilities.");
                }

                if (micStream && micStream.getAudioTracks().length > 0) {
                    const micSource = audioContext.createMediaStreamSource(micStream);
                    micSource.connect(destination);
                    hasAudio = true;
                }

                if (hasAudio) {
                    tracks.push(...destination.stream.getAudioTracks());
                }

                let finalStream: MediaStream;

                // Handle region recording with canvas cropping
                if (sourceMode === 'region' && selectedRegion) {
                    // Create a video element to play the desktop stream
                    const video = document.createElement('video');
                    video.srcObject = new MediaStream([desktopStream.getVideoTracks()[0]]);
                    video.play();

                    // Wait for video metadata to load
                    await new Promise((resolve) => {
                        video.onloadedmetadata = resolve;
                    });

                    // Create canvas for cropping
                    const canvas = document.createElement('canvas');
                    canvas.width = selectedRegion.width;
                    canvas.height = selectedRegion.height;
                    const ctx = canvas.getContext('2d')!;

                    // Draw cropped region at the specified frame rate
                    const drawInterval = setInterval(() => {
                        if (video.readyState === video.HAVE_ENOUGH_DATA) {
                            ctx.drawImage(
                                video,
                                selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height,
                                0, 0, selectedRegion.width, selectedRegion.height
                            );
                        }
                    }, 1000 / frameRate);

                    // Store interval for cleanup
                    const cleanupCanvas = () => {
                        clearInterval(drawInterval);
                        video.srcObject = null;
                        // IMPORTANT: Stop the original stream tracks when canvas cleanup/stop is called
                        // This prevents the "sharing indicator" from persisting or hidden streams running
                        desktopStream.getTracks().forEach(track => track.stop());
                    };

                    // Get stream from canvas
                    const canvasStream = canvas.captureStream(frameRate);
                    const videoTracks = canvasStream.getVideoTracks();

                    // Combine canvas video with audio
                    if (hasAudio) {
                        finalStream = new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]);
                    } else {
                        finalStream = new MediaStream(videoTracks);
                    }

                    // Store cleanup function
                    (finalStream as ExtendedMediaStream)._cleanupCanvas = cleanupCanvas;
                } else {
                    // Normal recording (screen or window)
                    finalStream = new MediaStream(tracks);
                }

                streamRef.current = finalStream;

                // 3. Initialize Recording in Main
                await window.electron.startRecording();

                // 4. Create MediaRecorder
                // Prefer VP9 for better quality, fallback to VP8, then H.264
                let mimeType = 'video/webm';
                if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
                    mimeType = 'video/webm; codecs=vp9';
                } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
                    mimeType = 'video/webm; codecs=vp8';
                } else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) {
                    mimeType = 'video/webm; codecs=h264';
                }

                // Calculate bitrate based on frame rate
                // Higher frame rates need more bitrate for quality
                // Base: 2.5Mbps for 30fps, scale proportionally
                const videoBitsPerSecond = Math.floor((frameRate / 30) * 2500000);
                const audioBitsPerSecond = 128000; // 128kbps for audio

                const recorder = new MediaRecorder(finalStream, {
                    mimeType,
                    videoBitsPerSecond,
                    audioBitsPerSecond
                });
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = async (e) => {
                    if (e.data.size > 0) {
                        const buffer = await e.data.arrayBuffer();
                        window.electron.saveChunk(buffer);
                    }
                };

                // Show countdown if enabled (AFTER all setup is complete)
                if (countdown) {
                    // Show countdown window
                    await window.electron.showCountdown();

                    // Start countdown from 3
                    for (let i = 3; i > 0; i--) {
                        await window.electron.updateCountdown(i);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    // Hide countdown window
                    await window.electron.hideCountdown();

                    // Wait a bit to ensure the countdown window is completely hidden
                    // before starting the recording (prevents countdown from appearing in recording)
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                recorder.start(1000); // 1-second chunks

                // Start UI State
                setIsRecording(true);
                setStatusText('Recording...');

                // Start Timer
                setSeconds(0);
                timerIntervalRef.current = setInterval(() => {
                    setSeconds(prev => prev + 1);
                }, 1000);

            } catch (err) {
                if (err instanceof Error && (err.name === 'NotAllowedError' || err.message.includes('Permission denied'))) {
                    console.log('Recording cancelled by user');
                    setStatusText('Selection cancelled');
                    setTimeout(() => {
                        setStatusText('Ready to record');
                    }, 2000);

                    // Cleanup
                    setIsRecording(false);
                    if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null;
                    }
                } else {
                    console.error("Failed to start recording:", err);
                    // alert("Failed to start recording. See console for details.");

                    // Cleanup
                    setIsRecording(false);
                    if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null;
                    }
                }
            }

        } else {
            // Stop Recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                // Cleanup canvas if region recording
                if ((streamRef.current as ExtendedMediaStream)._cleanupCanvas) {
                    (streamRef.current as ExtendedMediaStream)._cleanupCanvas?.();
                }
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // UI Feedback immediately
            setIsRecording(false);
            setStatusText('Processing...');
            setStatusText('Processing...');

            // Stop Timer
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            setTimeout(async () => {
                const path = await window.electron.stopRecording(
                    saveDirectory || await window.electron.getDefaultSaveDirectory(),
                    format
                );
                if (path) {
                    setStatusText(`Saved to ${path.split('/').pop()}`);
                } else {
                    setStatusText('Save failed');
                }

                setTimeout(() => {
                    setStatusText('Ready to record');
                    setSeconds(0);
                }, 3000);
            }, 500);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    return (
        <>
            <main className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--color-background-dark)] relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)] opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 opacity-5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="w-full max-w-lg bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm z-10 font-sans">
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border-dark)] bg-[var(--color-surface-dark)]/50 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[var(--color-text-muted)]'}`}></span>
                            <span className="text-sm font-semibold text-[var(--color-text-muted)] tracking-wide uppercase">{statusText}</span>
                        </div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-lg hover:bg-[var(--color-background-dark)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all duration-200 cursor-pointer border border-transparent hover:border-[var(--color-border-dark)] active:scale-95"
                            title="Recording Settings"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-8 flex flex-col items-center gap-8 relative z-10">

                        {/* Timer Display */}
                        <div className="scale-110 mb-2 transform transition-transform duration-300">
                            <TimerDisplay seconds={seconds} />
                        </div>

                        {/* Main Record Button */}
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-[var(--color-primary)] rounded-full opacity-20 blur-xl transition-all duration-500 ${isRecording ? 'scale-150 animate-pulse' : 'scale-75 group-hover:scale-100'}`}></div>
                            <RecordButton
                                isRecording={isRecording}
                                onClick={toggleRecording}
                            />
                        </div>

                        {/* Controls Grid */}
                        <div className="w-full grid grid-cols-2 gap-3 mt-2">
                            {/* Source */}
                            <div className="col-span-2 bg-[var(--color-background-dark)]/50 border border-[var(--color-border-dark)] rounded-xl p-1 transition-colors hover:border-[var(--color-border-dark)]/80">
                                <SourceSelector
                                    selectedMode={sourceMode}
                                    onSelectMode={handleSourceModeChange}
                                />
                            </div>

                            {/* Audio */}
                            <div className="bg-[var(--color-background-dark)]/50 border border-[var(--color-border-dark)] rounded-xl p-3 flex flex-col justify-center transition-all hover:bg-[var(--color-background-dark)]/80 group/audio hover:border-[var(--color-primary)]/30">
                                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2 tracking-wider ml-1 group-hover/audio:text-[var(--color-primary)] transition-colors">Audio</span>
                                <AudioControls
                                    micActive={micActive}
                                    onToggleMic={() => setMicActive(!micActive)}
                                    systemActive={systemActive}
                                    onToggleSystem={() => setSystemActive(!systemActive)}
                                />
                            </div>

                            {/* Format */}
                            <div className="bg-[var(--color-background-dark)]/50 border border-[var(--color-border-dark)] rounded-xl p-3 flex flex-col justify-center transition-all hover:bg-[var(--color-background-dark)]/80 group/format hover:border-[var(--color-primary)]/30">
                                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2 tracking-wider ml-1 group-hover/format:text-[var(--color-primary)] transition-colors">Format</span>
                                <FormatSelector
                                    format={format}
                                    onFormatChange={handleFormatChange}
                                />
                            </div>

                            {/* Region Info (Conditional) */}
                            {sourceMode === 'region' && selectedRegion && (
                                <div className="col-span-2 bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Region</span>
                                        <span className="text-sm text-[var(--color-text-primary)] font-mono font-medium">
                                            {selectedRegion.width} × {selectedRegion.height}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.electron && window.electron.openRegionSelector) {
                                                window.electron.openRegionSelector();
                                            }
                                        }}
                                        className="text-xs font-medium text-[var(--color-primary)] hover:text-white hover:bg-[var(--color-primary)] transition-all duration-200 px-3 py-1.5 rounded-md border border-[var(--color-primary)] cursor-pointer active:scale-95 shadow-sm"
                                    >
                                        Reselect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                frameRate={frameRate}
                onFrameRateChange={handleFrameRateChange}
                saveDirectory={saveDirectory}
                onSelectDirectory={handleSelectDirectory}
                showCursor={showCursor}
                onShowCursorChange={handleShowCursorChange}
                countdown={countdown}
                onCountdownChange={handleCountdownChange}
                audioDevices={audioDevices}
                selectedMicId={selectedMicId}
                onMicChange={handleMicChange}
            />
        </>
    );
}
