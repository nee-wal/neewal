import { useNavigate, useLocation } from 'react-router-dom';
import VideoEditor from './VideoEditor';

export default function VideoEditorRoute() {
    const navigate = useNavigate();
    const location = useLocation();
    const videoPath = location.state?.videoPath as string | undefined;

    if (!videoPath) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--color-background-dark)] text-[var(--color-text-muted)]">
                <p>No video selected for editing.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg"
                >
                    Back to Recorder
                </button>
            </div>
        );
    }

    return (
        <VideoEditor
            videoPath={videoPath}
            onBack={() => navigate('/')}
        />
    );
}
