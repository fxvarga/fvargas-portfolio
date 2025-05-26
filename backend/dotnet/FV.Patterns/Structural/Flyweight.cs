namespace FV.Patterns.Structural.Flyweight;
public class TreeType
{
    public string Name { get; }
    public string Texture { get; }

    public TreeType(string name, string texture)
    {
        Name = name;
        Texture = texture;
    }

    public void Render(int x, int y)
    {
        Console.WriteLine($"Rendering {Name} at ({x},{y}) with texture {Texture}");
    }
}

public class TreeFactory
{
    private static readonly Dictionary<string, TreeType> _cache = new();

    public static TreeType GetTreeType(string name, string texture)
    {
        var key = $"{name}:{texture}";
        if (!_cache.ContainsKey(key))
            _cache[key] = new TreeType(name, texture);
        return _cache[key];
    }
}

public class Program
{
    public static void Main()
    {
        var oakType = TreeFactory.GetTreeType("Oak", "green.png");
        var pineType = TreeFactory.GetTreeType("Pine", "green.png");
        var birchType = TreeFactory.GetTreeType("Birch", "white.png");
        var otherBirchType = TreeFactory.GetTreeType("Birch", "white.png");

        oakType.Render(5, 10);
        pineType.Render(15, 20);
        birchType.Render(25, 30);
        otherBirchType.Render(35, 40);
    }
}
