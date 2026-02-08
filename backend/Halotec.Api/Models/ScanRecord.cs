using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Halotec.Api.Models;

public class ScanRecord
{
    public int Id { get; set; }

    [Required]
    public string QRCodeContent { get; set; } = string.Empty;

    public bool IsValid { get; set; }

    public string? Notes { get; set; }

    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }
}