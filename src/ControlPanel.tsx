import React from 'react';

const ControlPanel: React.FC<{ onChangeSpeed: (speed: number) => void; onTogglePause: () => void }> = ({
                                                                                                           onChangeSpeed,
                                                                                                           onTogglePause
                                                                                                       }) => {
    const [isPaused, setIsPaused] = React.useState(false);

    const handlePause = () => {
        setIsPaused(!isPaused);
        onTogglePause();
    };

    return (
        <div>
            <button onClick={handlePause}>{isPaused ? 'Resume' : 'Pause'}</button>
            <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                defaultValue="3"
                onChange={e => onChangeSpeed(Number(e.target.value))}
            />
        </div>
    );
};

export default ControlPanel;
