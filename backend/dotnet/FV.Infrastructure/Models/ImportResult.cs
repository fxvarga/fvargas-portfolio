namespace FV.Infrastructure.Models; public class ImportResult
{
    /// <summary>
    /// A boolean indicating whether the import is successful.
    /// </summary>
    public bool IsSuccessful => !string.IsNullOrWhiteSpace(this.CollectionName);

    /// <summary>
    /// The name of the collection that the document is inserted to.
    /// </summary>
    public string CollectionName { get; set; }

    /// <summary>
    /// Create a new instance of the <see cref="ImportResult"/> class.
    /// </summary>
    /// <param name="collectionName">The name of the collection that the document is inserted to.</param>
    public ImportResult(string collectionName)
    {
        this.CollectionName = collectionName;
    }

    /// <summary>
    /// Create a new instance of the <see cref="ImportResult"/> class representing a failed import.
    /// </summary>
    public static ImportResult Fail { get; } = new(string.Empty);
}