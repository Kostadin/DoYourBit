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

public class SignalServer extends WebSocketServer{
	private class Client {
		public String nickname;
		public WebSocket socket;
		public GameSession session;
	}
	
	private class GameSession {
		public String id;
		public int level;
		public Client[] clients;
	}
	
	private HashSet<Client> clients = new HashSet<Client>();
	private ArrayList<Client> matchMakingQueue = new ArrayList<Client>();
	private HashMap<WebSocket, Client> clientBySocket = new HashMap<WebSocket, Client>();
	private HashMap<String, GameSession> gameSessionByID = new HashMap<String, GameSession>();
	private HashSet<WebSocket> unidentifiedSockets = new HashSet<WebSocket>(); 
	private Object registerLock = new Object();
	
	public SignalServer(int port) throws UnknownHostException {
		super(new InetSocketAddress(port));
	}

	@Override
	public void onClose(WebSocket socket, int arg1, String arg2, boolean arg3) {
		// TODO Auto-generated method stub
		System.out.println("CONNECTION CLOSED");
		try {
			synchronized (registerLock){
				if (clientBySocket.containsKey(socket)){
					Client c = clientBySocket.get(socket);
					clientBySocket.remove(socket);
					clients.remove(c);				
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
		System.out.println("ERROR "+arg1);
	}

	@Override
	public void onMessage(WebSocket socket, String message) {
		// TODO Auto-generated method stub
		System.out.println("RECEIVED MESSAGE");
		System.out.println( socket + ": " + message );
		//socket.send("RECEIVED THIS MESSAGE: "+socket + ": " + message);
		String[] lines = message.split("\n");
		if (lines.length>0){
			if (lines[0].equals("client") && lines.length>=2){
				boolean sendConfirmation = false;
				synchronized (registerLock){
					if (unidentifiedSockets.contains(socket)){
						Client c = new Client();
						c.nickname = lines[1];
						c.socket = socket;
						unidentifiedSockets.remove(c);
						clientBySocket.put(socket, c);
						clients.add(c);
						sendConfirmation = true;
					}
				}
				if (sendConfirmation) {
					socket.send("client:"+lines[0]);
					System.out.println(lines[0]);
					System.out.println(lines[1]);
					//System.out.println(lines[2]);
				}
			} else if (lines[0].equals("queue")) {
				boolean sendConfirmation = false;
				synchronized (registerLock) {
					Client client = clientBySocket.get(socket);
					if ((client != null)&&(client.session == null)&&(!matchMakingQueue.contains(client))) {
						matchMakingQueue.add(client);
						sendConfirmation = true;
					}
				}
				if (sendConfirmation) {
					socket.send("queue:OK");
				}
			}
		}
	}

	@Override
	public void onOpen(WebSocket socket, ClientHandshake handshake) {
		// TODO Auto-generated method stub
		System.out.println("CLIENT CONNECTED");
		socket.send("CONNECTION IS OPEN");
		synchronized (registerLock)
		{
			unidentifiedSockets.add(socket);
		}
	}
	
	public static void main( String[] args ) throws InterruptedException , IOException {
		WebSocketImpl.DEBUG = true;
		int port = 4420;
		try {
			port = Integer.parseInt(args[0]);
		} 
		catch (Exception ex){
			
		}
		SignalServer s = new SignalServer(port);
		s.start();
		System.out.println("SignalServer started on port: " + s.getPort());
		BufferedReader sysin = new BufferedReader( new InputStreamReader( System.in ) );
		while ( true ) {
			String in = sysin.readLine();
			//s.sendToAll( in );
			if( in.equals( "exit" ) ) {
				s.stop();
				break;
			}
		}
	}
}
