import {Line, Text} from "react-konva";
import React, {useState} from "react";

interface NetworkProps {
    networks: {
        fromNodeId: number;
        toNodeId: number;
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
    }[];
}

export const Network: React.FC<NetworkProps> = ({networks}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div>
            {networks.map(network => (
                <>
                    <Line
                        key={`${network.fromNodeId}-${network.toNodeId}`}
                        points={[network.fromX, network.fromY, network.toX, network.toY]}
                        stroke="lightgray"
                        strokeWidth={5}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    />
                    {isHovered && (
                        <Text
                            x={(network.fromX + network.toX) / 2 + 10}
                            y={(network.fromY + network.toY) / 2}
                            text={`${network.fromNodeId} <-> ${network.toNodeId}`}
                            fill="black"
                        />
                    )}
                </>
            ))}
        </div>
    );
};
