using System.Security.Claims;
using System.Text;
using Halotec.Api.Data;
using Halotec.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class ScansController : ControllerBase
{
    private readonly AppDbContext _context;

    public ScansController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetScans([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.ScanRecords.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(s => s.QRCodeContent.ToLower().Contains(search.ToLower()));
        }

        var totalItems = await query.CountAsync();

        var scans = await query
            .OrderByDescending(s => s.ScannedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            data = scans,
            total = totalItems,
            currentPage = page,
            pageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetScanById(int id)
    {
        var scan = await _context.ScanRecords.FindAsync(id);

        if (scan == null)
            return NotFound(new { message = "Data scan tidak ditemukan" });

        return Ok(scan);
    }

    [HttpPost]
    public async Task<IActionResult> CreateScan([FromBody] ScanRecord scan)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        scan.UserId = userId;
        scan.ScannedAt = DateTime.UtcNow;

        _context.ScanRecords.Add(scan);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetScans), new { id = scan.Id }, scan);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateScan(int id, [FromBody] UpdateNotesRequest request)
    {
        var scan = await _context.ScanRecords.FindAsync(id);

        if (scan == null) return NotFound("Data scan tidak ketemu");

        scan.Notes = request.Notes;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Notes berhasil diupdate!" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteScan(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var scan = await _context.ScanRecords.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (scan == null) return NotFound();

        _context.ScanRecords.Remove(scan);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportScans()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var scans = await _context.ScanRecords
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.ScannedAt)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("ID,Konten QR,Status,Waktu Scan,Catatan");

        foreach (var scan in scans)
        {
            var localTime = scan.ScannedAt.ToLocalTime();

            var line = $"{scan.Id},{scan.QRCodeContent},{(scan.IsValid ? "Valid" : "Invalid")},{localTime:dd/MM/yyyy HH:mm:ss},{scan.Notes}";
            csv.AppendLine(line);
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "history.csv");
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var total = await _context.ScanRecords.CountAsync();
        var valid = await _context.ScanRecords.CountAsync(s => s.IsValid);
        var invalid = total - valid;

        return Ok(new { total, valid, invalid });
    }
}

public record UpdateNotesRequest(string Notes);