namespace FV.Patterns.Structural.Adapter
{
    // Target interface
    public interface ITarget
    {
        string Request();
    }

    // Adaptee class
    public class Adaptee
    {
        public string SpecificRequest()
        {
            return "Specific request from Adaptee";
        }
    }
    public class Adapter : ITarget
    {
        private readonly Adaptee _adaptee;

        public Adapter(Adaptee adaptee)
        {
            _adaptee = adaptee;
        }

        public string Request()
        {
            // Call the specific request from the adaptee and adapt it to the target interface
            return _adaptee.SpecificRequest();
        }
    }
    public class Client
    {
        public void Main()
        {
            // Create an instance of the adaptee
            Adaptee adaptee = new Adaptee();

            // Create an adapter for the adaptee
            ITarget target = new Adapter(adaptee);

            // Use the target interface to call the adapted method
            Console.WriteLine(target.Request());
        }
    }
}