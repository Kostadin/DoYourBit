import java.io.*;
import java.util.*;
import com.google.gson.*;

public class GameState implements Cloneable{
	public int levelId;
	public int width;
	public int height;
	public ArrayList<ArrayList<ArrayList<GameObject>>> level; // y, x, objects

	private GameState(int levelId, int width, int height) {
		this.levelId = levelId;
		this.width = width;
		this.height = height;
	}
	
	public GameState(int levelId) {
		this.levelId = levelId;
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
					} else {
						ArrayList<GameObject> tile = new ArrayList<GameObject>(1);
						tile.add(parseDefinition(definition.get(rowTile.getAsString())));
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
	
	public Object clone() {
		GameState clone = new GameState(levelId, width, height);
		if (level != null) {
			clone.level = new ArrayList<ArrayList<ArrayList<GameObject>>>(level.size());
			for (ArrayList<ArrayList<GameObject>> originalRow : clone.level) {
				ArrayList<ArrayList<GameObject>> clonedRow = new ArrayList<ArrayList<GameObject>>(originalRow.size());
				for (ArrayList<GameObject> originalTile : originalRow) {
					ArrayList<GameObject> clonedTile = new ArrayList<GameObject>();
					for (GameObject gameObj : originalTile) {
						clonedTile.add((GameObject)gameObj.clone());
					}
					clonedRow.add(clonedTile);
				}
				clone.level.add(clonedRow);
			}
		}
		return clone;
	}
}
