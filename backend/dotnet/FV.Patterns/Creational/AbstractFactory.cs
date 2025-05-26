namespace FV.Patterns.Creational.AbstractFactory
{
    public interface IProductA
    {
        string Name { get; }
        void Use();
    }

    public interface IProductB
    {
        string Name { get; }
        void Use();
    }

    public class ConcreteProductA1 : IProductA
    {
        public string Name => "ConcreteProductA1";

        public void Use()
        {
            Console.WriteLine("Using ConcreteProductA1");
        }
    }
    public class ConcreteProductA2 : IProductA
    {
        public string Name => "ConcreteProductA2";

        public void Use()
        {
            Console.WriteLine("Using ConcreteProductA2");
        }
    }
    public interface IAbstractFactory
    {
        IProductA CreateProduct();
    }
    public class ConcreteFactory1 : IAbstractFactory
    {
        public IProductA CreateProduct()
        {
            return new ConcreteProductA1();
        }
    }
}