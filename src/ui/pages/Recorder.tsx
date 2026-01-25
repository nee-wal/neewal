
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
        return saved ? parseInt(saved, 10) : 60;
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

    // Status text logic
    const [statusText, setStatusText] = useState('Ready to record');
    const [statusColor, setStatusColor] = useState('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');

    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const toggleRecording = () => {
        if (!isRecording) {
            // Start Recording
            setIsRecording(true);
            setStatusText('Recording...');
            setStatusColor('text-[var(--color-record)] bg-[var(--color-record)]/10 border-[var(--color-record)]/20');

            // Start Timer
            setSeconds(0);
            timerIntervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);

        } else {
            // Stop Recording
            setIsRecording(false);
            setStatusText('Saving to ~/Videos...');
            setStatusColor('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');

            // Stop Timer
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            // Reset after delay
            setTimeout(() => {
                setStatusText('Ready to record');
                setStatusColor('text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20');
                setSeconds(0);
            }, 2000);
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
                            onSelectMode={setSourceMode}
                        />

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
