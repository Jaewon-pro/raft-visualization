import React, {useState} from 'react';
import {getNodeStateColor, NodeType} from "./Node";
import {Group, Layer, Line, Rect, Stage, Text} from "react-konva";
import {PacketType} from "./Packet";

interface NodeGridProps {
    snapshots: Record<number, Snapshot>;
    onHover: (time: number) => void;
    onMouseLeave: () => void;
    onTimeClick: (time: number) => void;
}

type Snapshot = {
    nodes: Map<number, NodeType>;
    packets: Map<number, {
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        fromNodeId: number;
        toNodeId: number;
        type: PacketType;
        term: number;
        progress: number;
    }>;
}

interface NodeGridProps {
    snapshots: Record<number, Snapshot>;
}

const NodeGrid: React.FC<NodeGridProps> = ({snapshots, onHover, onMouseLeave, onTimeClick}) => {
    const [hoveredTime, setHoveredTime] = useState<number | null>(null);

    const startPos = 100;

    const timeGap = 1;
    const nodeGap = 40;
    const rectHeight = 16;

    // Collect all unique node IDs from all snapshots
    const allNodeIds = new Set<number>();
    for (const snapshot of Object.values(snapshots)) {
        snapshot.nodes.forEach((_, nodeId) => allNodeIds.add(nodeId));
    }

    const nodeIdsArray = Array.from(allNodeIds);
    const height = nodeIdsArray.length * nodeGap + startPos; // Height adjustment for all nodes

    const renderTimeline = () => {
        return nodeIdsArray.map((nodeId, index) => {
            const rects: React.ReactNode[] = [];

            let prevX = startPos; // Initial x position with margin

            const timeKeys = Object.keys(snapshots).map(Number).sort((a, b) => a - b);

            for (let i = 0; i < timeKeys.length; i++) {
                const time = timeKeys[i];
                const snapshot = snapshots[time];
                const node = snapshot.nodes.get(nodeId);
                const nextTime = i < timeKeys.length ? timeKeys[i + 1] : time + 1;

                if (node) {
                    const width = (nextTime - time) * timeGap;
                    const color = getNodeStateColor(node.state);

                    // Draw a rectangle for the current time step
                    rects.push(
                        <Rect
                            onMouseEnter={() => {
                                onHover(time);
                                setHoveredTime(time);
                            }}
                            onMouseLeave={() => {
                                onMouseLeave();
                                setHoveredTime(null);
                            }}
                            onClick={() => onTimeClick(time)}
                            key={`${nodeId}-${time}`}
                            x={prevX}
                            y={index * nodeGap + 50}
                            width={width}
                            height={rectHeight}
                            fill={color}
                        />
                    );
                    prevX += width; // Update x position for the next segment
                }
            }

            return (
                <Group key={nodeId}>
                    {rects}
                    <Text
                        x={10}
                        y={index * nodeGap + 50}
                        text={`Node ${nodeId}`}
                        fontSize={18}
                        fill="black"
                    />
                </Group>
            );
        });
    };

    const renderTimestampBar = (time: number) => {
        const xPosition = startPos + time * timeGap;

        return <Line
            points={[xPosition, 0, xPosition, height]}
            stroke="gray"
            strokeWidth={5}
            onClick={() => onTimeClick(time)}
        />;
    };

    return (
        <div>
            <Stage width={window.innerWidth} height={height + 100}>
                <Layer>
                    {renderTimeline()}
                    {hoveredTime && renderTimestampBar(hoveredTime)}
                </Layer>
            </Stage>
        </div>
    );
};

export default NodeGrid;
