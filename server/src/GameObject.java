public abstract class GameObject implements Cloneable{
	public boolean passable;
	public boolean deadly;
	
	public Object clone() {
		throw new UnsupportedOperationException();
	}
	
	public abstract void appendToSB(StringBuilder sb);
}