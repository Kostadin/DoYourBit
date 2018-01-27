public class GameDoor extends GameObject {
	public int triggerId;
	public GameDoor(boolean closed, int triggerId) {
		this.triggerId = triggerId;
		passable = !closed;
		deadly = true;
	}
	
	public Object clone() {
		GameDoor copy = new GameDoor(!passable, triggerId);
		copy.deadly = deadly;
		return copy;
	}
	
	@Override
	public void appendToSB(StringBuilder sb) {
		if (!passable) {
			sb.append("[2,0]");
		} else {
			sb.append("[2,1]");
		}
		
	}
}