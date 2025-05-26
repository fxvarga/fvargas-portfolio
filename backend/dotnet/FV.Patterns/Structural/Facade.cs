namespace FV.Patterns.Structural.Facade
{
    public class SubsystemA
    {
        public void OperationA()
        {
            Console.WriteLine("Subsystem A: Operation A");
        }
    }

    public class SubsystemB
    {
        public void OperationB()
        {
            Console.WriteLine("Subsystem B: Operation B");
        }
    }

    public class SubsystemC
    {
        public void OperationC()
        {
            Console.WriteLine("Subsystem C: Operation C");
        }
    }

    public class Facade
    {
        private readonly SubsystemA _subsystemA;
        private readonly SubsystemB _subsystemB;
        private readonly SubsystemC _subsystemC;

        public Facade()
        {
            _subsystemA = new SubsystemA();
            _subsystemB = new SubsystemB();
            _subsystemC = new SubsystemC();
        }
        public void Operation1()
        {
            Console.WriteLine("Facade: Operation 1");
            _subsystemA.OperationA();
            _subsystemB.OperationB();
        }
        public void Operation2()
        {
            Console.WriteLine("Facade: Operation 2");
            _subsystemB.OperationB();
            _subsystemC.OperationC();
        }
        public void Operation3()
        {
            Console.WriteLine("Facade: Operation 3");
            _subsystemA.OperationA();
            _subsystemC.OperationC();
        }

    }
    public class Client
    {
        public void Main()
        {
            Facade facade = new Facade();
            facade.Operation1();
            facade.Operation2();
            facade.Operation3();
        }
    }
}
