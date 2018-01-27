public class GameFloor extends GameObject {
	public GameFloor() {
		passable = true;
		deadly = false;
	}
	
	public Object clone() {
		GameFloor copy = new GameFloor();
		copy.passable = passable;
		copy.deadly = deadly;
		return copy;
	}

	@Override
	public void appendToSB(StringBuilder sb) {
		sb.append("[0,0]");
	}
}
