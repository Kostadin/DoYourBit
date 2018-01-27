import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.*;

import org.java_websocket.WebSocket;
import org.java_websocket.WebSocketImpl;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class GameServer extends WebSocketServer {
	public static final int HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds
	public static final int STATE_UPDATE_INTERVAL_MS = 250; // 250 milliseconds;
	public static final int MAX_INSTRUCTIONS = 50;
	public static final int[][] MOVE_VECTORS = new int[][] {{0, -1}, {1, 0}, {0, 1}, {-1, 0}};

	private class Client {
		public WebSocket socket;
		public GameSession session;
		public GameOp[] instructions;
	}

	private class GameSession {
		public String id;
		public int level;
		public Client[] clients;
		public boolean[] startVotes = new boolean[] { false, false };
		public boolean[] stopVotes = new boolean[] { false, false };
		public boolean simStarted;
		public boolean sessionActive = true;
		public GameState initialState;
		public GameState currentState;
		public Object lock = new Object();

		public void start() {
			simStarted = false;
			initialState = new GameState(level);
			clients[0].socket.send("start:0");
			clients[1].socket.send("start:1");
			simThread.start();
		}

		public void terminate(String reason) {
			synchronized (lock) {
				simStarted = false;
				sessionActive = false;
			}
			synchronized (registerLock) {
				gameSessionByID.remove(this.id);
				sessions.remove(this);
			}
			for (int i = 0; i < 2; ++i) {
				Client c = clients[i];
				if (c != null) {
					c.session = null;
					c.socket.send("termination:" + reason);
				}
			}
			simThread.interrupt();
		}

		public void dualSend(String msg) {
			for (int i = 0; i < clients.length; ++i) {
				Client c = clients[i];
				if (c != null) {
					c.socket.send(msg);
				}
			}
		}

		public Thread simThread = new Thread(new Runnable() {
			@Override
			public void run() {
				while (sessionActive) {
					try {
						synchronized (lock) {
							if (simStarted) {
								// Initialize
								if (currentState == null) {
									currentState = (GameState) initialState.clone();
								}

								// Update
								GameState newState = (GameState) currentState.clone();
								newState.commandIndex += 1;
								int[][] playerCoords = new int[2][2];
								int y = 0;
								for (ArrayList<ArrayList<GameObject>> row : newState.level) {
									int x = 0;
									for (ArrayList<GameObject> tile : row) {
										for (GameObject gameObj : tile) {
											if (gameObj instanceof GamePlayer) {
												GamePlayer p = (GamePlayer) gameObj;
												int idx = p.playerId;
												playerCoords[idx][0] = x;
												playerCoords[idx][1] = y;
											}
										}
										++x;
									}
									++y;
								}
								boolean levelWon = false;
								boolean levelLost = false;
								boolean noMoreCommands = false;
								if ((newState.commandIndex >= clients[0].instructions.length)
										&& (newState.commandIndex >= clients[1].instructions.length)) {
									noMoreCommands = true;
									// Check for win condition
									if (newState.isGoal(playerCoords[0][0], playerCoords[0][1])
											&& newState.isGoal(playerCoords[1][0], playerCoords[1][1])) {
										levelWon = true;
									}
								}
								if (!levelWon) {
									// Execute commands
									for (int playerId = 0; playerId<2; ++playerId) {
										Client c = clients[playerId];
										if (c.instructions.length<newState.commandIndex) { // We have commands to execute
											int[] coords = playerCoords[playerId];
											GameOp op = c.instructions[newState.commandIndex];
											switch(op) {
												case WAIT:
													// Do nothing
													break;
												case MOVE:
													GamePlayer player = newState.getPlayer(coords[0], coords[1], playerId);
													int[] moveDelta = MOVE_VECTORS[player.direction.ordinal()];
													int[] newCoords = new int[] {coords[0]+moveDelta[0], coords[1]+moveDelta[1]};
													// Check for move validity
													if ((newCoords[1]>=0)&&(newCoords[1]<newState.level.size()&&(newCoords[0]>=0)&&(newCoords[0]<newState.level.get(newCoords[1]).size()))) {
														// Valid coords
														if (newState.isPassable(newCoords[0], newCoords[1])) {
															newState.checkAndTrigger(coords[0], coords[1]);
															newState.level.get(coords[1]).get(coords[0]).remove(player);
															newState.level.get(newCoords[1]).get(newCoords[0]).add(player);
															playerCoords[playerId] = newCoords;
															newState.checkAndTrigger(newCoords[0], newCoords[1]);
														}
													}
													break;
												case ROTATE_LEFT:
													newState.getPlayer(coords[0], coords[1], playerId).rotateLeft();
													break;
												case ROTATE_RIGHT:
													newState.getPlayer(coords[0], coords[1], playerId).rotateRight();
													break;
											}
										}
									}
									// Check for deadly scenario
									for (int playerId = 0; playerId<2; ++playerId) {
										int[] coords = playerCoords[playerId];
										if (newState.isDeadly(coords[0], coords[1])) {
											levelLost = true;
											break;
										}
									}
								}
								currentState = newState;

								// Send new state
								StringBuilder sb = new StringBuilder();
								sb.append("{\"state\":[");
								for (y = 0; y < currentState.height; ++y) {
									if (y > 0) {
										sb.append(",");
									}
									sb.append("[");
									ArrayList<ArrayList<GameObject>> row = currentState.level.get(y);
									for (int x = 0; x < row.size(); ++x) {
										ArrayList<GameObject> tile = row.get(x);
										if (x > 0) {
											sb.append(",");
										}
										sb.append("[");
										for (int i = 0; i < tile.size(); ++i) {
											if (i > 0) {
												sb.append(",");
											}
											tile.get(i).appendToSB(sb);
										}
										sb.append("]");
									}
									sb.append("]");
								}
								sb.append("]}");
								dualSend(sb.toString());
								if (levelWon) {
									// Notify for win condition
									terminate("You won!");
								} else if (levelLost) {
									// Notify for loss condition
									simStarted = false;
									dualSend("sim:stopped");
								} else if (noMoreCommands) {
									// Notify that there are no more commands to execute
									simStarted = false;
									dualSend("sim:stopped");
								}
							}
						}
						Thread.sleep(STATE_UPDATE_INTERVAL_MS);
					} catch (Exception ex) {
						System.err.println(ex.getMessage());
						ex.printStackTrace(System.err);
					}
				}
			}
		});
	}

	public enum GameOp {
		WAIT, // 0
		MOVE, // 1
		ROTATE_LEFT, // 2
		ROTATE_RIGHT// 3
	}

	private boolean sendHeartBeats = false;
	private GameOp[] gameOpValues = GameOp.values();
	private HashSet<Client> clients = new HashSet<Client>();
	private ArrayList<Client> matchMakingQueue = new ArrayList<Client>();
	private HashMap<WebSocket, Client> clientBySocket = new HashMap<WebSocket, Client>();
	private HashMap<String, GameSession> gameSessionByID = new HashMap<String, GameSession>();
	private HashSet<GameSession> sessions = new HashSet<GameSession>();
	private HashSet<WebSocket> unidentifiedSockets = new HashSet<WebSocket>();
	private Object registerLock = new Object();

	public GameServer(int port) throws UnknownHostException {
		super(new InetSocketAddress(port));
	}

	private Thread heartBeatThread = new Thread(new Runnable() {
		@Override
		public void run() {
			while (sendHeartBeats) {
				try {
					Client[] pingClients = null;
					synchronized (registerLock) {
						pingClients = clients.toArray(new Client[] {});
					}
					if ((pingClients != null) && (pingClients.length > 0)) {
						for (int i = 0; i < pingClients.length; ++i) {
							pingClients[i].socket.send("hb");
						}
					}
					Thread.sleep(HEARTBEAT_INTERVAL_MS);
				} catch (Exception ex) {
					// Ignore
				}
			}
		}
	});

	@Override
	public void onClose(WebSocket socket, int arg1, String arg2, boolean arg3) {
		// TODO Auto-generated method stub
		System.out.println("CONNECTION CLOSED");
		try {
			synchronized (registerLock) {
				if (clientBySocket.containsKey(socket)) {
					Client c = clientBySocket.get(socket);
					clientBySocket.remove(socket);
					clients.remove(c);
					if (c.session != null) {
						if (c.session.clients[0] == c) {
							c.session.clients[0] = null;
						}
						if (c.session.clients[1] == c) {
							c.session.clients[1] = null;
						}
						c.session.terminate("Player disconnected.");
					}
				} else {
					unidentifiedSockets.remove(socket);
				}
			}
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}

	@Override
	public void onError(WebSocket arg0, Exception arg1) {
		System.out.println("ERROR " + arg1);
	}

	@Override
	public void onMessage(WebSocket socket, String message) {
		try {
			System.out.println("RECEIVED MESSAGE");
			System.out.println(socket + ": " + message);
			String[] lines = message.split("\n");
			if (lines.length > 0) {
				if (lines[0].equals("client")) {
					boolean sendConfirmation = false;
					synchronized (registerLock) {
						if (unidentifiedSockets.contains(socket)) {
							Client c = new Client();
							c.socket = socket;
							unidentifiedSockets.remove(socket);
							clientBySocket.put(socket, c);
							clients.add(c);
							sendConfirmation = true;
						}
					}
					if (sendConfirmation) {
						socket.send("client:OK");
						System.out.println(lines[0]);
					}
				} else if (lines[0].equals("queue")) {
					boolean sendConfirmation = false;
					synchronized (registerLock) {
						Client client = clientBySocket.get(socket);
						if ((client != null) && (client.session == null) && (!matchMakingQueue.contains(client))) {
							matchMakingQueue.add(client);
							sendConfirmation = true;
						}
					}
					if (sendConfirmation) {
						socket.send("queue:OK");
						boolean startMatch = false;
						GameSession session = null;
						synchronized (registerLock) {
							if (matchMakingQueue.size() >= 2) {
								Client client1 = matchMakingQueue.get(0);
								Client client2 = matchMakingQueue.get(1);
								session = new GameSession();
								Random r = new Random();
								String id = null;
								do {
									id = new Integer(r.nextInt(Integer.MAX_VALUE)).toString();
								} while (gameSessionByID.containsKey(id));
								session.id = id;
								session.level = 0;
								session.clients = new Client[] { client1, client2 };
								client1.session = session;
								client2.session = session;
								gameSessionByID.put(id, session);
								sessions.add(session);
								startMatch = true;
							}
						}
						if (startMatch) {
							session.start();
						}
					}
				} else if (lines[0].equals("simStart")) {
					Client client = null;
					boolean startOK = false;
					synchronized (registerLock) {
						client = clientBySocket.get(socket);
					}
					if ((client != null) && (client.session != null)) {
						synchronized (client.session.lock) {
							if (client.session.simStarted == false) {
								for (int i = 0; i < 2; ++i) {
									if (client.session.clients[i] == client) {
										client.session.startVotes[i] = true;
										startOK = true;
										break;
									}
								}
							}

						}
					}
					if (startOK) {
						client.socket.send("simStart:OK");
						boolean didSimStart = false;
						synchronized (client.session.lock) {
							if ((!client.session.simStarted) && client.session.startVotes[0]
									&& client.session.startVotes[1]) {
								client.session.startVotes[0] = false;
								client.session.startVotes[1] = false;
								client.session.simStarted = true;
								didSimStart = true;
							}
						}
						if (didSimStart) {
							client.session.dualSend("sim:started");
						}
					}
				} else if (lines[0].equals("simStop")) {
					Client client = null;
					boolean stopOK = false;
					synchronized (registerLock) {
						client = clientBySocket.get(socket);
					}
					if ((client != null) && (client.session != null)) {
						synchronized (client.session.lock) {
							if (client.session.simStarted == true) {
								for (int i = 0; i < 2; ++i) {
									if (client.session.clients[i] == client) {
										client.session.stopVotes[i] = true;
										stopOK = true;
										break;
									}
								}
							}
						}
					}
					if (stopOK) {
						boolean didSimStop = false;
						synchronized (client.session.lock) {
							if (client.session.simStarted && client.session.stopVotes[0]
									&& client.session.stopVotes[1]) {
								client.session.stopVotes[0] = false;
								client.session.stopVotes[1] = false;
								client.session.simStarted = false;
								client.session.currentState = null;
								didSimStop = true;
							}
						}
						client.socket.send("simStop:OK");
						if (didSimStop) {
							client.session.dualSend("sim:stopped");
						}
					}
				} else if (lines[0].equals("submit")) {
					Client client = null;
					boolean submitOK = false;
					synchronized (registerLock) {
						client = clientBySocket.get(socket);
					}
					if ((client != null) && (client.session != null)) {
						synchronized (client.session.lock) {
							if (client.session.simStarted == false) {
								GameOp[] newInstructions = new GameOp[lines.length - 1];
								int j = 0;
								int inputLineCount = Math.min(lines.length - 1, MAX_INSTRUCTIONS);
								for (int i = 0; i < inputLineCount; ++i) {
									try {
										int idx = Integer.parseInt(lines[i + 1]);
										if ((idx >= 0) && (idx < gameOpValues.length)) {
											GameOp op = gameOpValues[idx];
											newInstructions[j++] = op;
										}
									} catch (Exception ex) {
										// Ignored
									}
								}
								client.instructions = newInstructions;
								submitOK = true;
							}
						}
					}
					if (submitOK) {
						client.socket.send("submit:OK");
					}
				}
			}
		} catch (Exception ex) {
			synchronized (registerLock) {
				System.err.println(ex.getMessage());
				ex.printStackTrace(System.err);
			}
		}
	}

	@Override
	public void onOpen(WebSocket socket, ClientHandshake handshake) {
		// TODO Auto-generated method stub
		System.out.println("CLIENT CONNECTED");
		socket.send("CONNECTION IS OPEN");
		synchronized (registerLock) {
			unidentifiedSockets.add(socket);
		}
	}

	public static void main(String[] args) throws InterruptedException, IOException {
		WebSocketImpl.DEBUG = true;
		int port = 4420;
		try {
			port = Integer.parseInt(args[0]);
		} catch (Exception ex) {

		}
		GameServer s = new GameServer(port);
		s.start();
		s.sendHeartBeats = true;
		s.heartBeatThread.start();
		System.out.println("SignalServer started on port: " + s.getPort());
		BufferedReader sysin = new BufferedReader(new InputStreamReader(System.in));
		while (true) {
			String in = sysin.readLine();
			if (in.equals("exit")) {
				s.sendHeartBeats = false;
				s.heartBeatThread.interrupt();
				s.stop();
				break;
			}
		}
	}
}
