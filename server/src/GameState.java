import java.io.*;
import java.util.*;
import com.google.gson.*;

public class GameState implements Cloneable {
	public int levelId;
	public int width;
	public int height;
	public int commandIndex;
	public ArrayList<ArrayList<ArrayList<GameObject>>> level; // y, x, objects

	private GameState(int levelId, int width, int height, int commandIndex) {
		this.levelId = levelId;
		this.width = width;
		this.height = height;
		this.commandIndex = commandIndex;
	}

	public GameState(int levelId) {
		this.levelId = levelId;
		this.commandIndex = 0;
		try {
			JsonObject jsonLevel = new JsonParser().parse(new FileReader("levels/level" + levelId + ".json"))
					.getAsJsonObject();
			HashMap<String, JsonObject> definition = new HashMap<String, JsonObject>();
			JsonObject jsonDef = jsonLevel.get("definition").getAsJsonObject();
			for (String key : jsonDef.keySet()) {
				definition.put(key, jsonDef.get(key).getAsJsonObject());
			}
			JsonArray map = jsonLevel.get("map").getAsJsonArray();
			height = map.size();
			level = new ArrayList<ArrayList<ArrayList<GameObject>>>(height);
			for (int y = 0; y < height; ++y) {
				JsonArray row = map.get(y).getAsJsonArray();
				width = Math.max(width, row.size());
				ArrayList<ArrayList<GameObject>> levelRow = new ArrayList<ArrayList<GameObject>>(row.size());
				for (int x = 0; x < row.size(); ++x) {
					JsonElement rowTile = row.get(x);
					if (rowTile.isJsonArray()) {
						JsonArray tileArray = rowTile.getAsJsonArray();
						ArrayList<GameObject> tile = new ArrayList<GameObject>(tileArray.size());
						for (JsonElement elem : tileArray) {
							tile.add(parseDefinition(definition.get(elem.getAsString())));
						}
						levelRow.add(tile);
					} else {
						ArrayList<GameObject> tile = new ArrayList<GameObject>(1);
						tile.add(parseDefinition(definition.get(rowTile.getAsString())));
						levelRow.add(tile);
					}
				}
				level.add(levelRow);
			}
		} catch (Exception e) {
			System.err.println(e.getMessage());
			e.printStackTrace(System.err);
		}
	}

	public static GameObject parseDefinition(JsonObject definition) {
		if (definition != null) {
			String objectType = definition.get("type").getAsString();
			if (objectType != null) {
				if (objectType.equals("floor")) {
					return new GameFloor();
				} else if (objectType.equals("wall")) {
					return new GameWall();
				} else if (objectType.equals("player")) {
					return new GamePlayer(definition.get("playerId").getAsInt());
				} else if (objectType.equals("door")) {
					return new GameDoor(definition.get("closed").getAsBoolean(),
							definition.get("triggerId").getAsInt());
				} else if (objectType.equals("button")) {
					return new GameButtonPlatform(definition.get("triggerId").getAsInt());
				} else if (objectType.equals("goal")) {
					return new GameGoal();
				}
			}
		}
		return null;
	}

	public boolean isPassable(int x, int y) {
		ArrayList<GameObject> tile = level.get(y).get(x);
		boolean passable = true;
		for (GameObject gameObj : tile) {
			passable &= gameObj.passable;
		}
		return passable;
	}

	public boolean isDeadly(int x, int y) {
		ArrayList<GameObject> tile = level.get(y).get(x);
		boolean deadly = false;
		for (GameObject gameObj : tile) {
			deadly |= gameObj.deadly;
		}
		return deadly;
	}

	public boolean isGoal(int x, int y) {
		ArrayList<GameObject> tile = level.get(y).get(x);
		boolean goal = false;
		for (GameObject gameObj : tile) {
			goal |= (gameObj instanceof GameGoal);
		}
		return goal;
	}

	public GamePlayer getPlayer(int x, int y, int playerId) {
		ArrayList<GameObject> tile = level.get(y).get(x);
		for (GameObject gameObj : tile) {
			if (gameObj instanceof GamePlayer) {
				GamePlayer player = (GamePlayer) gameObj;
				if (player.playerId == playerId) {
					return player;
				}
			}
		}
		return null;
	}

	public void checkAndTrigger(int x, int y) {
		ArrayList<GameObject> tile = level.get(y).get(x);
		for (GameObject gameObj : tile) {
			if (gameObj instanceof GameButtonPlatform) {
				GameButtonPlatform button = (GameButtonPlatform) gameObj;
				notifyTriggerSubscribers(button.triggerId);
			}
		}

	}

	public void notifyTriggerSubscribers(int triggerId) {
		for (ArrayList<ArrayList<GameObject>> row : level) {
			for (ArrayList<GameObject> tile : row) {
				for (GameObject gameObj : tile) {
					if (gameObj instanceof GameDoor) {
						GameDoor door = (GameDoor) gameObj;
						if (door.triggerId == triggerId) {
							door.passable = !door.passable;
							door.deadly = !door.deadly;
						}
					}
				}
			}
		}
	}

	public Object clone() {
		GameState clone = new GameState(levelId, width, height, commandIndex);
		if (level != null) {
			clone.level = new ArrayList<ArrayList<ArrayList<GameObject>>>(level.size());
			for (ArrayList<ArrayList<GameObject>> originalRow : level) {
				ArrayList<ArrayList<GameObject>> clonedRow = new ArrayList<ArrayList<GameObject>>(originalRow.size());
				for (ArrayList<GameObject> originalTile : originalRow) {
					ArrayList<GameObject> clonedTile = new ArrayList<GameObject>();
					for (GameObject gameObj : originalTile) {
						clonedTile.add((GameObject) gameObj.clone());
					}
					clonedRow.add(clonedTile);
				}
				clone.level.add(clonedRow);
			}
		}
		return clone;
	}
}
