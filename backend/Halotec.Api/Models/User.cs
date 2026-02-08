using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Halotec.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Username { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<ScanRecord> ScanRecords { get; set; } = new();
}