import React, {useEffect, useState} from 'react';
import {Arc, Circle, Group, Rect, Text} from 'react-konva';

export type NodeState = 'leader' | 'follower' | 'candidate' | 'suspended';

export function getNodeStateColor(state: NodeState): string {
    switch (state) {
        case 'leader':
            return 'gold';
        case 'candidate':
            return 'blue';
        case 'follower':
            return 'lightblue';
        case 'suspended':
            return 'gray';
        default:
            return 'black';
    }
}

export interface NodeType {
    id: number;
    x: number;
    y: number;
    state: NodeState;
    term: number;
    progress: number; // Progress amount (0 to requiredValue)
    requiredValue: number; // Required value for the progress amount
    currentLeader: number | null;
    networks: number[];
    inbox: { fromNodeId: number; term: number, type: 'heartbeat' | 'vote-req' | 'vote-res' }[]; // Received packets
    votedFor: number | null;
    voteGrantedCount: number;
    onClick?: () => void; // Optional: handle node clicks, if needed
}

interface NodeProps {
    node: NodeType;
}

const Node: React.FC<NodeProps> = ({node}) => {
    const [arcAngle, setArcAngle] = useState(360);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const angle = 360 * (1 - (node.progress / node.requiredValue));
        setArcAngle(angle);
    }, [node.progress, node.requiredValue]);

    const getLine = () => {
        switch (node.state) {
            case "leader":
                return [];
            case "candidate":
                return [5, 5];
            case "follower":
                return [];
        }
    }

    return (
        <Group x={node.x} y={node.y}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}
        >
            {isHovered && (
                <>
                    <Rect
                        x={40}
                        y={-25}
                        width={200}
                        height={100}
                        fill="rgba(0, 0, 0, 0.5)"
                        cornerRadius={5}
                    />
                    <Text
                        text={`Progress: ${node.progress} / ${node.requiredValue}\nTerm: ${node.term}\nLeader: ${node.currentLeader}\nVoted For: ${node.votedFor}`}
                        fontSize={18}
                        fill="white"
                        x={45}
                        y={-20}
                    />
                </>
            )}
            <Circle
                radius={30}
                fill={getNodeStateColor(node.state)}
                stroke="black"
                strokeWidth={node.state === 'follower' ? 0 : 5}
                dash={getLine()}
            />
            <Circle
                radius={28}
                stroke="white"
                strokeWidth={4}
                angle={arcAngle}
                rotation={-90}
            />
            <Arc
                innerRadius={28}
                outerRadius={35}
                angle={arcAngle}
                rotation={-90} // Start the arc from the top
                fill="rgba(255, 0, 0, 0.5)"
            />
            <Text
                text={`Node ${node.id}`}
                fontSize={16}
                fill="white"
                x={-25}
                y={-15}
                width={50}
                align="center"
            />
            {node.state === 'candidate' && (
                <Text
                    x={40}
                    y={-10}
                    text={`Votes Received: ${node.voteGrantedCount || 0} / ${node.networks.length + 1}`}
                    fontSize={14}
                    fill="black"
                />)}
        </Group>)
};

export default Node;
