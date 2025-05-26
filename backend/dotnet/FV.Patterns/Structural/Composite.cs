namespace FV.Patterns.Structural.Composite
{
    public interface IComponent
    {
        void Operation();
    }

    public class Leaf : IComponent
    {
        private readonly string _name;

        public Leaf(string name)
        {
            _name = name;
        }

        public void Operation()
        {
            Console.WriteLine($"Leaf {_name} Operation");
        }
    }

    public class Composite : IComponent
    {
        private readonly List<IComponent> _children = new List<IComponent>();

        public void Add(IComponent component)
        {
            _children.Add(component);
        }
        public void Remove(IComponent component)
        {
            _children.Remove(component);
        }
        public void Operation()
        {
            Console.WriteLine("Composite Operation");
            foreach (var child in _children)
            {
                child.Operation();
            }
        }
    }
    public class Client
    {
        public void Main()
        {
            // Create leaf components
            IComponent leaf1 = new Leaf("Leaf 1");
            IComponent leaf2 = new Leaf("Leaf 2");

            // Create a composite component
            Composite composite = new Composite();
            composite.Add(leaf1);
            composite.Add(leaf2);

            // Perform operations on the composite
            composite.Operation();
        }
    }
}