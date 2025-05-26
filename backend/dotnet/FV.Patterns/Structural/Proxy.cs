namespace FV.Patterns.Structural.Proxy;
public interface IFileService
{
    void Delete(string filename);
}

public class FileService : IFileService
{
    public void Delete(string filename) => Console.WriteLine($"Deleted {filename}");
}

public class SecureFileProxy : IFileService
{
    private readonly IFileService _fileService;
    private readonly string _userRole;

    public SecureFileProxy(IFileService fileService, string userRole)
    {
        _fileService = fileService;
        _userRole = userRole;
    }

    public void Delete(string filename)
    {
        if (_userRole == "admin") _fileService.Delete(filename);
        else Console.WriteLine("Access denied.");
    }
}

public class Client
{
    public void Main()
    {
        IFileService fileService = new FileService();
        fileService.Delete("test.txt");

        IFileService proxy = new SecureFileProxy(fileService, "user");
        proxy.Delete("test.txt"); // Access denied.

        proxy = new SecureFileProxy(fileService, "admin");
        proxy.Delete("test.txt"); // Deleted test.txt
    }
}
