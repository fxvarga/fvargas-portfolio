namespace FV.Patterns.Structural.Decorator
{
    public interface IComponent
    {
        void Operation();
    }

    public class ConcreteComponent : IComponent
    {
        public void Operation()
        {
            Console.WriteLine("ConcreteComponent Operation");
        }
    }

    public abstract class Decorator : IComponent
    {
        protected IComponent _component;

        protected Decorator(IComponent component)
        {
            _component = component;
        }

        public virtual void Operation()
        {
            _component.Operation();
        }
    }

    public class ConcreteDecoratorA : Decorator
    {
        public ConcreteDecoratorA(IComponent component) : base(component) { }
        public override void Operation()
        {
            base.Operation();
            Console.WriteLine("ConcreteDecoratorA Operation");
        }
    }
    public class ConcreteDecoratorB : Decorator
    {
        public ConcreteDecoratorB(IComponent component) : base(component) { }
        public override void Operation()
        {
            base.Operation();
            Console.WriteLine("ConcreteDecoratorB Operation");
        }
    }
    public class Client
    {
        public void Main()
        {
            IComponent component = new ConcreteComponent();
            component.Operation();

            IComponent decoratorA = new ConcreteDecoratorA(component);
            decoratorA.Operation();

            IComponent decoratorB = new ConcreteDecoratorB(decoratorA);
            decoratorB.Operation();
        }
    }
}
