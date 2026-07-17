using System;
using AuthService.Domain.Entities;
using AuthService.Domain.Constants;
using Microsoft.EntityFrameworkCore;
using AuthService.Application.Services;

namespace AuthService.Persistence.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await SeedRoles(context);
        await SeedAdminUser(context);
    }

    private static async Task SeedRoles(ApplicationDbContext context)
    {
        if (await context.Roles.AnyAsync()) return;

        var roles = new List<Role>
        {
            new()
            {
                Id = UuidGenerator.GenerateRoleId(),
                Name = RoleConstants.ADMIN_ROLE
            },
            new()
            {
                Id = UuidGenerator.GenerateRoleId(),
                Name = RoleConstants.USER_ROLE
            }
        };

        await context.Roles.AddRangeAsync(roles);
        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminUser(ApplicationDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        var adminRole = await context.Roles
            .FirstOrDefaultAsync(r => r.Name == RoleConstants.ADMIN_ROLE);

        if (adminRole == null) return;

        var passwordHasher = new PasswordHashService();

        var userId = UuidGenerator.GenerateUserId();
        var profileId = UuidGenerator.GenerateUserId();
        var emailId = UuidGenerator.GenerateUserId();
        var userRoleId = UuidGenerator.GenerateUserId();

        var adminUser = new User
        {
            Id = userId,
            Name = "Admin User",
            Surname = "Admin Surname",
            Username = "admin",
            Email = "ksadmin@local.com",
            Password = passwordHasher.HashPassword("Kinal2026!"),
            Status = true,

            UserProfile = new UserProfile
            {
                Id = profileId,
                UserId = userId,
                ProfilePicture = string.Empty,
                Phone = "00000000"
            },

            UserEmail = new UserEmail
            {
                Id = emailId,
                UserId = userId,
                EmailVerified = true,
                EmailVerificationToken = null,
                EmailVerificationTokenExpiry = null
            },

            UserRoles =
            [
                new UserRole
                {
                    Id = userRoleId,
                    UserId = userId,
                    RoleId = adminRole.Id
                }
            ]
        };

        await context.Users.AddAsync(adminUser);
        await context.SaveChangesAsync();
    }
}
