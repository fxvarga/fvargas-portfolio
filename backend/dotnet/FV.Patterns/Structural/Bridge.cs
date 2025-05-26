namespace FV.Patterns.Structural.Bridge
{
    public interface IImplementor
    {
        void OperationImpl();
    }

    public class ConcreteImplementorA : IImplementor
    {
        public void OperationImpl()
        {
            Console.WriteLine("ConcreteImplementorA: OperationImpl");
        }
    }

    public class ConcreteImplementorB : IImplementor
    {
        public void OperationImpl()
        {
            Console.WriteLine("ConcreteImplementorB: OperationImpl");
        }
    }

    public abstract class Abstraction
    {
        protected IImplementor _implementor;

        protected Abstraction(IImplementor implementor)
        {
            _implementor = implementor;
        }
        public abstract void Operation();

    }
    public class RefinedAbstraction : Abstraction
    {
        public RefinedAbstraction(IImplementor implementor) : base(implementor) { }

        public override void Operation()
        {
            Console.WriteLine("RefinedAbstraction: Operation");
            _implementor.OperationImpl();
        }
    }
    public class Client
    {
        public void Main()
        {
            IImplementor implementorA = new ConcreteImplementorA();
            Abstraction abstractionA = new RefinedAbstraction(implementorA);
            abstractionA.Operation();

            IImplementor implementorB = new ConcreteImplementorB();
            Abstraction abstractionB = new RefinedAbstraction(implementorB);
            abstractionB.Operation();
        }
    }
}