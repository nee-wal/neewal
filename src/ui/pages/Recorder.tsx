
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Settings2 } from 'lucide-react';
import { RecordButton } from '../components/RecordButton';
import { TimerDisplay } from '../components/TimerDisplay';
import { SourceSelector } from '../components/SourceSelector';
import { AudioControls } from '../components/AudioControls';
import { FormatSelector } from '../components/FormatSelector';
import { SettingsModal } from '../components/SettingsModal';

export default function Recorder() {
    const { signOut, user, isGuest } = useAuth();
    const navigate = useNavigate();

    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [sourceMode, setSourceMode] = useState<SourceMode>('screen');
    const [micActive, setMicActive] = useState(true);
    const [systemActive, setSystemActive] = useState(false);
    const [format, setFormat] = useState('mp4');
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

    useEffect(() => {
        if (!saveDirectory && window.electron && window.electron.getDefaultSaveDirectory) {
            window.electron.getDefaultSaveDirectory().then(setSaveDirectory);
        }
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
    const [statusColor, setStatusColor] = useState('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');

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
                        micStream = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: false // Sometimes helpful for music/high quality, but check
                            },
                            video: false
                        });
                    } catch (err) {
                        console.warn("Could not get microphone stream", err);
                    }
                }

                // Combine tracks using Web Audio API for better mixing if multiple audio sources exist
                const tracks = [...desktopStream.getVideoTracks()];
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

                recorder.start(1000); // 1-second chunks

                // Start UI State
                setIsRecording(true);
                setStatusText('Recording...');
                setStatusColor('text-[var(--color-record)] bg-[var(--color-record)]/10 border-[var(--color-record)]/20');

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
                        setStatusColor('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');
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
            setStatusColor('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');

            // Stop Timer
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            setTimeout(async () => {
                const path = await window.electron.stopRecording(saveDirectory || await window.electron.getDefaultSaveDirectory());
                if (path) {
                    setStatusText(`Saved to ${path.split('/').pop()}`);
                } else {
                    setStatusText('Save failed');
                }

                setTimeout(() => {
                    setStatusText('Ready to record');
                    setStatusColor('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');
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
        <div className="flex h-screen flex-col bg-[var(--color-background-dark)] text-[var(--color-text-primary)] font-sans">
            <header
                className="flex h-14 items-center justify-between border-b border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] px-4">
                <div className="flex items-center gap-2 font-semibold">
                    <span className="text-[var(--color-primary)]">⦿</span> Neewal
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {isGuest ? (
                        <>
                            <span className="text-[var(--color-text-muted)]">Guest</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/login', { state: { canClose: true } })}
                            >
                                Login
                            </Button>
                        </>
                    ) : (
                        <>
                            <span className="text-[var(--color-text-muted)]">{user?.email}</span>
                            <Button variant="outline" size="sm" onClick={() => signOut()}>
                                Logout
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-8 bg-[var(--color-background-dark)]">
                {/* Main Content Area (simulating the app body from the snippet) */}
                <div className="w-[380px] bg-[var(--color-surface-dark)] border border-[var(--color-border-dark)] rounded-xl shadow-2xl overflow-hidden flex flex-col pt-4"> {/* Removed title bar, added pt-4 */}

                    {/* Settings Trigger - Positioned absolutely or integrated */}
                    <div className="absolute top-20 right-1/2 translate-x-[200px] hidden"> {/* Optional: Positioning might be tricky without relative parent */}
                    </div>

                    <div className="px-4 pb-2 flex justify-end">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                            title="Settings"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 pt-0 flex flex-col items-center gap-6">

                        {/* Status Indicator */}
                        <div className="w-full text-center">
                            <span className={`text-xs font-mono px-2 py-1 rounded border transition-colors duration-300 ${statusColor}`}>
                                {statusText}
                            </span>
                        </div>

                        {/* Timer Display */}
                        <TimerDisplay seconds={seconds} />

                        {/* Main Record Button */}
                        <RecordButton
                            isRecording={isRecording}
                            onClick={toggleRecording}
                        />

                        {/* Divider */}
                        <div className="w-full h-px bg-[var(--color-border-dark)]"></div>

                        {/* Source Selector */}
                        <SourceSelector
                            selectedMode={sourceMode}
                            onSelectMode={handleSourceModeChange}
                        />

                        {/* Region Info Display */}
                        {sourceMode === 'region' && selectedRegion && (
                            <div className="w-full bg-[var(--color-background-dark)] border border-[var(--color-border-dark)] rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-[var(--color-text-muted)]">Selected Region</span>
                                        <span className="text-sm text-[var(--color-text-primary)] font-mono">
                                            {selectedRegion.width} × {selectedRegion.height}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.electron && window.electron.openRegionSelector) {
                                                window.electron.openRegionSelector();
                                            }
                                        }}
                                        className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors px-2 py-1 rounded border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] cursor-pointer"
                                    >
                                        Reselect
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Audio Controls */}
                        <AudioControls
                            micActive={micActive}
                            onToggleMic={() => setMicActive(!micActive)}
                            systemActive={systemActive}
                            onToggleSystem={() => setSystemActive(!systemActive)}
                        />

                        {/* Format Selector */}
                        <FormatSelector
                            format={format}
                            onFormatChange={setFormat}
                        />

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
            />
        </div>
    );
}
