public class GameWall extends GameObject {
	public GameWall() {
		passable = false;
		deadly = false;
	}
	
	public Object clone() {
		GameWall copy = new GameWall();
		copy.passable = passable;
		copy.deadly = deadly;
		return copy;
	}
	
	@Override
	public void appendToSB(StringBuilder sb) {
		sb.append("[1,0]");
	}
}