public class GameButtonPlatform extends GameObject {
	public int triggerId;
	public GameButtonPlatform(int triggerId) {
		this.triggerId = triggerId;
		passable = true;
		deadly = false;
	}
	
	public Object clone() {
		GameButtonPlatform copy = new GameButtonPlatform(triggerId);
		copy.passable = passable;
		copy.deadly = deadly;
		return copy;
	}
	
	@Override
	public void appendToSB(StringBuilder sb) {
		sb.append("[3,0]");
	}
}