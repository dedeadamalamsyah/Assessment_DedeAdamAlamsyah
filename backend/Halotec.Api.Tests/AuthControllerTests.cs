using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Halotec.Api.Controllers;
using Halotec.Api.Data;
using Halotec.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Halotec.Api.Tests;

public class AuthControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("Filename=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        var inMemorySettings = new Dictionary<string, string?>
    {
        {"JwtSettings:SecretKey", "KunciRahasiaHalotecSuperPanjangDanAman123!"},
        {"JwtSettings:Issuer", "HalotecIssuer"},
        {"JwtSettings:Audience", "HalotecAudience"}
    };

        IConfiguration realConfiguration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _controller = new AuthController(_context, realConfiguration);
    }

    [Fact]
    public async Task Register_WithNewEmail_ReturnsOkResult()
    {
        var request = new RegisterRequest("dedeadamalamsyah9", "dedeadamalamsyah9@halotec.com", "SecurePass123");

        var result = await _controller.Register(request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ReturnsBadRequest()
    {
        var existingUser = new User
        {
            Username = "existing",
            Email = "duplicate@halotec.com",
            PasswordHash = "hashed"
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new RegisterRequest("newuser", "duplicate@halotec.com", "AnyPassword");

        var result = await _controller.Register(request);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Email sudah terdaftar!", badRequestResult.Value);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        var rawPassword = "MySecretPassword";
        var user = new User
        {
            Username = "testuser",
            Email = "test@halotec.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest("test@halotec.com", rawPassword);

        var result = await _controller.Login(request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        var user = new User
        {
            Username = "testuser",
            Email = "test@halotec.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword")
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest("test@halotec.com", "WrongPassword");

        var result = await _controller.Login(request);

        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Email atau password salah!", unauthorizedResult.Value);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}