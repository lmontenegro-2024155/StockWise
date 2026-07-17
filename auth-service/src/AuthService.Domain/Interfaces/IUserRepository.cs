using System;
using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface IUserRepository
{
    Task<User> CreateUserAsync(User user);
    Task<User> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync (string email);
    Task<User?> GetByUsernameAsync (string username);
    Task<User?> GetByEmailVerificationTokenAsync (string token);
    Task<User?> GetByPasswordResetTokenAsync (string token);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameAsync(string username);
    Task<User> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(string id);
    Task UpdateUserRoleAsync(string userId, string roleId);

}
