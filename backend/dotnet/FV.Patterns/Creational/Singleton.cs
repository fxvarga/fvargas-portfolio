namespace FV.Patterns.Creational.Singleton
{
    public class Singleton
    {
        private static Singleton? _instance;
        private static readonly object _lock = new object();

        // Private constructor to prevent instantiation from outside
        private Singleton()
        {
            // Initialization code here
        }

        // Public method to get the instance of the singleton class
        public static Singleton Instance
        {
            get
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new Singleton();
                    }
                    return _instance;
                }
            }
        }
    }
}