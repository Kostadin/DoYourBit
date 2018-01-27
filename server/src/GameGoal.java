public class GameGoal extends GameObject {
	public GameGoal() {
		passable = true;
		deadly = false;
	}
	
	public Object clone() {
		GameGoal copy = new GameGoal();
		copy.passable = passable;
		copy.deadly = deadly;
		return copy;
	}
	
	@Override
	public void appendToSB(StringBuilder sb) {
		sb.append("[4,0]");
	}
}