namespace FV.Patterns.Creational.Prototype
{
    public abstract class Prototype
    {
        public abstract Prototype Clone();
    }

    public class ConcretePrototypeA : Prototype
    {
        public string? FieldA { get; set; }

        public override Prototype Clone()
        {
            return new ConcretePrototypeA { FieldA = this.FieldA };
        }
    }

    public class ConcretePrototypeB : Prototype
    {
        public string? FieldB { get; set; }

        public override Prototype Clone()
        {
            return new ConcretePrototypeB { FieldB = this.FieldB };
        }
    }
    public class Client
    {
        public void Main()
        {
            ConcretePrototypeA prototypeA = new ConcretePrototypeA { FieldA = "FieldA" };
            ConcretePrototypeB prototypeB = new ConcretePrototypeB { FieldB = "FieldB" };

            Prototype cloneA = prototypeA.Clone();
            Prototype cloneB = prototypeB.Clone();

            Console.WriteLine($"Clone A: {((ConcretePrototypeA)cloneA).FieldA}");
            Console.WriteLine($"Clone B: {((ConcretePrototypeB)cloneB).FieldB}");
        }
    }
}
