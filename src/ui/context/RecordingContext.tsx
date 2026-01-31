import { createContext, useContext, useState, useRef, type ReactNode } from 'react';

interface RecordingContextType {
    isRecording: boolean;
    setIsRecording: (value: boolean) => void;
    isPaused: boolean;
    setIsPaused: (value: boolean) => void;
    seconds: number;
    setSeconds: (value: number | ((prev: number) => number)) => void;
    statusText: string;
    setStatusText: (value: string) => void;
    mediaRecorderRef: React.RefObject<MediaRecorder | null>;
    streamRef: React.RefObject<MediaStream | null>;
    timerIntervalRef: React.RefObject<NodeJS.Timeout | null>;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [statusText, setStatusText] = useState('Ready to record');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    return (
        <RecordingContext.Provider
            value={{
                isRecording,
                setIsRecording,
                isPaused,
                setIsPaused,
                seconds,
                setSeconds,
                statusText,
                setStatusText,
                mediaRecorderRef,
                streamRef,
                timerIntervalRef,
            }}
        >
            {children}
        </RecordingContext.Provider>
    );
}

export function useRecording() {
    const context = useContext(RecordingContext);
    if (context === undefined) {
        throw new Error('useRecording must be used within a RecordingProvider');
    }
    return context;
}
