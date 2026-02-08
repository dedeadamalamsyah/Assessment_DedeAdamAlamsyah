using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Halotec.Api.Data;
using Halotec.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Halotec.Api.Tests;

public class ScansControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ScansController _controller;
    private const int TestUserId = 99;

    public ScansControllerTests()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("Filename=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        var testUser = new User
        {
            Id = TestUserId,
            Username = "tester",
            Email = "tester@halotec.com",
            PasswordHash = "dummyhashedpassword"
        };
        _context.Users.Add(testUser);
        _context.SaveChanges();

        _controller = new ScansController(_context);

        var userClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
            new Claim(ClaimTypes.Email, "tester@halotec.com")
        }, "TestAuthentication"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = userClaims }
        };
    }

    [Fact]
    public async Task GetScans_WithSearchKeyword_ReturnsFilteredData()
    {
        var record1 = new ScanRecord { QRCodeContent = "HALOTEC-VALID-123", IsValid = true, UserId = TestUserId };
        var record2 = new ScanRecord { QRCodeContent = "ANOTHER-CONTENT", IsValid = false, UserId = TestUserId };
        _context.ScanRecords.AddRange(record1, record2);
        await _context.SaveChangesAsync();

        var result = await _controller.GetScans(search: "HALOTEC", page: 1, pageSize: 10);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        var jsonOptions = new JsonSerializerOptions
        {
            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
            PropertyNameCaseInsensitive = true
        };

        var json = JsonSerializer.Serialize(okResult.Value, jsonOptions);
        using var doc = JsonDocument.Parse(json);
        int total = doc.RootElement.GetProperty("total").GetInt32();

        Assert.Equal(1, total);
    }

    [Fact]
    public async Task ExportScans_ReturnsValidCsvFile()
    {
        var record = new ScanRecord
        {
            QRCodeContent = "CSV-TEST",
            IsValid = true,
            UserId = TestUserId,
            ScannedAt = DateTime.UtcNow,
            Notes = "Aman"
        };
        _context.ScanRecords.Add(record);
        await _context.SaveChangesAsync();

        var result = await _controller.ExportScans();

        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("text/csv", fileResult.ContentType);
        Assert.Equal("history.csv", fileResult.FileDownloadName);

        var csvContent = Encoding.UTF8.GetString(fileResult.FileContents);
        Assert.Contains("CSV-TEST", csvContent);
        Assert.Contains("Valid", csvContent);
    }

    [Fact]
    public async Task GetStats_ReturnsCorrectSummary()
    {
        var records = new List<ScanRecord>
    {
        new() { QRCodeContent = "QR1", IsValid = true, UserId = TestUserId },
        new() { QRCodeContent = "QR2", IsValid = true, UserId = TestUserId },
        new() { QRCodeContent = "QR3", IsValid = false, UserId = TestUserId }
    };
        _context.ScanRecords.AddRange(records);
        await _context.SaveChangesAsync();

        var result = await _controller.GetStats();

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var json = JsonSerializer.Serialize(okResult.Value, jsonOptions);
        using var doc = JsonDocument.Parse(json);

        int totalScans = doc.RootElement.GetProperty("total").GetInt32();
        int validScans = doc.RootElement.GetProperty("valid").GetInt32();
        int invalidScans = doc.RootElement.GetProperty("invalid").GetInt32();

        Assert.Equal(3, totalScans);
        Assert.Equal(2, validScans);
        Assert.Equal(1, invalidScans);
    }

    [Fact]
    public async Task GetScanById_ExistingId_ReturnsOkWithData()
    {
        var record = new ScanRecord
        {
            Id = 10,
            QRCodeContent = "SPECIFIC-QR",
            IsValid = true,
            UserId = TestUserId
        };
        _context.ScanRecords.Add(record);
        await _context.SaveChangesAsync();

        var result = await _controller.GetScanById(10);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
        };

        var json = JsonSerializer.Serialize(okResult.Value, jsonOptions);
        using var doc = JsonDocument.Parse(json);

        string qrContent = doc.RootElement.GetProperty("QRCodeContent").GetString()!;
        Assert.Equal("SPECIFIC-QR", qrContent);
    }

    [Fact]
    public async Task DeleteScan_UserOwnsRecord_ReturnsNoContent()
    {
        var record = new ScanRecord
        {
            Id = 20,
            QRCodeContent = "DELETE-ME",
            IsValid = false,
            UserId = TestUserId
        };
        _context.ScanRecords.Add(record);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteScan(20);

        Assert.IsType<NoContentResult>(result);

        var existInDb = await _context.ScanRecords.AnyAsync(s => s.Id == 20);
        Assert.False(existInDb);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}