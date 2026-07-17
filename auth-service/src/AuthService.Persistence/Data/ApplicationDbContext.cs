using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<UserProfile> UserProfiles { get; set; } = null!;
    public DbSet<UserEmail> UserEmails { get; set; } = null!;
    public DbSet<UserPasswordReset> UserPasswordResets { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ApplySnakeCase(modelBuilder);

        ConfigureUser(modelBuilder);
        ConfigureUserProfile(modelBuilder);
        ConfigureRole(modelBuilder);
        ConfigureProduct(modelBuilder);
        ConfigureUserRole(modelBuilder);
        ConfigureUserEmail(modelBuilder);
        ConfigureUserPasswordReset(modelBuilder);
    }

    private static void ApplySnakeCase(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
                entity.SetTableName(ToSnakeCase(tableName));

            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (!string.IsNullOrEmpty(columnName))
                    property.SetColumnName(ToSnakeCase(columnName));
            }

            foreach (var key in entity.GetKeys())
            {
                var keyName = key.GetName();
                if (!string.IsNullOrEmpty(keyName))
                    key.SetName(ToSnakeCase(keyName));
            }

            foreach (var index in entity.GetIndexes())
            {
                var indexName = index.GetDatabaseName();
                if (!string.IsNullOrEmpty(indexName))
                    index.SetDatabaseName(ToSnakeCase(indexName));
            }
        }
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Name).IsRequired().HasMaxLength(25);
            entity.Property(e => e.Surname).IsRequired().HasMaxLength(25);
            entity.Property(e => e.Username).IsRequired();
            entity.Property(e => e.Email).IsRequired();

            entity.Property(e => e.Password)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Status).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();

            entity.HasOne(e => e.UserProfile)
                .WithOne(p => p.User)
                .HasForeignKey<UserProfile>(p => p.UserId);

            entity.HasMany(e => e.UserRoles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId);

            entity.HasOne(e => e.UserEmail)
                .WithOne(ue => ue.User)
                .HasForeignKey<UserEmail>(ue => ue.UserId);

            entity.HasOne(e => e.UserPasswordReset)
                .WithOne(upr => upr.User)
                .HasForeignKey<UserPasswordReset>(upr => upr.UserId);
        });
    }

    private static void ConfigureUserProfile(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId).HasMaxLength(16);
            entity.Property(e => e.ProfilePicture).HasDefaultValue("");
            entity.Property(e => e.Phone).HasMaxLength(8);
        });
    }

    private static void ConfigureRole(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
        });
    }

    private static void ConfigureProduct(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Stock).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
        });
    }

    private static void ConfigureUserRole(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId).HasMaxLength(16);
            entity.Property(e => e.RoleId).HasMaxLength(16);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            entity.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);
        });
    }

    private static void ConfigureUserEmail(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEmail>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId).HasMaxLength(16);
            entity.Property(e => e.EmailVerified).HasDefaultValue(false);
            entity.Property(e => e.EmailVerificationToken).HasMaxLength(256);
        });
    }

    private static void ConfigureUserPasswordReset(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserPasswordReset>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(16)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId).HasMaxLength(16);
            entity.Property(e => e.PasswordResetToken).HasMaxLength(256);
        });
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e =>
                (e.Entity is User || e.Entity is Role || e.Entity is UserRole) &&
                (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var now = DateTime.UtcNow;

            switch (entry.Entity)
            {
                case User user:
                    if (entry.State == EntityState.Added) user.CreatedAt = now;
                    user.UpdatedAt = now;
                    break;

                case Role role:
                    if (entry.State == EntityState.Added) role.CreatedAt = now;
                    role.UpdatedAt = now;
                    break;

                case Product product:
                    if (entry.State == EntityState.Added) product.CreatedAt = now;
                    product.UpdatedAt = now;
                    break;

                case UserRole userRole:
                    if (entry.State == EntityState.Added) userRole.CreatedAt = now;
                    userRole.UpdatedAt = now;
                    break;
            }
        }
    }

    private static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        return string.Concat(
            input.Select((c, i) => i > 0 && char.IsUpper(c) ? "_" + c : c.ToString())
        ).ToLower();
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }
}
