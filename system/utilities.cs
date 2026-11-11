
using System;

namespace AxeOS
{
    public class SystemInfo
    {
        public string Name => "axeOS";
        public string Version => "1.0.0";
        public string Architecture => "Hybrid";

        public void Display()
        {
            Console.WriteLine("axeOS System Information");
            Console.WriteLine("------------------------");
            Console.WriteLine($"Name: {Name}");
            Console.WriteLine($"Version: {Version}");
            Console.WriteLine($"Architecture: {Architecture}");
            Console.WriteLine("Status: Development");
        }
    }

    class Program
    {
        static void Main()
        {
            SystemInfo info = new SystemInfo();
            info.Display();
        }
    }
}
