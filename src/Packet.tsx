import React, { useEffect, useState, useRef } from 'react';
import {Circle, Group, Rect, Text} from 'react-konva';

export type PacketType = 'heartbeat' | 'vote-req' | 'vote-res';

type PacketProps = {
    id: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: PacketType;
    progress: number; // Progress amount (0 to distance)
    onComplete: (id: number) => void;
};

const Packet: React.FC<PacketProps> = ({ id, fromX, fromY, toX, toY, type, progress, onComplete }) => {
    const [position, setPosition] = useState({ x: fromX, y: fromY });
    const [isHovered, setIsHovered] = useState(false);
    const [isArrived, setIsArrived] = useState(false);
    const animationFrameId = useRef<number | null>(null);

    const getColor = () => {
        switch (type) {
            case "heartbeat":
                return 'pink';
            case "vote-req":
                return 'rgb(0, 173, 181)';
            case "vote-res":
                return 'green';
            default:
                return 'gray';
        }
    };

    useEffect(() => {
        if (isArrived) {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            return;
        }

        const animate = () => {
            const totalDistance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);

            const factor = progress / totalDistance;

            const newX = fromX + (toX - fromX) * factor;
            const newY = fromY + (toY - fromY) * factor;

            setPosition({ x: newX, y: newY });

            // Check if the packet has reached the destination
            if (factor < 1) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                // Packet has arrived
                setIsArrived(true);
                onComplete(id);
            }
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [fromX, fromY, toX, toY, id, onComplete, isArrived, progress]);

    if (isArrived) {
        return null;
    }

    return <Group x={position.x} y={position.y}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        <Circle radius={5} fill={getColor()} />
        {isHovered && (
            <>
                <Rect
                    x={10}
                    y={-25}
                    width={200}
                    height={100}
                    fill="rgba(0, 0, 0, 0.5)"
                    cornerRadius={5}
                />
                <Text
                    text={`Progress: ${progress}\nType: ${type}`}
                    fontSize={18}
                    fill="white"
                    x={15}
                    y={-20}
                />
            </>
        )}
    </Group>;
};

export default Packet;
