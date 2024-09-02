import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Layer, Stage} from 'react-konva';
import Node, {NodeType} from './Node';
import Packet, {PacketType} from './Packet';
import ControlPanel from './ControlPanel';
import NodeStateView from "./NodeStateView";
import {Network} from "./Network";

const getHeartbeatValue = () => Math.random() * 50 + 50;
const getVoteRequestValue = () => Math.random() * 50 + 100;

const resetNodeToFollower = (node: NodeType, term: number, currentLeader: number | null): NodeType => ({
    ...node,
    state: 'follower',
    term,
    progress: 0,
    requiredValue: getVoteRequestValue(),
    votedFor: null,
    currentLeader,
    inbox: [],
    voteGrantedCount: 0,
});

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

const RaftVisualization: React.FC = () => {
    const [maxNodeId, setMaxNodeId] = useState(3);
    const [currentTime, setCurrentTime] = useState(0);
    const [snapshots, setSnapshots] = useState<Record<number, Snapshot>>({});
    const [nodes, setNodes] = useState<Map<number, NodeType>>(new Map([
        [
            1,
            {
                id: 1,
                x: 100,
                y: 100,
                state: 'follower',
                term: 1,
                progress: 0,
                requiredValue: 100,
                networks: [2, 3],
                currentLeader: null,
                votedFor: null,
                inbox: [],
                voteGrantedCount: 0,
            }
        ],
        [
            2,
            {
                id: 2,
                x: 100,
                y: 300,
                state: 'follower',
                term: 1,
                progress: 0,
                requiredValue: 100,
                networks: [1, 3],
                currentLeader: null,
                votedFor: null,
                inbox: [],
                voteGrantedCount: 0,
            }
        ],
        [
            3,
            {
                id: 3,
                x: 400,
                y: 150,
                state: 'follower',
                term: 1,
                progress: 0,
                requiredValue: 100,
                networks: [1, 2],
                currentLeader: null,
                votedFor: null,
                inbox: [],
                voteGrantedCount: 0,
            }
        ],

    ]));

    const [packets, setPackets] = useState<Map<number, {
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        fromNodeId: number;
        toNodeId: number;
        type: PacketType;
        term: number;
        progress: number;
    }>>(new Map());
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(3);

    const packetIdCounter = useRef(0);

    const newNode = () => {
        const generateUniqueId = () => {
            setMaxNodeId(maxNodeId + 1);
            return maxNodeId;
        };
        return {
            id: generateUniqueId(),
            x: Math.random() * 600,
            y: Math.random() * 400,
            state: 'follower',
            term: 1,
            networks: [],
            progress: 0,
            currentLeader: null,
            inbox: [],
        };
    };

    const addNode = () => {

    };

    const addPacket = useCallback(
        (fromNodeId: number, toNodeId: number, term: number, type: PacketType) => {
            const fromNode = nodes.get(fromNodeId);
            const toNode = nodes.get(toNodeId);

            if (fromNode && toNode && fromNode.id !== toNode.id) {
                const newPacketId = packetIdCounter.current++;

                setPackets(prevPackets => {
                    const updatedPackets = new Map(prevPackets);
                    updatedPackets.set(newPacketId, {
                        fromX: fromNode.x,
                        fromY: fromNode.y,
                        toX: toNode.x,
                        toY: toNode.y,
                        fromNodeId: fromNodeId,
                        toNodeId: toNodeId,
                        type,
                        term,
                        progress: 0,
                    });
                    return updatedPackets;
                });
            }
        },
        [nodes, packetIdCounter] // Dependencies: only recompute when nodes or packetIdCounter changes
    );

    const progressDelta = 1;
    const heartBeatProgressDelta = 2;

    const handleNodeInbox = useCallback(() => {
        setNodes(prevNodes => {
            const newNodes = new Map(prevNodes);

            newNodes.forEach((node, id) => {
                let targetNode = { ...node };

                for (const packet of targetNode.inbox) {
                    // console.log(`Processing packet ${packet.type} from ${packet.fromNodeId}`);

                    if (packet.term < targetNode.term) {
                        // console.log(`Node ${targetNode.id} received a packet from an older term, ignoring`);
                        continue;
                    }
                    else if (packet.term > targetNode.term) {
                        // console.log(`Node ${targetNode.id} received a packet from a higher term`);
                        targetNode = resetNodeToFollower(targetNode, packet.term, null);
                    }

                    switch (packet.type) {
                        case 'heartbeat':
                            if (targetNode.state === "candidate" && targetNode.term <= packet.term) {
                                console.log(`Node ${targetNode.id} received heartbeat from ${packet.fromNodeId}`);
                                targetNode = resetNodeToFollower(targetNode, packet.term, packet.fromNodeId);
                            }
                            if (targetNode.state === 'follower' || targetNode.state === 'candidate') {
                                targetNode = {
                                    ...targetNode,
                                    progress: 0, // Reset progress
                                    requiredValue: getHeartbeatValue()
                                };
                            }
                            break;

                        case 'vote-req':
                            console.log(`Node ${targetNode.id} received vote request from ${packet.fromNodeId}`);

                            if (targetNode.state === 'follower') {
                                if (targetNode.term <= packet.term && targetNode.votedFor === null) {
                                    console.log(`Node ${targetNode.id} is eligible to vote for ${packet.fromNodeId}`);

                                    // Create a new updated node object
                                    targetNode = {
                                        ...targetNode,
                                        term: packet.term,
                                        votedFor: packet.fromNodeId
                                    };

                                    // // Update the node in the state
                                    // setNodes(prevNodes => {
                                    //     // Create a copy of the previous nodes
                                    //     const newNodes = new Map(prevNodes);
                                    //
                                    //     // Update the specific node
                                    //     newNodes.set(updatedNode.id, updatedNode);
                                    //
                                    //     // Log updated nodes for debugging
                                    //     console.log(`Nodes after update:`, Array.from(newNodes.entries()));
                                    //
                                    //     // Return the updated nodes map
                                    //     return newNodes;
                                    // });

                                    // Add the vote response packet
                                    addPacket(targetNode.id, packet.fromNodeId, targetNode.term, 'vote-res');

                                    // Log the updated state
                                    console.log(`Node ${targetNode.id} voted for ${packet.fromNodeId}, votedFor: ${targetNode.votedFor}`);
                                } else {
                                    // Log the reason for not voting
                                    console.log(`Node ${targetNode.id} did not vote for ${packet.fromNodeId} because it already voted for ${targetNode.votedFor}`);
                                }
                            }
                            break;

                        case 'vote-res':
                            console.log(`Node ${targetNode.id} received a response from ${packet.fromNodeId}`);
                            if (targetNode.state === 'candidate') {
                                // Become leader if majority of nodes voted for this node
                                if (targetNode.term === packet.term) {
                                    targetNode.voteGrantedCount++;
                                    if (targetNode.voteGrantedCount > targetNode.networks.length / 2) {
                                        console.log(`Node ${targetNode.id} became the leader`);
                                        targetNode.state = 'leader';
                                        targetNode.currentLeader = targetNode.id;
                                        targetNode.progress = 0;
                                        targetNode.requiredValue = getHeartbeatValue();
                                        targetNode.voteGrantedCount = 0;
                                        targetNode.votedFor = null;
                                    }
                                }
                            }
                            break;

                        default:
                            console.log(`Unknown packet type: ${packet.type}`);
                            break;
                    }
                }

                // Clear inbox after processing
                targetNode.inbox = [];
                newNodes.set(id, targetNode);
            });
            return newNodes;
        });
    }, [addPacket]);

    const updateNodeProgress = useCallback(() => {
        setNodes(prevNodes => {
            const newNodes = new Map(prevNodes);

            newNodes.forEach((node, id) => {
                let targetNode = {...node}; // Create a mutable copy of the node

                switch (targetNode.state) {
                    case 'leader': {
                        if (targetNode.progress === targetNode.requiredValue) {
                            targetNode.networks.forEach(toNodeId => {
                                console.log(`Sending heartbeat from ${targetNode.id} to ${toNodeId}`);
                                addPacket(targetNode.id, toNodeId, targetNode.term, 'heartbeat');
                            });
                            targetNode.progress = 0;
                            targetNode.requiredValue = getHeartbeatValue();
                        } else {
                            targetNode.progress = Math.min(targetNode.progress + heartBeatProgressDelta, targetNode.requiredValue);
                        }
                        break;
                    }

                    case 'follower': {
                        if (targetNode.progress === targetNode.requiredValue) {
                            targetNode = {
                                ...targetNode,
                                state: 'candidate',
                                term: targetNode.term + 1,
                                voteGrantedCount: 1,
                                votedFor: null,
                                progress: 1, // Instantly sending vote requests
                                requiredValue: 1,
                            };
                        } else {
                            targetNode.progress = Math.min(targetNode.progress + progressDelta, targetNode.requiredValue);
                        }
                        break;
                    }

                    case 'candidate': {
                        if (targetNode.progress === targetNode.requiredValue) {
                            targetNode.term += 1;
                            console.log(`Node ${targetNode.id} initiating an election`);
                            targetNode.networks.forEach(toNodeId => {
                                console.log(`Sending vote request from ${targetNode.id} to ${toNodeId}`);
                                addPacket(targetNode.id, toNodeId, targetNode.term, 'vote-req');
                            });
                            targetNode.progress = 0;
                            targetNode.requiredValue = getVoteRequestValue();
                            targetNode.votedFor = targetNode.id; // Vote for self
                        } else {
                            targetNode.progress = Math.min(targetNode.progress + progressDelta, targetNode.requiredValue);
                        }
                        break;
                    }
                }

                newNodes.set(id, targetNode);
            });
            return newNodes;
        });
    }, [addPacket, progressDelta]);

    const updatePacketProgress = useCallback(() => {
        setPackets(prevPackets => {
            const updatedPackets = new Map(prevPackets);
            updatedPackets.forEach((packet, id) => {
                updatedPackets.set(id, {...packet, progress: packet.progress + 10});
            });
            return updatedPackets;
        });
    }, []);

    const takeSnapshot = useCallback((time: number) => {
        setSnapshots(prevSnapshots => {
            const updatedSnapshots = {...prevSnapshots};
            updatedSnapshots[time] = {nodes, packets};
            return updatedSnapshots;
        });

    }, [nodes, packets]);

    const loadSnapshot = useCallback((time: number) => {
        const snapshot = snapshots[time];
        if (snapshot) {
            setNodes(snapshot.nodes);
            setPackets(snapshot.packets);
        }
    }, [snapshots]);

    const clearFutureSnapshots = useCallback((time: number) => {
        setSnapshots(prevSnapshots => {
            return Object.keys(prevSnapshots)
                .filter(key => Number(key) <= time)
                .reduce((acc, key) => {
                    acc[Number(key)] = prevSnapshots[Number(key)];
                    return acc;
                }, {} as Record<number, Snapshot>);
        });
    }, []);

    useEffect(() => {
        takeSnapshot(currentTime);
    }, [currentTime, takeSnapshot]);

    // Main tick loop
    useEffect(() => {
        if (isPaused) {
            return;
        }

        const combinedInterval = setInterval(() => {
            setCurrentTime(prevTime => prevTime + 1);
            takeSnapshot(currentTime);
            handleNodeInbox();
            updateNodeProgress();
            updatePacketProgress();
        }, 100 / speed);


        return () => {
            clearInterval(combinedInterval);
        };
    }, [isPaused, updateNodeProgress, speed, updatePacketProgress, handleNodeInbox, takeSnapshot, currentTime]);


    const previousTimeRef = useRef(currentTime);
    useEffect(() => {
        // Only load the snapshot if time has changed (either forward or backward)
        if (currentTime !== previousTimeRef.current) {
            loadSnapshot(currentTime);
        }

        previousTimeRef.current = currentTime;
    }, [currentTime, loadSnapshot]);
    const removeNode = (id: number) => {
        // setNodes(nodes.filter((node) => node.id !== id));
    };

    const handlePacketComplete = (id: number) => {
        const packet = packets.get(id);
        if (!packet) {
            return;
        }
        const fromNode = nodes.get(packet.fromNodeId);
        const toNode = nodes.get(packet.toNodeId);
        if (fromNode && toNode) {
            toNode.inbox.push({fromNodeId: packet.fromNodeId, term: fromNode.term, type: packet.type});
            setNodes(new Map(nodes).set(packet.toNodeId, toNode));
        }
        setPackets(prevPackets => {
            const updatedPackets = new Map(prevPackets);
            updatedPackets.delete(id); // Remove the packet by ID
            return updatedPackets;
        });
    };

    const changeSpeed = (newSpeed: number) => {
        console.log(newSpeed);
        setSpeed(newSpeed);
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    const handleHover = (time: number) => {
        setIsPaused(true);  // Pause when previewing
        loadSnapshot(time);
    };

    const handleMouseLeave = () => {
        // Load last snapshot when mouse leaves
        const lastSnapshotTime = Math.max(...Object.keys(snapshots).map(Number));
        loadSnapshot(lastSnapshotTime - 1);
    };

    const handleTimeClick = (time: number) => {
        setCurrentTime(time);
        loadSnapshot(time);
        clearFutureSnapshots(time);
    };

    return (
        <>
            <Stage width={window.innerWidth} height={400}>
                <Layer>
                    {Array.from(nodes).map(([id, node]) => (
                        node.networks.map(connectionId => {
                            const targetNode = nodes.get(connectionId);

                            return targetNode && <Network networks={[{
                                fromNodeId: node.id,
                                toNodeId: targetNode.id,
                                fromX: node.x,
                                fromY: node.y,
                                toX: targetNode.x,
                                toY: targetNode.y
                            }]}/>
                        })
                    ))}
                </Layer>
                <Layer>
                    {Array.from(nodes).map(([id, node]) => (
                        <Node key={id} node={node}/>
                    ))}
                    {[...packets.entries()].map(([id, packet]) => (
                        <Packet
                            key={id}
                            id={id}
                            fromX={packet.fromX}
                            fromY={packet.fromY}
                            toX={packet.toX}
                            toY={packet.toY}
                            type={packet.type}
                            progress={packet.progress}
                            onComplete={handlePacketComplete}
                        />
                    ))}

                </Layer>
            </Stage>
            <NodeStateView
                snapshots={snapshots}
                onHover={handleHover}
                onMouseLeave={handleMouseLeave}
                onTimeClick={handleTimeClick}
            />
            <ControlPanel onChangeSpeed={changeSpeed} onTogglePause={togglePause}/>
            {/*<button onClick={addNode}>Add Node</button> // TODO: Implement addNode */}
        </>
    );
};

export default RaftVisualization;
