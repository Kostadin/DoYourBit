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
	private class Client {
		public String nickname;
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

		public void start() {
			simStarted = false;
			clients[0].socket.send("start:0");
			clients[1].socket.send("start:1");
		}

		public void terminate(String reason) {
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
		}
	}

	public enum GameOp {
		WAIT,//0
		MOVE,//1
		ROTATE_LEFT,//2
		ROTATE_RIGHT//3
	}
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
		// TODO Auto-generated method stub
		System.out.println("ERROR " + arg1);
	}

	@Override
	public void onMessage(WebSocket socket, String message) {
		// TODO Auto-generated method stub
		System.out.println("RECEIVED MESSAGE");
		System.out.println(socket + ": " + message);
		// socket.send("RECEIVED THIS MESSAGE: "+socket + ": " + message);
		String[] lines = message.split("\n");
		if (lines.length > 0) {
			if (lines[0].equals("client") && lines.length >= 2) {
				boolean sendConfirmation = false;
				synchronized (registerLock) {
					if (unidentifiedSockets.contains(socket)) {
						Client c = new Client();
						c.nickname = lines[1];
						c.socket = socket;
						unidentifiedSockets.remove(socket);
						clientBySocket.put(socket, c);
						clients.add(c);
						sendConfirmation = true;
					}
				}
				if (sendConfirmation) {
					socket.send("client:" + lines[0]);
					System.out.println(lines[0]);
					System.out.println(lines[1]);
					// System.out.println(lines[2]);
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
			} else if (lines[0].equals("start")) {
				Client client = null;
				boolean startOK = false;
				synchronized (registerLock) {
					client = clientBySocket.get(socket);
				}
				if ((client != null) && (client.session != null) && (client.session.simStarted == false)) {
					for (int i=0;i<2;++i) {
						if (client.session.clients[i] == client) {
							client.session.startVotes[i] = true;
							startOK = true;
							break;
						}
					}
				}
				if (startOK) {
					client.socket.send("start:OK");
				}
			} else if (lines[0].equals("stop")) {
				Client client = null;
				boolean stopOK = false;
				synchronized (registerLock) {
					client = clientBySocket.get(socket);
				}
				if ((client != null) && (client.session != null) && (client.session.simStarted == true)) {
					for (int i=0;i<2;++i) {
						if (client.session.clients[i] == client) {
							client.session.stopVotes[i] = true;
							stopOK = true;
							break;
						}
					}
				}
				if (stopOK) {
					client.socket.send("stop:OK");
				}
			} else if (lines[0].equals("submit")) {
				Client client = null;
				boolean submitOK = false;
				synchronized (registerLock) {
					client = clientBySocket.get(socket);
				}
				if ((client != null) && (client.session != null) && (client.session.simStarted == false)) {
					GameOp[] newInstructions = new GameOp[lines.length-1];
					int j = 0;
					for (int i=0;i<lines.length;++i) {
						try {
							int idx = Integer.parseInt(lines[i+1]);
							if ((idx>=0)&&(idx<gameOpValues.length)) {
								GameOp op = gameOpValues[idx];
								newInstructions[j++] = op;
							}
						} catch (Exception ex) {
							// Ignored
						}
					}
				}
				if (submitOK) {
					client.socket.send("submit:OK");
				}
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
		System.out.println("SignalServer started on port: " + s.getPort());
		BufferedReader sysin = new BufferedReader(new InputStreamReader(System.in));
		while (true) {
			String in = sysin.readLine();
			// s.sendToAll( in );
			if (in.equals("exit")) {
				s.stop();
				break;
			}
		}
	}
}
