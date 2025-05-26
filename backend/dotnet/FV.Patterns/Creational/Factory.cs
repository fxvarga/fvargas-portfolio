namespace FV.Patterns.Creational.Factory
{
    public interface IProduct
    {
        string Name { get; }
        void Use();
    }

    public class ConcreteProductA : IProduct
    {
        public string Name => "ConcreteProductA";

        public void Use()
        {
            Console.WriteLine("Using ConcreteProductA");
        }
    }

    public class ConcreteProductB : IProduct
    {
        public string Name => "ConcreteProductB";

        public void Use()
        {
            Console.WriteLine("Using ConcreteProductB");
        }
    }

    public abstract class Creator
    {
        public abstract IProduct FactoryMethod(string type);
    }
    public class ConcreteCreator : Creator
    {
        public override IProduct FactoryMethod(string type)
        {
            return type switch
            {
                "A" => new ConcreteProductA(),
                "B" => new ConcreteProductB(),
                _ => throw new ArgumentException("Invalid product type")
            };
        }
    }
}