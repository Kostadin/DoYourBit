public class GamePlayer extends GameObject {
	public int playerId;
	public PlayerDirection direction;
	public GamePlayer(int playerId) {		
		this.playerId = playerId;
		passable = true;
		deadly = false;
		direction = PlayerDirection.UP;
	}
	
	public void rotateLeft() {
		switch (direction) {
			case UP:
				direction = PlayerDirection.LEFT;
				break;
			case RIGHT:
				direction = PlayerDirection.UP;
				break;
			case DOWN:
				direction = PlayerDirection.RIGHT;
				break;
			case LEFT:
				direction = PlayerDirection.DOWN;
				break;
			default:
				break;
		}
	}
	
	public void rotateRight() {
		switch (direction) {
			case UP:
				direction = PlayerDirection.RIGHT;
				break;
			case RIGHT:
				direction = PlayerDirection.DOWN;
				break;
			case DOWN:
				direction = PlayerDirection.LEFT;
				break;
			case LEFT:
				direction = PlayerDirection.UP;
				break;
			default:
				break;
		}
	}
	
	public Object clone() {
		GamePlayer copy = new GamePlayer(playerId);
		copy.direction = direction;
		copy.passable = passable;
		copy.deadly = deadly;
		return copy;
	}
	
	@Override
	public void appendToSB(StringBuilder sb) {
		sb.append("[5,");
		sb.append(playerId);
		sb.append(",");
		sb.append(direction.ordinal());
		sb.append("]");
	}
}
